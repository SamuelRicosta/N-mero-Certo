import { isAuthenticated } from './auth.js';
import { ensureSchema } from './db.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Envolve um handler da API: exige login, garante o schema do banco,
 * despacha por método HTTP e padroniza as respostas de erro.
 * `methods` é um objeto { GET: fn, POST: fn, ... }.
 */
export function protectedRoute(methods) {
  return async (req, res) => {
    try {
      if (!isAuthenticated(req)) throw new HttpError(401, 'Faça login novamente.');
      const fn = methods[req.method];
      if (!fn) {
        res.setHeader('Allow', Object.keys(methods).join(', '));
        throw new HttpError(405, 'Método não permitido.');
      }
      await ensureSchema();
      const result = await fn(req, res);
      if (!res.headersSent) res.status(200).json(result ?? { ok: true });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      res.status(status).json({ error: status === 500 ? 'Erro interno no servidor.' : err.message });
    }
  };
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador inválido.');
  return id;
}

export function text(value, field, { max = 500, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `Campo obrigatório: ${field}.`);
    return null;
  }
  if (typeof value !== 'string') throw new HttpError(400, `Campo inválido: ${field}.`);
  const v = value.trim();
  if (required && !v) throw new HttpError(400, `Campo obrigatório: ${field}.`);
  if (v.length > max) throw new HttpError(400, `Campo muito longo: ${field}.`);
  return v;
}
