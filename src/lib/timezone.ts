/** Zona horaria de la barbería (slots y recordatorios). */
export function getAppTimeZone(): string {
  return process.env.APP_TIMEZONE || "Europe/Madrid";
}

/**
 * Interpreta YYYY-MM-DD + HH:mm en la zona de la tienda → Instant UTC.
 */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string = getAppTimeZone()
): Date {
  const asUtc = new Date(`${date}T${time}:00.000Z`);
  const inZone = new Date(asUtc.toLocaleString("en-US", { timeZone }));
  const inUtc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = inUtc.getTime() - inZone.getTime();
  return new Date(asUtc.getTime() + offsetMs);
}

/** Fecha calendario YYYY-MM-DD en la zona de la tienda. */
export function formatDateInTimeZone(
  date: Date,
  timeZone: string = getAppTimeZone()
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Minutos desde medianoche en la zona de la tienda. */
export function nowMinutesInTimeZone(
  date: Date = new Date(),
  timeZone: string = getAppTimeZone()
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0"
  );
  return hour * 60 + minute;
}

/** Suma días a una fecha YYYY-MM-DD (calendario, sin timezone). */
export function addCalendarDays(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}
