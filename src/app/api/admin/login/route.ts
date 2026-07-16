import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAdminConfigured,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const configured = requireAdminConfigured();
  if (!configured.ok) {
    return NextResponse.json({ error: configured.error }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
    }

    if (!verifyAdminPassword(parsed.data.password)) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
