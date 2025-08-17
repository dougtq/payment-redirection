import { handler } from '../../src/handlers/process-boleto-payment';
import { sqsPayloadSchema } from '../../src/validators/sqs-payload-validator';
import * as dataProvider from '../../src/services/data-provider';
import * as payment from '../../src/services/payment';
import { SQSEvent, SQSRecord } from 'aws-lambda';

// Mock the services
jest.mock('../../src/validators/sqs-payload-validator');
jest.mock('../../src/services/data-provider');
jest.mock('../../src/services/payment');

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockProvideBoletoData = dataProvider.provideBoletoData as jest.Mock;
const mockPayBoleto = payment.payBoleto as jest.Mock;

describe('Process Boleto Payment Handler - Full Flow', () => {
  const mockSqsRecord = (body: object): SQSRecord => ({
    messageId: 'mock-message-id',
    receiptHandle: 'mock-receipt-handle',
    body: JSON.stringify(body),
    attributes: {} as any,
    messageAttributes: {} as any,
    md5OfBody: 'mock-md5',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
    awsRegion: 'us-east-1',
  });

  const validPayload = { cid_acordo: 'valid-cid', id_parcela: 1, cid_boleto: 'boleto-1' };
  const boletoData = { linhaDigitavel: '12345', valor: 15075 };

  it('SUCESSO: Deve executar o fluxo completo de pagamento com sucesso', async () => {
    const sqsEvent: SQSEvent = { Records: [mockSqsRecord(validPayload)] };

    (sqsPayloadSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: validPayload });
    mockProvideBoletoData.mockResolvedValue({ success: true, data: boletoData });
    mockPayBoleto.mockResolvedValue({ success: true, transactionId: 'trans-123' });

    await handler(sqsEvent);

    expect(mockProvideBoletoData).toHaveBeenCalledWith(validPayload);
    expect(mockPayBoleto).toHaveBeenCalledWith({ ...boletoData, identifiers: validPayload });
    expect(mockConsoleLog).toHaveBeenCalledWith('Handler execution finished successfully.');
  });

  it('FALHA: Deve parar a execução se o data-provider falhar', async () => {
    const sqsEvent: SQSEvent = { Records: [mockSqsRecord(validPayload)] };

    (sqsPayloadSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: validPayload });
    mockProvideBoletoData.mockResolvedValue({ success: false, error: 'DB error' });

    await handler(sqsEvent);

    expect(mockProvideBoletoData).toHaveBeenCalledWith(validPayload);
    expect(mockPayBoleto).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('Data provider failed:', 'DB error');
  });

  it('FALHA: Deve parar a execução se o serviço de pagamento falhar', async () => {
    const sqsEvent: SQSEvent = { Records: [mockSqsRecord(validPayload)] };

    (sqsPayloadSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: validPayload });
    mockProvideBoletoData.mockResolvedValue({ success: true, data: boletoData });
    mockPayBoleto.mockResolvedValue({ success: false, error: 'Stark Bank error' });

    await handler(sqsEvent);

    expect(mockPayBoleto).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('Payment service failed:', 'Stark Bank error');
  });
});
