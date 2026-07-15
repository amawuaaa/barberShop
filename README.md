# SIGMABARBER — Agendamiento de citas

Base de aplicación Next.js para reservar citas online, con Prisma/SQLite, React Hook Form + Zod, y stubs listos para confirmaciones por **Email (Resend)** y **WhatsApp (Twilio)**.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite
- React Hook Form + Zod

## Arranque rápido

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura relevante

```
prisma/
  schema.prisma          # Barber, Service, Appointment
  seed.ts                # Datos de ejemplo
src/
  app/
    page.tsx             # Landing + wizard
    api/appointments/    # POST/GET reservas
  components/
    booking/             # Flujo paso a paso
    landing/             # Hero y preview de servicios
  lib/
    prisma.ts
    validations/         # Esquemas Zod
    notifications.ts     # Stubs Resend + Twilio
```

## Flujo de reserva

1. Servicio  
2. Barbero  
3. Fecha y hora (calendario)  
4. Datos del cliente → `POST /api/appointments`

Tras guardar la cita, la API invoca stubs de notificación en `src/lib/notifications.ts`. Sustituye esos stubs por las SDK de Resend y Twilio cuando tengas las API keys.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run db:migrate` | Aplica migraciones |
| `npm run db:seed` | Rellena servicios y barberos |
| `npm run db:studio` | Prisma Studio |
