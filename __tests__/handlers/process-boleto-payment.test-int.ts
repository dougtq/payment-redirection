import { Knex } from 'knex';
import { SQS } from 'aws-sdk';
import { SQSEvent } from 'aws-lambda';
import { handler } from '../../src/handlers/process-boleto-payment';
import { getTestConnection, cleanupDatabase, seedDatabase, getParcelStatus } from '../test-utils/db-helpers';
import { getSqsClient, sendMessage } from '../test-utils/sqs-helpers';

import { closeConnection as closeAppConnection } from '../../src/services/database';

// Mock external services at the code level for this integration test
import * as payment from '../../src/services/payment';
import * as notification from '../../src/services/notification';

jest.mock('../../src/services/payment');
jest.mock('../../src/services/notification');

const mockPayBoleto = payment.payBoleto as jest.Mock;
const mockSendSlackNotification = notification.sendSlackNotification as jest.Mock;

describe('Integration: Process Boleto Payment', () => {
  let db: Knex;
  let sqs: SQS;
  const queueUrl = process.env.SQS_QUEUE_URL!;

  // Establish connections before all tests
  beforeAll(() => {
    db = getTestConnection();
    sqs = getSqsClient();
  });

  // Clean up the database before each test and seed it with fresh data
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupDatabase(db);
    await seedDatabase(db);
  });

  // Close connections after all tests are done
  afterAll(async () => {
    await db.destroy();
    await closeAppConnection();
  });

  it('should process a boleto payment successfully (happy path)', async () => {
    // Arrange
    const payload = { cid_acordo: 'acordo-int-test', id_parcela: 999, cid_boleto: 'boleto-int-test' };
    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: 'int-test-message-id',
          receiptHandle: 'int-test-receipt-handle',
          body: JSON.stringify(payload),
          attributes: {} as any,
          messageAttributes: {} as any,
          md5OfBody: 'mock-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:my-test-queue',
          awsRegion: 'us-east-1',
        },
      ],
    };

    // Mock the successful payment response
    mockPayBoleto.mockResolvedValue({ success: true, transactionId: 'trans-int-123' });

    // Act
    await handler(sqsEvent);

    // Assert
    // 1. Check if the parcel status was updated in the database
    const finalStatus = await getParcelStatus(db, 999);
    expect(finalStatus).toBe('paid');

    // 2. Check if the payment service was called correctly
    expect(mockPayBoleto).toHaveBeenCalledTimes(1);
    expect(mockPayBoleto).toHaveBeenCalledWith(expect.objectContaining({
      linhaDigitavel: '123456789012345678901234567890123456789012345',
      valor: 15075,
    }));

    // 3. Check that no notification was sent
    expect(mockSendSlackNotification).not.toHaveBeenCalled();
  });
});
