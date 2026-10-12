This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# MarkasTI2

## Photo storage

Profile, team, preset, and gallery images are stored in Vercel Blob. Profile
images use a private store (`BLOB_READ_WRITE_TOKEN`) and are streamed through
`/api/images/*`; gallery and team/preset images use a separate public store
(`BLOB_PUBLIC_READ_WRITE_TOKEN`) and are served directly by the Blob CDN. Set
both tokens in Vercel and `.env.local` (they must belong to private and public
stores respectively); never commit them. HEIC and HEIF files are converted in
the browser to optimized WebP before upload. Existing private gallery/team
images continue to work through the proxy until replaced or migrated.

Realtime SSE events use Upstash Redis Pub/Sub across server instances when
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured. Without
those variables, each local development process uses in-memory fan-out.

Legacy local images can be migrated with
`bun scripts/migrateLocalImagesToVercel.ts --apply --delete-local`. The
script validates Blob reads and database references before removing local
copies. See [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage)
for store configuration details.

## Prisma Studio & Seeding

Quick commands to open Prisma Studio and seed admin users (run from project root):

```powershell
# Open Prisma Studio in the browser
npx prisma studio

# Run seed script (ensure DATABASE_URL is set in .env.local)
node scripts/seedAdmins.js
```

If you need to create initial `Jadwal`, `StrukturKelas`, or `Dosen` entries immediately, use Prisma Studio to create records or run simple insert scripts against the database.
