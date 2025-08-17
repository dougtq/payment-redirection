import { z } from 'zod';
import { sqsPayloadSchema } from '../validators/sqs-payload-validator';

// Type inferred from the Zod schema
export type SqsPayload = z.infer<typeof sqsPayloadSchema>;
