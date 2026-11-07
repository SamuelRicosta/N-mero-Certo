# 📞 Número Certo — Discador

Discador de listas de ligação com login único e banco de dados na nuvem.
Roda de graça na **Vercel (plano Hobby)** + **Neon Postgres (plano Free)**.

## Como funciona

```
public/index.html      → a tela (discador, relatórios, listas, login)
api/login.js           → POST: confere usuário/senha e cria o cookie de sessão
api/logout.js          → POST: encerra a sessão
api/me.js              → GET: diz se a sessão é válida
api/lists/index.js     → GET: todas as listas | POST: cria lista
api/lists/[id].js      → GET: lista + contatos | PATCH: renomear/limpar resultados | DELETE
api/contacts/[id].js   → PATCH: salva status/observação de um contato
lib/                   → banco (db.js), autenticação (auth.js), utilidades (http.js)
exemplos/lista-01.json → a lista original de 62 contatos, pronta para importar
```

- As tabelas são criadas sozinhas no primeiro acesso.
- O login é um só (usuário e senha nas variáveis de ambiente). A sessão dura 30 dias.
  Trocar a senha desconecta todos os aparelhos.
- Se a internet cair no meio das ligações, as marcações ficam guardadas no aparelho
  e são enviadas quando a conexão voltar.

## Publicar (uma vez só)

1. **Suba o código para o GitHub** (repositório privado).
2. Em [vercel.com](https://vercel.com), entre com o GitHub → **Add New → Project** → importe o repositório.
   Não mude nada nas configurações de build → **Deploy**.
3. **Crie o banco:** no projeto da Vercel, abra **Storage → Create Database → Neon (Postgres)** → plano Free →
   conecte ao projeto. A Vercel cria a variável `DATABASE_URL` sozinha.
4. **Crie o login:** em **Settings → Environment Variables**, adicione:
   | Nome | Valor |
   |---|---|
   | `APP_USER` | seu usuário (ex.: `samuel`) |
   | `APP_PASSWORD` | uma senha forte |
   | `SESSION_SECRET` | texto aleatório longo, gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
5. **Deployments → ⋯ → Redeploy**, para as variáveis passarem a valer.
6. Abra o site, entre e, na aba **Listas → Importar cópia de segurança**, escolha
   `exemplos/lista-01.json` (ou o backup .json que você baixou do discador antigo, com os resultados).

Cada `git push` na branch `main` publica a nova versão automaticamente.

## Rodar no computador (opcional)

```bash
npm install
npm i -g vercel
vercel link          # liga a pasta ao projeto da Vercel
vercel env pull .env.local
vercel dev           # http://localhost:3000
```

## Limites do plano grátis (sobram para este uso)

- Neon Free: 0,5 GB de dados (≈ centenas de milhares de contatos).
  O banco "dorme" após alguns minutos parado: o primeiro acesso depois disso demora 1–2 s.
- Vercel Hobby: uso pessoal/não comercial. Se o sistema virar ferramenta da empresa com equipe,
  avalie o plano Pro.
