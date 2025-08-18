import knex, { Knex } from 'knex';
import { SqsPayload } from '../types/sqs-payload';

export let connection: Knex | null = null;

export const closeConnection = async (): Promise<void> => {
  if (connection) {
    await connection.destroy();
    connection = null;
  }
};

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
    .join('acordos_parcelas as ap', 'a.cid_acordo', 'ap.cid_acordo')
    .join('parcelas_boletos as pb', 'ap.id_parcela', 'pb.id_parcela')
    .join('boletos as b', 'pb.cid_boleto', 'b.cid_boleto')
    .select('b.linha_digitavel_boleto as linhaDigitavel', 'b.valor_pagamento_boleto as valor')
    .where('a.cid_acordo', payload.cid_acordo)
    .andWhere('ap.id_parcela', payload.id_parcela)
    .andWhere('b.cid_boleto', payload.cid_boleto)
    .first();

  return result || null;
};

export const updateParcelStatus = async (
  id_parcela: number,
  status: string
): Promise<void> => {
  const db = getConnection();
  await db('parcelas').where({ id_parcela }).update({ status });
};
