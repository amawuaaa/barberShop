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
| Notificaciones | Resend (email) + Twilio WhatsApp en `src/lib/notifications.ts` |
| `/admin` → Horarios | Editar disponibilidad semanal por barbero |

Estados de cita: `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`.

## Notificaciones (paso 2)

Sin API keys la reserva **sigue funcionando**; email/WhatsApp se omiten con log `skipped`.

### Resend (email)
1. Crea cuenta en [resend.com](https://resend.com) y una API key.
2. Para pruebas: `RESEND_FROM_EMAIL="SIGMABARBER <onboarding@resend.dev>"` (solo envía a tu email de cuenta).
3. En producción: verifica tu dominio y usa `citas@tudominio.com`.

```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL="SIGMABARBER <onboarding@resend.dev>"
# NOTIFY_OWNER_EMAIL="dueno@tudominio.com"
```

### Twilio WhatsApp
1. [Twilio Console](https://console.twilio.com) → Account SID + Auth Token.
2. Activa WhatsApp Sandbox (`TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`).
3. El número del cliente debe unirse al sandbox (código que muestra Twilio).

```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
# NOTIFY_OWNER_WHATSAPP="+34600000000"
```

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
