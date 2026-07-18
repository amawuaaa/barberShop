import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string; exceptionId: string }>;
};

/**
 * DELETE /api/admin/barbers/:id/exceptions/:exceptionId
 */
export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: barberId, exceptionId } = await context.params;

    const existing = await prisma.barberException.findFirst({
      where: { id: exceptionId, barberId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Excepción no encontrada" },
        { status: 404 }
      );
    }

    await prisma.barberException.delete({ where: { id: exceptionId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[DELETE /api/admin/barbers/:id/exceptions/:exceptionId]",
      error
    );
    return NextResponse.json(
      { error: "No se pudo eliminar la excepción" },
      { status: 500 }
    );
  }
}
