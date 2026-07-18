import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/availability";
import { verifyAppointmentToken } from "@/lib/appointment-token";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

const querySchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ignore: z.string().optional(),
  t: z.string().optional(),
});

/**
 * GET /api/availability?barberId=&serviceId=&date=YYYY-MM-DD
 * Opcional: ignore=&t= para reprogramar (libera el slot de esa cita).
 */
export async function GET(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit({
    key: `availability:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera un momento." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      barberId: searchParams.get("barberId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
      ignore: searchParams.get("ignore") ?? undefined,
      t: searchParams.get("t") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let ignoreAppointmentId: string | undefined;

    if (parsed.data.ignore) {
      if (!verifyAppointmentToken(parsed.data.ignore, parsed.data.t)) {
        return NextResponse.json(
          { error: "Token de reprogramación no válido" },
          { status: 401 }
        );
      }
      ignoreAppointmentId = parsed.data.ignore;
    }

    const result = await getAvailableSlots({
      barberId: parsed.data.barberId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      ignoreAppointmentId,
    });

    return NextResponse.json({
      date: parsed.data.date,
      slots: result.slots,
      reason: result.reason ?? null,
    });
  } catch (error) {
    console.error("[GET /api/availability]", error);
    return NextResponse.json(
      { error: "No se pudo calcular disponibilidad" },
      { status: 500 }
    );
  }
}
