import crypto from 'node:crypto';

const COOKIE = 'nc_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function config() {
  const { APP_USER, APP_PASSWORD, SESSION_SECRET } = process.env;
  if (!APP_USER || !APP_PASSWORD || !SESSION_SECRET) {
    const err = new Error('Configure APP_USER, APP_PASSWORD e SESSION_SECRET nas variáveis de ambiente da Vercel e faça Redeploy.');
    err.expose = true;
    throw err;
  }
  return { user: APP_USER, password: APP_PASSWORD, secret: SESSION_SECRET };
}

// A senha entra na chave: trocar APP_PASSWORD desconecta todas as sessões abertas.
function sign(value) {
  const { secret, password } = config();
  return crypto.createHmac('sha256', `${secret}:${password}`).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function checkCredentials(user, password) {
  const cfg = config();
  // Avalia os dois sempre, para não vazar qual campo errou pelo tempo de resposta.
  const okUser = safeEqual(user, cfg.user);
  const okPass = safeEqual(password, cfg.password);
  return okUser && okPass;
}

export function startSession(res) {
  const value = String(Date.now() + MAX_AGE * 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${value}.${sign(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
  );
}

export function endSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export function isAuthenticated(req) {
  const raw = readCookie(req, COOKIE);
  if (!raw) return false;
  const [value, signature] = raw.split('.');
  if (!value || !signature || !safeEqual(signature, sign(value))) return false;
  return Number(value) > Date.now();
}
