# Employee Reimbursement Portal

Next.js 15 (App Router, SSR) scaffold for an internal reimbursement portal.

## Stack
- Next.js 15 + React 19, App Router with server components (SSR by default).
- TypeScript, plain CSS (no framework) themed after wareongo.com (navy + orange).
- Mobile-first responsive layout.

## Pages
- `/` — dummy login screen (any credentials → `/dashboard`).
- `/dashboard` — summary cards + recent tickets (server-rendered).
- `/dashboard/new` — raise ticket: text inputs + multi-file drag-and-drop upload.
- `/dashboard/history` — list of all past tickets with status badges.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Backend boilerplate

Prisma + Supabase Postgres + Cloudflare R2 wired in but not yet connected to the UI.

### Layout
- `prisma/schema.prisma` — `User`, `Ticket`, `Attachment`, `TicketEvent` models.
- `lib/prisma.ts` — global PrismaClient singleton (HMR-safe).
- `lib/r2.ts` — R2 client (S3-compatible) with `getUploadUrl`, `getDownloadUrl`, `deleteObject`, `publicUrl`.
- `app/api/r2/sign/route.ts` — `POST` returns a presigned PUT URL so the browser uploads directly to R2.
- `app/api/tickets/route.ts` — `GET` list, `POST` create (upserts user by email, generates `RB-####`, attaches files).

### Setup
1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — Supabase **transaction pooler** URL (port 6543) with `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL` — Supabase direct connection (port 5432). Used only by `prisma migrate`.
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
   - `R2_PUBLIC_BASE_URL` (optional) — set if your bucket is public via `pub-xxxx.r2.dev` or a custom domain; otherwise downloads use presigned URLs.
2. `npm install` (runs `prisma generate` automatically).
3. `npm run db:push` to create tables on Supabase (use `db:migrate` once you start versioning migrations).

### R2 CORS
Add a CORS rule on the bucket so browsers can `PUT` to the presigned URL:
```json
[{
  "AllowedOrigins": ["http://localhost:3000", "https://your-prod-domain.com"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"]
}]
```

### Upload flow (when wiring TicketForm next)
1. Client `POST /api/r2/sign` with `{ filename, contentType, ticketId }` → gets `{ url, key }`.
2. Client `PUT` the file to `url` with `Content-Type` header.
3. Client `POST /api/tickets` with the ticket fields + `attachments[]` referencing `r2Key`.

## Next steps
- Replace `lib/tickets.ts` mock with Prisma queries.
- Wire `TicketForm` to the sign + upload + create flow above.
- Add auth — replace the dummy login with NextAuth / Supabase Auth.
