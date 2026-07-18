import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { BLOCKING_STATUSES } from "@/lib/availability";
import { dispatchReminderNotifications } from "@/lib/notifications";
import {
  addCalendarDays,
  formatDateInTimeZone,
  getAppTimeZone,
} from "@/lib/timezone";

export type ReminderRunResult = {
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
  appointmentIds: string[];
  targetDate: string;
};

/**
 * Recordatorios para las citas de **mañana** (zona de la barbería).
 * Pensado para cron diario (Hobby: 1×/día). Idempotente vía `reminderSentAt`.
 */
export async function sendDueReminders(
  now: Date = new Date()
): Promise<ReminderRunResult> {
  const timeZone = getAppTimeZone();
  const today = formatDateInTimeZone(now, timeZone);
  const tomorrow = addCalendarDays(today, 1);
  const targetDay = new Date(`${tomorrow}T00:00:00.000Z`);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: { in: BLOCKING_STATUSES },
      reminderSentAt: null,
      date: targetDay,
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: [{ time: "asc" }],
  });

  const result: ReminderRunResult = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    appointmentIds: [],
    targetDate: tomorrow,
  };

  for (const appointment of candidates) {
    const dateStr = format(appointment.date, "yyyy-MM-dd");

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
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: null },
      });
      result.failed += 1;
      continue;
    }

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
