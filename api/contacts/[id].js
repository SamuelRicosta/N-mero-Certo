import { sql } from '../../lib/db.js';
import { HttpError, parseId, protectedRoute, text } from '../../lib/http.js';

export default protectedRoute({
  // Body: { status?, note? }. status = null desmarca o contato.
  async PATCH(req) {
    const id = parseId(req.query.id);
    const body = req.body || {};
    const hasStatus = 'status' in body;
    const hasNote = 'note' in body;
    if (!hasStatus && !hasNote) throw new HttpError(400, 'Nada para atualizar.');

    const status = hasStatus ? text(body.status, 'status', { max: 60 }) || null : null;
    const note = hasNote ? text(body.note, 'observação', { max: 2000 }) || '' : null;

    const [row] = await sql`
      update contacts set
        status     = case when ${hasStatus} then ${status} else status end,
        updated_at = case when ${hasStatus} then (case when ${status}::text is null then null else now() end) else updated_at end,
        note       = case when ${hasNote} then ${note} else note end
      where id = ${id}
      returning id, status, note, updated_at`;
    if (!row) throw new HttpError(404, 'Contato não encontrado.');
    return row;
  },
});
