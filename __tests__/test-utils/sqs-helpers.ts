import { SQS } from 'aws-sdk';

let sqs: SQS | null = null;

export const getSqsClient = (): SQS => {
  if (sqs) {
    return sqs;
  }
  sqs = new SQS({
    endpoint: process.env.SQS_ENDPOINT_URL,
    region: process.env.DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  return sqs;
};

export const sendMessage = async (sqsClient: SQS, queueUrl: string, body: object): Promise<void> => {
  await sqsClient.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
  }).promise();
};
