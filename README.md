# SIGMABARBER — Reservas con Postgres

Aplicación de citas para barbería: wizard de reserva, disponibilidad real por barbero, bloqueo de slots y panel mínimo del dueño.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + **PostgreSQL**
- React Hook Form + Zod

## Arranque local (Docker)

```bash
# 1) Postgres
npm run db:up

# 2) Entorno
cp .env.example .env

# 3) Migraciones + datos demo
npx prisma migrate dev
npm run db:seed

# 4) App
npm run dev
```

- Web: [http://localhost:3000](http://localhost:3000)
- Panel dueño: [http://localhost:3000/admin](http://localhost:3000/admin)  
  Contraseña por defecto en `.env`: `sigmabarber-admin`

## Qué incluye

| Pieza | Descripción |
|--------|-------------|
| `BarberAvailability` | Horario semanal por barbero (pausa incluida) |
| `/api/availability` | Slots libres (oculta ocupados / pasados) |
| `/api/appointments` | Crea cita + comprueba solapes |
| `/admin` | Lista citas del día y cambia estado |
| Notificaciones | Stubs Resend / Twilio en `src/lib/notifications.ts` |

Estados de cita: `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`.

## Staging / producción (Neon, Supabase, Railway)

1. Crea un proyecto Postgres en Neon, Supabase o Railway.
2. Copia la connection string a `DATABASE_URL` (con `?sslmode=require` si aplica).
3. En el hosting (Vercel):

```bash
npx prisma migrate deploy
npm run db:seed   # solo la primera vez
```

4. Define también `ADMIN_PASSWORD` y `ADMIN_SECRET`.

Local sigue usando Docker; staging usa la URL remota. Mismo schema Prisma.

## Scripts útiles

| Script | Acción |
|--------|--------|
| `npm run db:up` | Levanta Postgres |
| `npm run db:down` | Para Postgres |
| `npm run db:migrate` | Migraciones |
| `npm run db:seed` | Servicios, barberos y horarios |
| `npm run db:studio` | Prisma Studio |
