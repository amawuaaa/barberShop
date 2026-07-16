import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * GET /api/admin/barbers
 * Lista barberos con su horario semanal.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const barbers = await prisma.barber.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error("[GET /api/admin/barbers]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los barberos" },
      { status: 500 }
    );
  }
}
