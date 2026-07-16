import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecrets() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;

  if (!password || !secret) {
    return null;
  }

  return { password, secret };
}

export function createAdminToken(password: string, secret: string): string {
  return createHash("sha256")
    .update(`${password}:${secret}`)
    .digest("hex");
}

export function verifyAdminPassword(input: string): boolean {
  const secrets = getSecrets();
  if (!secrets) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(secrets.password);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAdminSession(): Promise<void> {
  const secrets = getSecrets();
  if (!secrets) {
    throw new Error("ADMIN_PASSWORD / ADMIN_SECRET no configurados");
  }

  const token = createAdminToken(secrets.password, secrets.secret);
  const jar = await cookies();

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secrets = getSecrets();
  if (!secrets) return false;

  const jar = await cookies();
  const cookie = jar.get(COOKIE_NAME)?.value;
  if (!cookie) return false;

  const expected = createAdminToken(secrets.password, secrets.secret);
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireAdminConfigured(): { ok: true } | { ok: false; error: string } {
  if (!getSecrets()) {
    return {
      ok: false,
      error: "Configura ADMIN_PASSWORD y ADMIN_SECRET en .env",
    };
  }
  return { ok: true };
}
