import { handler } from '../../src/handlers/process-boleto-payment';
import { sqsPayloadSchema } from '../../src/validators/sqs-payload-validator';
import * as dataProvider from '../../src/services/data-provider';
import * as payment from '../../src/services/payment';
import * as notification from '../../src/services/notification';
import * as database from '../../src/services/database'; // Import database service
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ZodError } from 'zod';

// Mock the services
jest.mock('../../src/validators/sqs-payload-validator');
jest.mock('../../src/services/data-provider');
jest.mock('../../src/services/payment');
jest.mock('../../src/services/notification');
jest.mock('../../src/services/database'); // Mock database service

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs in tests

const mockProvideBoletoData = dataProvider.provideBoletoData as jest.Mock;
const mockPayBoleto = payment.payBoleto as jest.Mock;
const mockSendSlackNotification = notification.sendSlackNotification as jest.Mock;
const mockUpdateParcelStatus = database.updateParcelStatus as jest.Mock; // Create mock for updateParcelStatus
const mockSafeParse = sqsPayloadSchema.safeParse as jest.Mock;

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

describe('Process Boleto Payment Handler', () => {
  const validPayload = { cid_acordo: 'valid-cid', id_parcela: 1, cid_boleto: 'boleto-1' };
  const boletoData = { linhaDigitavel: '12345', valor: 15075 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SUCESSO: Deve executar o fluxo completo de pagamento com sucesso', async () => {
    const sqsEvent: SQSEvent = { Records: [mockSqsRecord(validPayload)] };

    mockSafeParse.mockReturnValue({ success: true, data: validPayload });
    mockProvideBoletoData.mockResolvedValue({ success: true, data: boletoData });
    mockPayBoleto.mockResolvedValue({ success: true, transactionId: 'trans-123' });
    mockUpdateParcelStatus.mockResolvedValue(undefined); // Ensure updateParcelStatus is mocked

    await handler(sqsEvent);

    expect(mockProvideBoletoData).toHaveBeenCalledWith(validPayload);
    expect(mockPayBoleto).toHaveBeenCalledWith({ ...boletoData, identifiers: validPayload });
    expect(mockUpdateParcelStatus).toHaveBeenCalledWith(validPayload.id_parcela, 'paid'); // Verify call
    expect(mockSendSlackNotification).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('Handler execution finished successfully.');
  });

  describe('Cenários de Falha', () => {
    const testCases = [
      {
        description: 'Falha na Transação Starkbank (Boleto Inválido)',
        mockError: { success: false, error: 'InvalidBoletoId: The provided boleto ID is not valid.' },
        serviceToMock: mockPayBoleto,
        expectedMessage: 'ERRO PAGAMENTO: Linha digitável inválida.',
      },
      {
        description: 'Falha na Transação Starkbank (Saldo Insuficiente)',
        mockError: { success: false, error: 'InvalidBalance: Insufficient funds to complete the payment.' },
        serviceToMock: mockPayBoleto,
        expectedMessage: 'ERRO PAGAMENTO: Saldo insuficiente.',
      },
      {
        description: 'Falha na Transação Starkbank (Autenticação)',
        mockError: { success: false, error: 'Authentication Error: Invalid API Key.' },
        serviceToMock: mockPayBoleto,
        expectedMessage: 'ERRO PAGAMENTO: Falha de autenticação.',
      },
      {
        description: 'Registro Não Encontrado no DB',
        mockError: { success: false, error: 'Error: Agreement not found.' },
        serviceToMock: mockProvideBoletoData,
        expectedMessage: 'ERRO DB: Acordo, Boleto ou Pix não encontrado no banco de dados.',
      },
      {
        description: 'Validação de Payload Falhou',
        mockError: { success: false, error: new ZodError([]) },
        serviceToMock: mockSafeParse,
        expectedMessage: 'ERRO PAYLOAD: Mensagem da fila com formato inválido.',
      },
      {
        description: 'Erro Genérico',
        mockError: { success: false, error: 'Some unexpected generic error.' },
        serviceToMock: mockPayBoleto,
        expectedMessage: 'ERRO GENÉRICO: Falha inesperada. Contate o suporte técnico.',
      },
    ];

    test.each(testCases)('$description', async ({ mockError, serviceToMock, expectedMessage }) => {
      const sqsEvent: SQSEvent = { Records: [mockSqsRecord(validPayload)] };

      // Setup mocks for the successful steps before the failure
      mockSafeParse.mockReturnValue({ success: true, data: validPayload });
      mockProvideBoletoData.mockResolvedValue({ success: true, data: boletoData });

      // Setup the specific failure mock
      if (serviceToMock === mockSafeParse) {
        mockSafeParse.mockReturnValue(mockError);
      } else {
        serviceToMock.mockResolvedValue(mockError);
      }

      await handler(sqsEvent);

      expect(mockSendSlackNotification).toHaveBeenCalledTimes(1);
      expect(mockSendSlackNotification).toHaveBeenCalledWith(expectedMessage);
    });
  });
});