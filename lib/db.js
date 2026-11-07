import { neon } from '@neondatabase/serverless';

// Aceita também nomes com prefixo (ex.: STORAGE_URL), que a Vercel cria quando o
// banco é conectado com um "Custom Prefix": usa a primeira variável terminada em
// _URL cujo valor seja uma conexão Postgres.
const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  Object.entries(process.env)
    .filter(([k, v]) => /_URL$/.test(k) && /^postgres(ql)?:\/\//.test(v || ''))
    .sort(([a], [b]) => a.length - b.length)[0]?.[1];

export const sql = url ? neon(url) : null;

let schemaReady;

// Cria as tabelas na primeira chamada de cada instância (idempotente).
export function ensureSchema() {
  if (!sql) {
    const err = new Error('Banco de dados não configurado: conecte o Neon em Storage na Vercel e faça Redeploy.');
    err.expose = true;
    throw err;
  }
  schemaReady ??= (async () => {
    await sql`
      create table if not exists lists (
        id serial primary key,
        name text not null,
        created_at timestamptz not null default now()
      )`;
    await sql`
      create table if not exists contacts (
        id serial primary key,
        list_id integer not null references lists(id) on delete cascade,
        position integer not null,
        name text not null,
        phone text not null,
        status text,
        note text not null default '',
        updated_at timestamptz
      )`;
    await sql`create index if not exists contacts_list_idx on contacts (list_id, position)`;
  })().catch((err) => {
    schemaReady = undefined;
    throw err;
  });
  return schemaReady;
}
