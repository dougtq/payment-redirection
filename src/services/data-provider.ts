import { SqsPayload } from '../types/sqs-payload';
import { getBoletoData } from './database';
import { sendSlackNotification } from './notification';

type ProviderResult = 
  | { success: true; data: { linhaDigitavel: string; valor: number } }
  | { success: false; error: string };

export const provideBoletoData = async (payload: SqsPayload): Promise<ProviderResult> => {
  if (!payload.cid_boleto) {
    const error = 'Processamento de boleto exige um cid_boleto não fornecido no payload.';
    // No need to notify slack for a malformed request that passed schema validation.
    return { success: false, error };
  }

  const boletoData = await getBoletoData(payload);

  if (!boletoData) {
    const error = `Dados do boleto não encontrados para a combinação de: cid_acordo=${payload.cid_acordo}, id_parcela=${payload.id_parcela}, cid_boleto=${payload.cid_boleto}`;
    await sendSlackNotification(error);
    return { success: false, error };
  }

  return { success: true, data: boletoData };
};
