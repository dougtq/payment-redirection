import { SQSEvent } from 'aws-lambda';
import { sqsPayloadSchema } from '../validators/sqs-payload-validator';
import { provideBoletoData } from '../services/data-provider';
import { payBoleto } from '../services/payment';

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    // 1. Schema Validation
    let payload;
    try {
      payload = JSON.parse(record.body);
    } catch (error) {
      console.error('Error parsing SQS message body:', error, { messageId: record.messageId, body: record.body });
      continue;
    }

    const schemaResult = sqsPayloadSchema.safeParse(payload);
    if (!schemaResult.success) {
      console.error('SQS payload validation failed:', schemaResult.error.issues, { messageId: record.messageId, payload });
      continue;
    }

    // 2. Data Provider
    const dataProviderResult = await provideBoletoData(schemaResult.data);
    if (!dataProviderResult.success) {
      console.error('Data provider failed:', dataProviderResult.error);
      continue;
    }

    // 3. Payment Service
    const paymentResult = await payBoleto({
      ...dataProviderResult.data,
      identifiers: schemaResult.data,
    });

    if (!paymentResult.success) {
      console.error('Payment service failed:', paymentResult.error);
      continue;
    }

    console.log('Handler execution finished successfully.');
  }
};
