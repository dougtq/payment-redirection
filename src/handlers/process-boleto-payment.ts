import { SQSEvent } from 'aws-lambda';
import { ZodError } from 'zod';
import { sqsPayloadSchema } from '../validators/sqs-payload-validator';
import { provideBoletoData } from '../services/data-provider';
import { payBoleto } from '../services/payment';
import { sendSlackNotification } from '../services/notification';

import { updateParcelStatus } from '../services/database';

const mapErrorToSlackMessage = (error: unknown): string => {
  if (error instanceof ZodError) {
    return 'ERRO PAYLOAD: Mensagem da fila com formato inválido.';
  }

  if (error instanceof Error) {
    // Starkbank Errors
    if (error.message.includes('InvalidBoletoId')) {
      return 'ERRO PAGAMENTO: Linha digitável inválida.';
    }
    if (error.message.includes('InvalidBalance')) {
      return 'ERRO PAGAMENTO: Saldo insuficiente.';
    }
    if (error.message.includes('Authentication Error')) {
      return 'ERRO PAGAMENTO: Falha de autenticação.';
    }
    // Database Errors
    if (error.message.includes('not found')) {
      return 'ERRO DB: Acordo, Boleto ou Pix não encontrado no banco de dados.';
    }
  }

  return 'ERRO GENÉRICO: Falha inesperada. Contate o suporte técnico.';
};

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      // 1. Schema Validation
      const payload = JSON.parse(record.body);
      const schemaResult = sqsPayloadSchema.safeParse(payload);
      if (!schemaResult.success) {
        throw schemaResult.error;
      }

      // 2. Data Provider
      const dataProviderResult = await provideBoletoData(schemaResult.data);
      if (!dataProviderResult.success) {
        throw new Error(dataProviderResult.error);
      }

      // 3. Payment Service
      const paymentResult = await payBoleto({
        ...dataProviderResult.data,
        identifiers: schemaResult.data,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      // 4. Update Database
      await updateParcelStatus(schemaResult.data.id_parcela, 'paid');

      console.log('Handler execution finished successfully.');
    } catch (error) {
      const errorMessage = mapErrorToSlackMessage(error);
      await sendSlackNotification(errorMessage);
      console.error('Handler execution failed:', error);
    }
  }
};