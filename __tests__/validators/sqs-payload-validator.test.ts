import { sqsPayloadSchema } from '../../src/validators/sqs-payload-validator';

describe('SQS Payload Validator', () => {
  it('SUCESSO: Deve validar um payload com campos obrigatórios', () => {
    const validPayload = { cid_acordo: 'abc-123', id_parcela: 456 };
    const result = sqsPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('SUCESSO: Deve validar um payload com todos os campos opcionais', () => {
    const validPayload = {
      cid_acordo: 'abc-123',
      id_parcela: 456,
      cid_boleto: 'boleto-123',
      cid_pix: 'pix-456',
    };
    const result = sqsPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('FALHA: Deve rejeitar se cid_acordo for uma string vazia', () => {
    const payload = { cid_acordo: '', id_parcela: 456 };
    const result = sqsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('FALHA: Deve rejeitar se id_parcela não for um inteiro', () => {
    const payload = { cid_acordo: 'abc-123', id_parcela: 12.34 };
    const result = sqsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('FALHA: Deve rejeitar se cid_boleto for uma string vazia', () => {
    const payload = { 
      cid_acordo: 'abc-123', 
      id_parcela: 456, 
      cid_boleto: '' 
    };
    const result = sqsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('FALHA: Deve rejeitar se cid_pix for uma string vazia', () => {
    const payload = { 
      cid_acordo: 'abc-123', 
      id_parcela: 456, 
      cid_pix: '' 
    };
    const result = sqsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('FALHA: Deve rejeitar campos extras', () => {
    const payload = {
      cid_acordo: 'abc-123',
      id_parcela: 456,
      extra_field: 'should-not-be-here',
    };
    const result = sqsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
