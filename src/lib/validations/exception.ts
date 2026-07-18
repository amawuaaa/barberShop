import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const barberExceptionSchema = z
  .object({
    date: z.string().regex(dateRegex, "Fecha inválida (YYYY-MM-DD)"),
    isClosed: z.boolean(),
    startTime: z.string().regex(timeRegex).optional().or(z.literal("")),
    endTime: z.string().regex(timeRegex).optional().or(z.literal("")),
    breakStart: z
      .string()
      .regex(timeRegex)
      .optional()
      .nullable()
      .or(z.literal("")),
    breakEnd: z
      .string()
      .regex(timeRegex)
      .optional()
      .nullable()
      .or(z.literal("")),
    note: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.isClosed) return;

    if (!data.startTime || !data.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "Horario especial requiere inicio y fin",
        path: ["startTime"],
      });
      return;
    }

    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "La hora de fin debe ser posterior al inicio",
        path: ["endTime"],
      });
    }

    const hasBreakStart = Boolean(data.breakStart);
    const hasBreakEnd = Boolean(data.breakEnd);

    if (hasBreakStart !== hasBreakEnd) {
      ctx.addIssue({
        code: "custom",
        message: "La pausa necesita inicio y fin",
        path: ["breakStart"],
      });
      return;
    }

    if (hasBreakStart && hasBreakEnd && data.breakStart && data.breakEnd) {
      const [bsh, bsm] = data.breakStart.split(":").map(Number);
      const [beh, bem] = data.breakEnd.split(":").map(Number);
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

export type BarberExceptionInput = z.infer<typeof barberExceptionSchema>;
