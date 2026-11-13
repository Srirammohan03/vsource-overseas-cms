# VSource Overseas

The existing VSource public site is served by the Next.js 15 App Router while retaining its React pages, shared components, Tailwind styles, assets, responsive layouts and animations. CMS records are stored in PostgreSQL through Prisma. Local image/video files live outside the public source tree and are served through the restricted `/media/*` route.

## Architecture

- `src/app` — Next.js routes, APIs, auth and media serving. `src/app/[[...path]]/page.next.tsx` bridges the existing React Router website into the App Router so public paths and page components remain in place.
- `src/pages`, `src/components`, `src/types` — existing public page UI, sections, assets and data types.
- `src/features/cms` — structured admin editors, validation schemas and CMS types.
- `src/lib/cms.ts` — published-content queries used by public APIs; drafts are excluded.
- `src/lib/storage` and `src/lib/media` — private local file storage and public media URL helpers.
- `prisma/schema.prisma`, `prisma/seed.ts` — relational data model and initial Super Admin seed.
- `public/assets` — existing static site images, fonts and other public assets.

## Environment

Copy `.env.example` to `.env` and configure `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `UPLOAD_DIR`. Keep `.env` out of version control. No third-party CMS or media-storage credentials are used.

Development media defaults to `./storage/uploads`. On a VPS, set `UPLOAD_DIR=/var/www/vsource-storage`. The app process user must have read/write access to that directory; keep it on persistent storage across deployments and back it up separately. Do not put private uploads under `public/`.

## Setup and development

```sh
npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run seed:admin
npm run dev
```

The seed requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it hashes the password and does not overwrite an existing account. Use `/admin/login` to sign in. Admins can change their own password in Settings. Admin user creation and role/deactivation controls require Super Admin access.

Initial administrator commands (replace the email and password placeholders; never commit them):

PowerShell:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "use-a-unique-password-of-at-least-12-characters"
npm run seed:admin
```

Linux / VPS:

```sh
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="use-a-unique-password-of-at-least-12-characters" npm run seed:admin
```

## CMS modules

The admin dashboard provides Dashboard, Study Destinations, Universities, University Courses, Gallery, Media Library, Admin Users and Settings. Editors use structured controls and repeatable fields; flexible content is serialized into Prisma JSON internally. Destination and university SEO metadata is editable alongside its page content. Public destination, university, course and gallery queries expose published records only.

## Production / VPS

1. Install the supported Node.js runtime and dependencies, configure the Neon `DATABASE_URL`, `AUTH_SECRET`, public site URL and persistent `UPLOAD_DIR`.
2. Ensure the deployment user can create/read files in `/var/www/vsource-storage` (for example, create the directory and assign it to the app service user before starting the service).
3. Run `npx prisma validate`, `npx prisma generate`, and `npx prisma db push` after reviewing schema changes; use database backups and a migration process for production schema changes.
4. Run `npm run seed:admin` once with the initial Super Admin environment values, then remove `ADMIN_PASSWORD` from the runtime environment if it is not needed for reseeding.
5. Run `npm run build` and start with `npm run start` behind the VPS reverse proxy with HTTPS.

## Verification commands

```sh
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

The local public asset folder and existing public layouts are retained; uploaded CMS media is stored separately under `UPLOAD_DIR`.
