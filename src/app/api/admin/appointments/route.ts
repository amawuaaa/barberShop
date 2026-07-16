import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * GET /api/admin/appointments?date=YYYY-MM-DD (opcional)
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const appointments = await prisma.appointment.findMany({
      where: date
        ? { date: new Date(`${date}T00:00:00.000Z`) }
        : undefined,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        service: true,
        barber: true,
      },
      take: 100,
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
