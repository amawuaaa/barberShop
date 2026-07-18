import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { BLOCKING_STATUSES } from "@/lib/availability";
import { dispatchReminderNotifications } from "@/lib/notifications";
import {
  formatDateInTimeZone,
  getAppTimeZone,
  zonedDateTimeToUtc,
} from "@/lib/timezone";

export type ReminderRunResult = {
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
  appointmentIds: string[];
};

/**
 * Envía recordatorios a citas activas que están a ~24h (ventana 22–26h).
 * Idempotente vía `reminderSentAt`.
 */
export async function sendDueReminders(
  now: Date = new Date()
): Promise<ReminderRunResult> {
  const timeZone = getAppTimeZone();
  const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  // Candidatos: citas activas sin recordatorio en los próximos ~2 días
  const fromDate = formatDateInTimeZone(now, timeZone);
  const toDate = formatDateInTimeZone(
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    timeZone
  );

  const candidates = await prisma.appointment.findMany({
    where: {
      status: { in: BLOCKING_STATUSES },
      reminderSentAt: null,
      date: {
        gte: new Date(`${fromDate}T00:00:00.000Z`),
        lte: new Date(`${toDate}T00:00:00.000Z`),
      },
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const result: ReminderRunResult = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    appointmentIds: [],
  };

  for (const appointment of candidates) {
    const dateStr = format(appointment.date, "yyyy-MM-dd");
    const startsAt = zonedDateTimeToUtc(dateStr, appointment.time, timeZone);

    if (startsAt < windowStart || startsAt > windowEnd) {
      result.skipped += 1;
      continue;
    }

    // Marca primero para evitar doble envío si el cron se solapa
    const claimed = await prisma.appointment.updateMany({
      where: {
        id: appointment.id,
        reminderSentAt: null,
        status: { in: BLOCKING_STATUSES },
      },
      data: { reminderSentAt: now },
    });

    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }

    const notifications = await dispatchReminderNotifications({
      appointmentId: appointment.id,
      customerName: appointment.name,
      customerEmail: appointment.email,
      customerPhone: appointment.phone,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
      date: dateStr,
      time: appointment.time,
    });

    const anySent = notifications.some((item) => item.status === "sent");
    const allFailed = notifications.every((item) => item.status === "failed");

    if (allFailed) {
      // Permite reintentar en el siguiente cron
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: null },
      });
      result.failed += 1;
      continue;
    }

    // Si todo fue skipped (sin keys), dejamos marcado para no spamear logs cada hora
    if (!anySent) {
      result.skipped += 1;
      result.appointmentIds.push(appointment.id);
      continue;
    }

    result.sent += 1;
    result.appointmentIds.push(appointment.id);
  }

  return result;
}
