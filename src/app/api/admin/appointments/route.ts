import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  barberId: z.string().min(1).optional(),
});

/**
 * GET /api/admin/appointments
 * ?date=YYYY-MM-DD  |  ?from=&to=  (+ opcional barberId)
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      barberId: searchParams.get("barberId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const { date, from, to, barberId } = parsed.data;

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(date
          ? { date: new Date(`${date}T00:00:00.000Z`) }
          : from && to
            ? {
                date: {
                  gte: new Date(`${from}T00:00:00.000Z`),
                  lte: new Date(`${to}T00:00:00.000Z`),
                },
              }
            : {}),
        ...(barberId ? { barberId } : {}),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        service: true,
        barber: true,
      },
      take: 200,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[GET /api/admin/appointments]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las citas" },
      { status: 500 }
    );
  }
}
