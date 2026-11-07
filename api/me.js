import { protectedRoute } from '../lib/http.js';

// Usado pela página para saber se a sessão ainda é válida (e se o banco responde).
export default protectedRoute({
  GET: () => ({ ok: true }),
});
