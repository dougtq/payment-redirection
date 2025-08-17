import starkbank from 'starkbank';
import { payBoleto } from '../../src/services/payment';
import * as notifications from '../../src/services/notification';
import { SqsPayload } from '../../src/types/sqs-payload';

// Mock the external services
jest.mock('starkbank');
jest.mock('../../src/services/notification');

const mockSendSlackNotification = notifications.sendSlackNotification as jest.Mock;

describe('Payment Service', () => {
  const mockBoleto = {
    line: '123456789',
    amount: 10000, // 100.00 BRL
  };

  const identifiers: SqsPayload = {
    cid_acordo: 'acordo-1',
    id_parcela: 1,
    cid_boleto: 'boleto-1',
  };

  it('SUCESSO: Deve realizar um pagamento e retornar o ID da transação', async () => {
    const mockTransaction = { id: 'trans-123' };
    (starkbank.boleto.create as jest.Mock).mockResolvedValue([mockTransaction]);

    const result = await payBoleto({ 
      linhaDigitavel: mockBoleto.line, 
      valor: mockBoleto.amount, 
      identifiers 
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.transactionId).toBe(mockTransaction.id);
    }
    expect(starkbank.boleto.create).toHaveBeenCalled();
    expect(mockSendSlackNotification).not.toHaveBeenCalled();
  });

  it('FALHA: Deve notificar no Slack se a linha digitável for inválida', async () => {
    const apiError = new Error('Invalid boleto line.');
    (starkbank.boleto.create as jest.Mock).mockRejectedValue(apiError);

    const result = await payBoleto({ 
      linhaDigitavel: 'invalid-line', 
      valor: mockBoleto.amount, 
      identifiers 
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(apiError.message);
    }
    expect(mockSendSlackNotification).toHaveBeenCalledWith(expect.stringContaining(apiError.message));
  });

  it('FALHA: Deve notificar no Slack se o saldo for insuficiente', async () => {
    const apiError = new Error('Insufficient funds.');
    (starkbank.boleto.create as jest.Mock).mockRejectedValue(apiError);

    const result = await payBoleto({ 
      linhaDigitavel: mockBoleto.line, 
      valor: 999999, 
      identifiers 
    });

    expect(result.success).toBe(false);
    expect(mockSendSlackNotification).toHaveBeenCalledWith(expect.stringContaining(apiError.message));
  });

  it('FALHA: Deve notificar no Slack em caso de erro genérico da API', async () => {
    const apiError = new Error('API is down.');
    (starkbank.boleto.create as jest.Mock).mockRejectedValue(apiError);

    const result = await payBoleto({ 
      linhaDigitavel: mockBoleto.line, 
      valor: mockBoleto.amount, 
      identifiers 
    });

    expect(result.success).toBe(false);
    expect(mockSendSlackNotification).toHaveBeenCalledWith(expect.stringContaining(apiError.message));
  });
});
