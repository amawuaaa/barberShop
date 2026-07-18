import { createHmac, timingSafeEqual } from "node:crypto";

function getTokenSecret(): string | null {
  return process.env.ADMIN_SECRET ?? null;
}

/** Token firmado para que el cliente gestione su cita sin login. */
export function createAppointmentToken(appointmentId: string): string | null {
  const secret = getTokenSecret();
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(`appointment:${appointmentId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyAppointmentToken(
  appointmentId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;

  const expected = createAppointmentToken(appointmentId);
  if (!expected) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getAppBaseUrl(): string {
  const fromEnv =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function buildAppointmentManageUrl(appointmentId: string): string | null {
  const token = createAppointmentToken(appointmentId);
  if (!token) return null;
  return `${getAppBaseUrl()}/cita/${appointmentId}?t=${token}`;
}
