# Controle de Finanças

Aplicação Web de gerenciamento financeiro.

Permite controlar receitas, despesas, limites de gasto e metas financeiras,
individualmente ou em família (múltiplos usuários compartilhando o mesmo
grupo financeiro).

## Stack

**Frontend**
- Next.js 15 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (Radix UI)
- TanStack Query e TanStack Table
- better-auth (autenticação, com login por e-mail/senha e Google OAuth)
- Cliente de API gerado via `@hey-api/openapi-ts` a partir do schema OpenAPI do backend

**Backend**
- Django 5.2 + django-ninja (API REST com validação via Pydantic e OpenAPI automático)
- PostgreSQL
- django-storages + boto3 (upload de anexos e fotos de perfil em armazenamento compatível com S3 — MinIO em dev local)
- gunicorn + WhiteNoise (servidor de produção)

**Infraestrutura**
- PostgreSQL e MinIO via Docker Compose (dev local)
- Deploy: frontend na Vercel, backend no Render

> Observação de arquitetura: a autenticação (better-auth) roda no processo do
> Next.js e conecta **diretamente** no mesmo banco Postgres usado pelo backend
> Django (tabelas `users`, `sessions`, `accounts`, `verifications`). O restante
> das chamadas de API do frontend passa por um proxy interno do Next.js
> (`frontend/app/api/[[...proxy]]/route.ts`) que repassa as requisições para o
> backend Django usando a variável `SERVER_URL`, anexando o token de sessão.

## Estrutura de pastas

```
.
├── backend/                    # API Django + django-ninja
│   ├── app/                    # App principal: models, schemas, rotas da API
│   │   ├── migrations/
│   │   ├── api.py              # Rotas (router) da API
│   │   ├── models.py           # Modelos (User, Finance, Goal, Family, ...)
│   │   ├── schemas.py          # Schemas Pydantic/ninja de entrada e saída
│   │   └── storage_backend.py  # Backend de storage S3 para arquivos públicos
│   ├── core/                   # Configuração do projeto Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── api.py              # Instância do NinjaAPI
│   │   └── auth.py             # Autenticação via Bearer token (AuthBearer)
│   ├── manage.py
│   ├── requirements.txt
│   ├── build.sh                # Script de build usado no Render
│   ├── Procfile                # Comando de start (gunicorn) alternativo
│   └── render.yaml             # Blueprint de deploy no Render
│
├── frontend/                   # Aplicação Next.js
│   ├── app/
│   │   ├── (auth)/              # Páginas de login, cadastro, recuperação de senha
│   │   ├── (main)/              # Páginas autenticadas: family, goals, profile, etc.
│   │   └── api/
│   │       ├── [[...proxy]]/    # Proxy das chamadas de API para o backend Django
│   │       └── auth/[...all]/   # Rotas do better-auth
│   ├── components/              # Componentes React (ui, email, icons)
│   ├── hooks/
│   ├── lib/                     # auth.ts, auth-client.ts, utils
│   └── services/                # Cliente de API gerado (openapi-ts)
│
├── docker-compose.yml           # Postgres + MinIO para desenvolvimento local
└── update-env.ps1               # Copia o .env da raiz para backend/ e frontend/
```

## Rodando localmente

### Pré-requisitos
- Node.js 20+ e [pnpm](https://pnpm.io/) (`corepack enable` ou `npm i -g pnpm`)
- Python 3.11+ e `pip`
- Docker (para Postgres e MinIO) — ou instâncias próprias de Postgres/S3

### 1. Banco de dados e storage (Docker)

Crie um arquivo `.env` na raiz do repositório com as variáveis usadas pelo
`docker-compose.yml` (Postgres e credenciais do MinIO), depois suba os
serviços:

```bash
docker compose up -d
```

Isso inicia:
- Postgres em `localhost:5432`
- MinIO (S3-compatível) em `localhost:9000` (console em `localhost:9001`)

### 2. Backend (Django)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

copy .env.example .env        # Windows (ou: cp .env.example .env)
# preencha as variáveis em backend/.env (veja backend/.env.example)

python manage.py migrate
python manage.py createsuperuser   # opcional
python manage.py runserver         # http://localhost:8000
```

O schema OpenAPI fica disponível em `http://localhost:8000/api/openapi.json`
e o Swagger em `http://localhost:8000/api/docs`.

### 3. Frontend (Next.js)

```bash
cd frontend
pnpm install

copy .env.example .env        # Windows (ou: cp .env.example .env)
# preencha as variáveis em frontend/.env (veja frontend/.env.example)

pnpm dev                       # http://localhost:3000
```

> Dica: o script `update-env.ps1` na raiz copia um único `.env` centralizado
> para `backend/.env` e `frontend/.env`, útil se você preferir manter as
> variáveis compartilhadas (Postgres, MinIO) em um só lugar durante o
> desenvolvimento.

## Deploy em produção

### Backend → Render

1. Crie um novo **Blueprint** no Render apontando para este repositório; o
   Render vai detectar `backend/render.yaml`, que já provisiona:
   - um serviço web Python (`gunicorn core.wsgi`, plano free)
   - um banco Postgres (plano free)
2. Preencha manualmente no dashboard do Render as variáveis marcadas como
   "sync: false" no blueprint (`CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
   credenciais do S3/MinIO) — veja `backend/.env.example` para a lista
   completa e a descrição de cada uma.
3. O build (`backend/build.sh`) roda `pip install`, `collectstatic` e
   `migrate` automaticamente a cada deploy.
4. Alternativa sem Blueprint: crie o Web Service manualmente com
   Build Command `./build.sh` e Start Command do `backend/Procfile`
   (`gunicorn core.wsgi --log-file -`).

> O plano free de Postgres do Render expira após um período (atualmente 90
> dias) e precisa ser recriado/migrado manualmente — verifique a política
> vigente no dashboard do Render antes de ir para produção real com dados
> importantes.

### Frontend → Vercel

1. Importe o repositório na Vercel e selecione `frontend` como Root Directory.
2. Configure as variáveis de ambiente do projeto (Settings → Environment
   Variables) com os mesmos nomes de `frontend/.env.example`, apontando
   `SERVER_URL` para a URL pública do backend no Render.
3. Garanta que `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` no backend
   (Render) incluam a URL final do frontend na Vercel.
4. Deploy automático a cada push (build: `pnpm run build`, definido em
   `frontend/package.json`).

## Variáveis de ambiente

Veja a lista completa e comentada em:
- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)
