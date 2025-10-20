# RRInvest Web Platform

Modern Astro 5 application with server-side rendering, Prisma/PostgreSQL storage, cookie-based authentication, RBAC, and a lightweight CMS for publishing LinkedIn-style posts.

## Stack Overview
- Astro 5 with Node adapter (SSR)
- TypeScript (strict)
- TailwindCSS + DaisyUI components
- Prisma ORM with PostgreSQL
- Secure cookie sessions with bcrypt hashed passwords
- Make.com webhook integration for publish events

## Getting Started

1. **Install dependencies**
   ```sh
   pnpm install
   ```

2. **Configure environment**
   Create `./.env.local` with:
   ```env
   DATABASE_URL=postgresql://rrinvest:rrinvest@localhost:5432/rrinvest?schema=public
   SESSION_SECRET=replace-with-long-random-string
   WEBHOOK_SECRET=replace-with-webhook-secret
   MAKE_WEBHOOK_URL=https://hook.make.com/...   # optional
   PUBLIC_SITE_URL=https://www.rrinvestments.eu
   PUBLIC_FORMSPREE_CONTACT_ENDPOINT=...
   SMTP_HOST=smtp.example.com            # optional (required for email)
   SMTP_PORT=587                         # optional
   SMTP_USER=apikey                      # optional
   SMTP_PASSWORD=super-secret            # optional
   EMAIL_FROM="René Rypar <no-reply@rrinvestments.eu>"
   ```

3. **Start PostgreSQL**
   ```sh
   docker compose up -d db
   ```

4. **Apply migrations**
   ```sh
   pnpm prisma migrate dev
   ```

5. **Seed admin user**
   ```sh
   SEED_ADMIN_EMAIL=admin@example.com \
   SEED_ADMIN_PASSWORD=super-secure-password \
   pnpm prisma db seed
   ```

6. **Run the app**
   ```sh
   pnpm dev
   ```

## Prisma
- Schema lives in `prisma/schema.prisma`.
- Database client helper: `src/server/db.ts`.
- Generate client manually with `pnpm prisma generate` if needed.

## Authentication & RBAC
- Session cookies (`rr_session`) stored HTTP-only, Secure in production, SameSite Lax, 30 day TTL.
- Helpers in `src/server/auth.ts` (login, logout, guards, CSRF handling).
- CSRF tokens derive from the session and are injected via middleware into `Astro.locals.csrfToken`.
- Admin-only routes live under `/admin/**`. Middleware redirects unauthenticated users to `/prihlaseni`.
- Login rate-limited via token bucket (5 attempts/minute per IP) and password reset requests are limited to 3/hour per IP.
- Password reset flow: `/prihlaseni/reset` (request link) → `/prihlaseni/nove-heslo?token=...` (set new password). Reset tokens expire after 1 hour and are stored in `PasswordResetToken`.
- If SMTP settings are provided (`SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`, plus credentials when required), password reset emails are delivered automatically; otherwise tokens are only shown in development responses/logs.

## Mini CMS
- Admin dashboard: `/admin`
- Posts list: `/admin/posts`
- Create new post: `/admin/posts/new`
- Edit post: `/admin/posts/:id`
- Publish action triggers Make webhook (`MAKE_WEBHOOK_URL`) and expects LinkedIn callback with header `X-Webhook-Token` equal to `WEBHOOK_SECRET`.
- LinkedIn callback endpoint: `POST /api/posts/:id/linkedin-callback` with `{ "linkedinUrl": "..." }`.

## Public Content
- Posts listing: `/posts` (only published posts)
- Post detail: `/posts/:id` with optional “Zobrazit na LinkedIn” CTA.

## Available Scripts
| Script | Description |
| --- | --- |
| `pnpm dev` | Start Astro in SSR mode |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm prisma migrate dev` | Run migrations locally |
| `pnpm prisma db seed` | Seed admin user (requires `SEED_ADMIN_*` envs) |

## Webhooks
- Publish webhook payload
  ```json
  {
    "id": "post-id",
    "title": "Post Title",
    "content": "Post content...",
    "imageUrl": "https://...",
    "canonicalUrl": "https://www.rrinvestments.eu/posts/post-id"
  }
  ```
- LinkedIn callback expects header `X-Webhook-Token: ${WEBHOOK_SECRET}`.

## Notes
- Ensure `SESSION_SECRET` is a strong random value (32+ chars).
- Restart the dev server after changing environment variables.
- Run `pnpm prisma migrate dev` after pulling schema changes (e.g., the `PasswordResetToken` table for password recovery).
- Run `pnpm install` after updating dependencies (e.g., Nodemailer for email).
- Prisma Studio is available via `pnpm prisma studio` if needed.
