import knex, { Knex } from 'knex';

let connection: Knex | null = null;

export const getTestConnection = (): Knex => {
  if (connection) {
    return connection;
  }

  const dbConfig: Knex.Config = {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  };

  connection = knex(dbConfig);
  return connection;
};

export const cleanupDatabase = async (db: Knex): Promise<void> => {
  await db('parcelas_boletos').del();
  await db('acordos_parcelas').del();
  await db('boletos').del();
  await db('parcelas').del();
  await db('acordos').del();
};

export const seedDatabase = async (db: Knex): Promise<void> => {
  await db('acordos').insert({ cid_acordo: 'acordo-int-test' });
  await db('parcelas').insert({ id_parcela: 999, status: 'pending', valor: 15075 });
  await db('boletos').insert({
    cid_boleto: 'boleto-int-test',
    linha_digitavel_boleto: '123456789012345678901234567890123456789012345',
    valor_pagamento_boleto: 15075,
  });
  await db('acordos_parcelas').insert({ cid_acordo: 'acordo-int-test', id_parcela: 999 });
  await db('parcelas_boletos').insert({ id_parcela: 999, cid_boleto: 'boleto-int-test' });
};

export const getParcelStatus = async (db: Knex, id_parcela: number): Promise<string | null> => {
  const result = await db('parcelas').select('status').where({ id_parcela }).first();
  return result ? result.status : null;
};
