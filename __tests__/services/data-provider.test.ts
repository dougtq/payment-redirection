import { provideBoletoData } from '../../src/services/data-provider';
import * as database from '../../src/services/database';
import * as notifications from '../../src/services/notification';
import { SqsPayload } from '../../src/types/sqs-payload';

// Mock the external services
jest.mock('../../src/services/database');
jest.mock('../../src/services/notification');

const mockGetBoletoData = database.getBoletoData as jest.Mock;
const mockSendSlackNotification = notifications.sendSlackNotification as jest.Mock;

describe('Data Provider Service', () => {
  it('SUCESSO: Deve retornar os dados do boleto se a validação for bem-sucedida', async () => {
    const payload: SqsPayload = { cid_acordo: 'acordo-123', id_parcela: 1, cid_boleto: 'boleto-123' };
    const boletoData = { linhaDigitavel: '12345', valor: 150.75 };
    mockGetBoletoData.mockResolvedValue(boletoData);

    const result = await provideBoletoData(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(boletoData);
    }
    expect(mockGetBoletoData).toHaveBeenCalledWith(payload);
    expect(mockSendSlackNotification).not.toHaveBeenCalled();
  });

  it('FALHA: Deve retornar erro se os dados do boleto não forem encontrados', async () => {
    const payload: SqsPayload = { cid_acordo: 'acordo-123', id_parcela: 1, cid_boleto: 'boleto-inexistente' };
    mockGetBoletoData.mockResolvedValue(null);

    const result = await provideBoletoData(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Dados do boleto não encontrados');
    }
    expect(mockSendSlackNotification).toHaveBeenCalledWith(expect.stringContaining('Dados do boleto não encontrados'));
  });

  it('FALHA: Não deve tentar buscar dados se não houver cid_boleto no payload', async () => {
    const payload: SqsPayload = { cid_acordo: 'acordo-123', id_parcela: 1 }; // No cid_boleto

    const result = await provideBoletoData(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('cid_boleto não fornecido');
    }
    expect(mockGetBoletoData).not.toHaveBeenCalled();
  });
});
