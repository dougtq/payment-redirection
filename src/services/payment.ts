import starkbank from 'starkbank';
import { SqsPayload } from '../types/sqs-payload';
import { sendSlackNotification } from './notification';

const initializeSdk = () => {
  starkbank.user = new starkbank.Project({
    id: process.env.STARK_PROJECT_ID || '',
    privateKey: process.env.STARK_PRIVATE_KEY || '',
    environment: 'sandbox', // or 'production'
  });
};

type PaymentResult = 
  | { success: true; transactionId: string }
  | { success: false; error: string };

export const payBoleto = async (params: {
  linhaDigitavel: string;
  valor: number;
  identifiers: SqsPayload;
}): Promise<PaymentResult> => {
  initializeSdk(); // Initialize SDK only when the function is called
  const { linhaDigitavel, valor, identifiers } = params;

  try {
    const payments = await starkbank.boleto.create([
      {
        line: linhaDigitavel,
        amount: valor,
        description: `Pagamento Acordo: ${identifiers.cid_acordo} / Parcela: ${identifiers.id_parcela}`,
        tags: ['payment-processor', identifiers.cid_acordo],
      },
    ]);

    const transaction = payments[0];
    if (!transaction || !transaction.id) {
      throw new Error('Transação da Stark Bank não retornou um ID.');
    }

    console.log('Pagamento de boleto realizado com sucesso:', { transactionId: transaction.id, ...identifiers });
    return { success: true, transactionId: transaction.id };

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido ao processar pagamento com a Stark Bank.';
    const notificationMessage = `Falha no pagamento do boleto. CIDs: ${JSON.stringify(identifiers)}. Erro: ${errorMessage}`;
    
    console.error(notificationMessage, error);
    await sendSlackNotification(notificationMessage);

    return { success: false, error: errorMessage };
  }
};
