# MarkasTI Backend - Dokumentasi Lengkap

## Teknologi
- **Next.js 16** - Full-stack framework
- **Prisma ORM** - Database layer (type-safe)
- **PostgreSQL** - Database
- **React 19** - UI
- **Tailwind CSS** - Styling
- **Zod** - Validation
- **QR Code** - Payment integration

## Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE markas_ti;"

# Verify
psql -U postgres -c "\l" | grep markas_ti
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` dengan PostgreSQL credentials:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/markas_ti"
```

### 4. Run Prisma Migrations
```bash
# Create and run initial migration
npm run db:setup

# Atau manual:
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
```

Access:
- **App**: `http://localhost:3000`
- **Admin**: `http://localhost:3000/admin/dashboard`
- **Prisma Studio** (GUI): `npm run prisma:studio`

---

## Struktur Folder

```
prisma/
├── schema.prisma          # Data model & migrations
└── migrations/            # Auto-generated migrations

src/
├── app/
│   ├── admin/             # Dashboard pages
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── dosen/
│   │   ├── attendance/
│   │   ├── kas-masuk/
│   │   └── kas-keluar/
│   └── api/               # API routes
│       ├── dosen/
│       ├── attendance/
│       ├── kas-masuk/
│       └── kas-keluar/
├── libs/
│   ├── types.ts           # TypeScript types
│   ├── prisma.ts          # Prisma client
│   ├── dosenRepo.ts       # Dosen queries
│   ├── attendanceRepo.ts  # Attendance queries
│   ├── kasMasukRepo.ts    # Income queries
│   └── kasKeluarRepo.ts   # Expense queries
```

---

## API Endpoints

### Dosen Management
- **GET** `/api/dosen` - List all dosen
- **POST** `/api/dosen` - Create new dosen
- **GET** `/api/dosen/[id]` - Get dosen detail
- **PUT** `/api/dosen/[id]` - Update dosen
- **DELETE** `/api/dosen/[id]` - Delete dosen

### Attendance
- **GET** `/api/attendance` - List (filters: ?dosenId=1&date=2025-12-03)
- **POST** `/api/attendance` - Record attendance

### Income (Kas Masuk)
- **GET** `/api/kas-masuk` - List all
- **POST** `/api/kas-masuk` - Add income
- **PUT** `/api/kas-masuk?action=generate-qr` - Generate QR Code

### Expense (Kas Keluar)
- **GET** `/api/kas-keluar` - List all
- **POST** `/api/kas-keluar` - Add expense

---

## Database Schema (Prisma Models)

See `prisma/schema.prisma` for complete schema.

### Tables:
- `dosen` - Lecturer data
- `attendance` - Attendance records
- `kas_masuk` - Income tracking
- `kas_keluar` - Expense tracking
- `jadwal` - Schedule
- `struktur_kelas` - Class structure
- `admin_user` - Admin users

---

## Admin Dashboard Features

**URL**: `http://localhost:3000/admin/dashboard`

1. **Dashboard** - Statistics overview
2. **Data Dosen** - Manage lecturer data
3. **Kehadiran** - Record & view attendance
4. **Kas Masuk** - Track income (cash/transfer/QR)
5. **Kas Keluar** - Track expenses

---

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create & run migration
npm run prisma:migrate

# Open GUI to view data
npm run prisma:studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# See migration history
npx prisma migrate status
```

---

## API Examples

### Add Dosen
```bash
curl -X POST http://localhost:3000/api/dosen \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Budi",
    "nip": "12345",
    "email": "budi@example.com"
  }'
```

### Record Attendance
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "dosenId": 1,
    "date": "2025-12-03",
    "time": "09:00",
    "status": "hadir"
  }'
```

### Add Income
```bash
curl -X POST http://localhost:3000/api/kas-masuk \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "description": "Iuran Agustus",
    "paymentMethod": "cash",
    "date": "2025-12-03"
  }'
```

### Generate QR Code
```bash
curl -X PUT "http://localhost:3000/api/kas-masuk?action=generate-qr" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "description": "Iuran"
  }'
```

---

## Production Build

```bash
npm run build
npm start
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Can't reach database server" | Check PostgreSQL running, verify DATABASE_URL |
| "Migration table not found" | Run `npx prisma migrate dev --name init` |
| "Module not found" | Run `npm install` again |
| "QR Code generation failed" | Ensure `qrcode` installed: `npm install qrcode` |

See `PRISMA_SETUP.md` for detailed Prisma instructions.
