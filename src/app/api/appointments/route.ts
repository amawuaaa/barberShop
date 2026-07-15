import { NextResponse } from "next/server";

/**
 * Demo visual: la reserva ocurre en el cliente.
 * Este endpoint existe solo por compatibilidad y no persiste ni notifica.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Demo visual: la reserva se confirma en el navegador, sin backend.",
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    message: "Demo visual — sin base de datos ni listado de citas.",
    appointments: [],
  });
}
