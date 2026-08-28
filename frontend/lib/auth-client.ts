import { createAuthClient } from "better-auth/react";

// Sem `baseURL` explícito, o client do better-auth usa `window.location.origin`
// (same-origin) no navegador, batendo em `/api/auth/*` — que é servido pelo
// próprio Next.js em `app/api/auth/[...all]/route.ts`. `SERVER_URL` é a URL do
// backend Django (usada só no proxy server-side de `/api/*`) e não deve ser
// usada aqui: além de não ser embutida no bundle do client (falta o prefixo
// `NEXT_PUBLIC_`), ela aponta para o serviço errado — o Django não expõe as
// rotas do better-auth.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;