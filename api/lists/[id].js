import { sql } from '../../lib/db.js';
import { HttpError, parseId, protectedRoute, text } from '../../lib/http.js';

async function findList(id) {
  const [list] = await sql`select id, name, created_at from lists where id = ${id}`;
  if (!list) throw new HttpError(404, 'Lista não encontrada.');
  return list;
}

export default protectedRoute({
  // Lista com todos os contatos, na ordem original.
  async GET(req) {
    const list = await findList(parseId(req.query.id));
    const contacts = await sql`
      select id, position, name, phone, status, note, updated_at
      from contacts where list_id = ${list.id} order by position`;
    return { ...list, contacts };
  },

  // Body: { name } para renomear e/ou { resetResults: true } para limpar os resultados.
  async PATCH(req) {
    const list = await findList(parseId(req.query.id));
    const body = req.body || {};
    if (body.name !== undefined) {
      const name = text(body.name, 'nome da lista', { max: 120, required: true });
      await sql`update lists set name = ${name} where id = ${list.id}`;
    }
    if (body.resetResults === true) {
      await sql`update contacts set status = null, note = '', updated_at = null where list_id = ${list.id}`;
    }
    return { ok: true };
  },

  async DELETE(req) {
    const list = await findList(parseId(req.query.id));
    await sql`delete from lists where id = ${list.id}`;
    return { ok: true };
  },
});
