import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const manageAppointmentSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    token: z.string().min(16),
  }),
  z.object({
    action: z.literal("reschedule"),
    token: z.string().min(16),
    date: z.string().regex(dateRegex),
    time: z.string().regex(timeRegex),
  }),
]);

export type ManageAppointmentInput = z.infer<typeof manageAppointmentSchema>;
