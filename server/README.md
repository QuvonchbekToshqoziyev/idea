IntentLoop minimal server (NestJS + Prisma)

Quick start (after installing dependencies):

```bash
cd new/server
npm install
export DATABASE_URL="postgresql://user:4321@localhost:5432/idea"
npx prisma generate
npm run dev
```

This scaffold includes a Prisma schema translated from the provided SQL and minimal `auth` and `plans` modules to exercise the core flows.
