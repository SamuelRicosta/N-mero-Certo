import { sql } from '../../lib/db.js';
import { HttpError, protectedRoute, text } from '../../lib/http.js';

const MAX_CONTACTS = 5000;

export default protectedRoute({
  // Todas as listas com o resumo de andamento.
  async GET() {
    return sql`
      select l.id, l.name, l.created_at,
             count(c.id)::int as total,
             count(c.status)::int as done,
             (count(*) filter (where c.status in ('Interessado', 'Visita agendada')))::int as interested
      from lists l
      left join contacts c on c.list_id = l.id
      group by l.id
      order by l.created_at desc, l.id desc`;
  },

  // Cria uma lista. Body: { name, contacts: [{ name, phone, status?, note?, updatedAt? }] }
  async POST(req) {
    const body = req.body || {};
    const name = text(body.name, 'nome da lista', { max: 120, required: true });
    const input = body.contacts;
    if (!Array.isArray(input) || !input.length) throw new HttpError(400, 'A lista precisa de ao menos um contato.');
    if (input.length > MAX_CONTACTS) throw new HttpError(400, `Máximo de ${MAX_CONTACTS} contatos por lista.`);

    const cols = { pos: [], name: [], phone: [], status: [], note: [], updated: [] };
    input.forEach((c, i) => {
      const phone = String(c?.phone ?? '').replace(/\D/g, '');
      if (!phone || phone.length > 15) throw new HttpError(400, `Telefone inválido na linha ${i + 1}.`);
      const status = text(c.status, 'status', { max: 60 }) || null;
      const updated = c.updatedAt && !Number.isNaN(Date.parse(c.updatedAt)) ? new Date(c.updatedAt).toISOString() : null;
      cols.pos.push(i);
      cols.name.push(text(c?.name, `nome (linha ${i + 1})`, { max: 120, required: true }));
      cols.phone.push(phone);
      cols.status.push(status);
      cols.note.push(text(c.note, 'observação', { max: 2000 }) || '');
      cols.updated.push(status ? updated || new Date().toISOString() : null);
    });

    const [row] = await sql`
      with l as (insert into lists (name) values (${name}) returning id),
      ins as (
        insert into contacts (list_id, position, name, phone, status, note, updated_at)
        select l.id, t.pos, t.name, t.phone, t.status, t.note, t.updated_at
        from l, unnest(
          ${cols.pos}::int[], ${cols.name}::text[], ${cols.phone}::text[],
          ${cols.status}::text[], ${cols.note}::text[], ${cols.updated}::timestamptz[]
        ) as t(pos, name, phone, status, note, updated_at)
      )
      select id from l`;
    return { id: row.id };
  },
});
