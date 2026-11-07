import { checkCredentials, startSession } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    const { user = '', password = '' } = req.body || {};
    if (!checkCredentials(user, password)) {
      // Atraso fixo para dificultar tentativas em massa de senha.
      await new Promise((r) => setTimeout(r, 1000));
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    startSession(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
