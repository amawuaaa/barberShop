import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { barberExceptionSchema } from "@/lib/validations/exception";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeException(exception: {
  id: string;
  date: Date;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  note: string | null;
}) {
  return {
    id: exception.id,
    date: format(exception.date, "yyyy-MM-dd"),
    isClosed: exception.isClosed,
    startTime: exception.startTime,
    endTime: exception.endTime,
    breakStart: exception.breakStart,
    breakEnd: exception.breakEnd,
    note: exception.note,
  };
}

/**
 * GET /api/admin/barbers/:id/exceptions
 * Lista excepciones futuras (y de hoy) del barbero.
 */
export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: barberId } = await context.params;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const exceptions = await prisma.barberException.findMany({
      where: {
        barberId,
        date: { gte: today },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      exceptions: exceptions.map(serializeException),
    });
  } catch (error) {
    console.error("[GET /api/admin/barbers/:id/exceptions]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las excepciones" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/barbers/:id/exceptions
 * Crea o reemplaza la excepción de un día.
 */
export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: barberId } = await context.params;
    const barber = await prisma.barber.findUnique({ where: { id: barberId } });

    if (!barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = barberExceptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Excepción inválida",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const date = new Date(`${data.date}T00:00:00.000Z`);

    const exception = await prisma.barberException.upsert({
      where: {
        barberId_date: { barberId, date },
      },
      create: {
        barberId,
        date,
        isClosed: data.isClosed,
        startTime: data.isClosed ? null : data.startTime || null,
        endTime: data.isClosed ? null : data.endTime || null,
        breakStart: data.isClosed ? null : data.breakStart || null,
        breakEnd: data.isClosed ? null : data.breakEnd || null,
        note: data.note || null,
      },
      update: {
        isClosed: data.isClosed,
        startTime: data.isClosed ? null : data.startTime || null,
        endTime: data.isClosed ? null : data.endTime || null,
        breakStart: data.isClosed ? null : data.breakStart || null,
        breakEnd: data.isClosed ? null : data.breakEnd || null,
        note: data.note || null,
      },
    });

    return NextResponse.json(
      { ok: true, exception: serializeException(exception) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/barbers/:id/exceptions]", error);
    return NextResponse.json(
      { error: "No se pudo guardar la excepción" },
      { status: 500 }
    );
  }
}
