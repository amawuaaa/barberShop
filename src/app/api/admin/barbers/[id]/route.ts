import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { barberUpdateSchema } from "@/lib/validations/catalog";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/barbers/:id
 */
export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.barber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Barbero no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = barberUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de barbero inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.update({
      where: { id },
      data: parsed.data,
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ barber });
  } catch (error) {
    console.error("[PATCH /api/admin/barbers/:id]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el barbero" },
      { status: 500 }
    );
  }
}
