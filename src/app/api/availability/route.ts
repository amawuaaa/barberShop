import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/availability";

const querySchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/availability?barberId=&serviceId=&date=YYYY-MM-DD
 * Devuelve slots libres según horario del barbero y citas ocupadas.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      barberId: searchParams.get("barberId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await getAvailableSlots(parsed.data);

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
