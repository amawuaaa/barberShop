import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/reminders";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // En local sin secret: solo permitir en desarrollo
    return process.env.NODE_ENV !== "production";
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron también puede enviar el header x-vercel-cron
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "1" && auth === `Bearer ${secret}`) return true;

  return false;
}

/**
 * GET/POST /api/cron/reminders
 * Pensado para Vercel Cron (cada hora). Protegido con CRON_SECRET.
 */
async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await sendDueReminders();
    console.info("[cron/reminders]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/reminders]", error);
    return NextResponse.json(
      { error: "No se pudieron enviar recordatorios" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
