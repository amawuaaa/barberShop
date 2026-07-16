import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const dayScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    startTime: z.string().regex(timeRegex).optional().or(z.literal("")),
    endTime: z.string().regex(timeRegex).optional().or(z.literal("")),
    breakStart: z.string().regex(timeRegex).optional().nullable().or(z.literal("")),
    breakEnd: z.string().regex(timeRegex).optional().nullable().or(z.literal("")),
  })
  .superRefine((day, ctx) => {
    if (!day.enabled) return;

    if (!day.startTime || !day.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "Horario de inicio y fin obligatorios",
        path: ["startTime"],
      });
      return;
    }

    const [sh, sm] = day.startTime.split(":").map(Number);
    const [eh, em] = day.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "La hora de fin debe ser posterior al inicio",
        path: ["endTime"],
      });
    }

    const hasBreakStart = Boolean(day.breakStart);
    const hasBreakEnd = Boolean(day.breakEnd);

    if (hasBreakStart !== hasBreakEnd) {
      ctx.addIssue({
        code: "custom",
        message: "La pausa necesita inicio y fin",
        path: ["breakStart"],
      });
      return;
    }

    if (hasBreakStart && hasBreakEnd && day.breakStart && day.breakEnd) {
      const [bsh, bsm] = day.breakStart.split(":").map(Number);
      const [beh, bem] = day.breakEnd.split(":").map(Number);
      const breakStart = bsh * 60 + bsm;
      const breakEnd = beh * 60 + bem;

      if (breakEnd <= breakStart) {
        ctx.addIssue({
          code: "custom",
          message: "La pausa no es válida",
          path: ["breakEnd"],
        });
      }

      if (breakStart < start || breakEnd > end) {
        ctx.addIssue({
          code: "custom",
          message: "La pausa debe estar dentro del horario",
          path: ["breakStart"],
        });
      }
    }
  });

export const weekScheduleSchema = z.object({
  days: z.array(dayScheduleSchema).length(7),
});

export type DayScheduleInput = z.infer<typeof dayScheduleSchema>;
export type WeekScheduleInput = z.infer<typeof weekScheduleSchema>;

export function emptyWeekSchedule(): DayScheduleInput[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 6,
    startTime: "09:00",
    endTime: "19:00",
    breakStart: "13:00",
    breakEnd: "15:00",
  }));
}
