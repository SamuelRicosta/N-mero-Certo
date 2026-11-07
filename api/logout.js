import { endSession } from '../lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  endSession(res);
  return res.status(200).json({ ok: true });
}
