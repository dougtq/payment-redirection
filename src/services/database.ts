import knex, { Knex } from 'knex';
import { SqsPayload } from '../types/sqs-payload';

let connection: Knex | null = null;

const getConnection = (): Knex => {
  if (connection) {
    return connection;
  }

  const dbConfig: Knex.Config = {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test_db',
    },
    pool: { min: 0, max: 7 },
  };

  connection = knex(dbConfig);
  return connection;
};

export const checkRecordExists = async (params: {
  table: string;
  column: string;
  value: string | number;
}): Promise<boolean> => {
  const { table, column, value } = params;
  const db = getConnection();
  const result = await db(table).select('1').where(column, value).first();
  return !!result;
};

export const getBoletoData = async (
  payload: SqsPayload
): Promise<{ linhaDigitavel: string; valor: number } | null> => {
  const db = getConnection();
  const result = await db('acordos as a')
    .join('acordos_parcelas as ap', 'a.id_acordo', 'ap.id_acordo')
    .join('parcelas_boletos as pb', 'ap.id_parcela', 'pb.id_parcela')
    .join('boletos as b', 'pb.id_boleto', 'b.id_boleto')
    .select('b.linha_digitavel_boleto as linhaDigitavel', 'b.valor_pagamento_boleto as valor')
    .where('a.cid_acordo', payload.cid_acordo)
    .andWhere('ap.id_parcela', payload.id_parcela)
    .andWhere('b.cid_boleto', payload.cid_boleto)
    .first();

  return result || null;
};
