# SIGMABARBER — Demo visual de reservas

Landing + wizard interactivo para enseñar el flujo de citas. **Sin base de datos ni correos**: el catálogo es estático y la confirmación ocurre solo en el navegador.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod

## Arranque rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Conecta el repo en Vercel
2. Deploy — no hace falta `DATABASE_URL` ni variables de entorno

## Nota

La carpeta `prisma/` queda como referencia para un backend real más adelante; la demo actual no la usa.
