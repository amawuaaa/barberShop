import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { serviceSchema } from "@/lib/validations/catalog";

/**
 * GET /api/admin/services — listado completo (activos e inactivos).
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[GET /api/admin/services]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los servicios" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services — crea un servicio.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = serviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de servicio inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name: parsed.data.name,
        duration: parsed.data.duration,
        price: parsed.data.price,
        active: parsed.data.active ?? true,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/services]", error);
    return NextResponse.json(
      { error: "No se pudo crear el servicio" },
      { status: 500 }
    );
  }
}
