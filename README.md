# CookTale

CookTale is being split into a web frontend and a dedicated API backend.

## Repository layout

```txt
cooktale/
  frontend/        Next.js web app
  backend/         NestJS API
  docker-compose.yml
  README.md
```

## API versioning

The backend uses URI versioning:

```txt
/api/v1/health
```

This keeps the public API stable for both the website and future mobile apps. Breaking API changes should ship under a new version instead of changing existing app contracts in place.

## Local development

Backend foundation:

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Full stack with Docker:

```bash
docker compose up --build
```

Docker exposes the frontend at `http://localhost:3001` so it can run alongside a local Next.js dev server on `3000`. The backend is available at `http://localhost:4000/api/v1`.

## Turnstile

The local Docker stack uses Cloudflare Turnstile test keys:

```txt
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
CLOUDFLARE_TURNSTILE_SECRET_KEY
```

Production must use the real Cloudflare keys from the dashboard. The secret key belongs only in server-side environment variables or deployment secrets; never commit it to the repository.

The migration plan is module-by-module. The existing Next.js API/server actions should stay in place until each module has a complete NestJS replacement and the frontend has been switched to call it.
