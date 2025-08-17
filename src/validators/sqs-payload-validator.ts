import { z } from 'zod';

export const sqsPayloadSchema = z
  .object({
    cid_acordo: z.string().min(1, { message: 'cid_acordo cannot be empty' }),
    id_parcela: z.number().int({ message: 'id_parcela must be an integer' }),
    cid_boleto: z.string().min(1).optional(),
    cid_pix: z.string().min(1).optional(),
  })
  .strict();
