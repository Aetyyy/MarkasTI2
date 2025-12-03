# Prisma Setup Instructions

## 1. Install Dependencies
```bash
npm install
```

## 2. Setup Database

### Create PostgreSQL Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE markas_ti;"

# Verify database exists
psql -U postgres -c "\l" | grep markas_ti
```

## 3. Generate Prisma Migrations & Push to DB

```bash
# Option A: Create initial migration from schema (recommended)
npx prisma migrate dev --name init

# This will:
# - Create migration file
# - Run migration against database
# - Generate Prisma Client

# Option B: If database already has schema, introspect it
# npx prisma db push
```

## 4. Verify Setup
```bash
# Check Prisma schema and generate client
npx prisma generate

# Open Prisma Studio to view data
npx prisma studio
```

## 5. Start Development Server
```bash
npm run dev
```

Access:
- Homepage: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3000/admin/dashboard`
- Prisma Studio: `http://localhost:5555` (when running `npx prisma studio`)

## Troubleshooting

### Error: "Can't reach database server"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env.local
- Verify database exists: `psql -U postgres -c "\l"`

### Error: "Migrations table not found"
```bash
# Reset database (warning: deletes data!)
npx prisma migrate reset
```

### Generate new Prisma Client after schema changes
```bash
npx prisma generate
# or
npx prisma migrate dev --name <description>
```

## Migration Files
Located in `prisma/migrations/`. Never edit these manually.

## Production Deployment
```bash
# On production server:
DATABASE_URL="postgresql://prod-user:prod-pass@prod-host:5432/markas_ti" npx prisma migrate deploy
```
