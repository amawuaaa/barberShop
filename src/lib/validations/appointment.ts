import { z } from "zod";

/**
 * Esquema Zod compartido entre el formulario (cliente)
 * y la ruta API (servidor) para validar reservas.
 */
export const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  barberId: z.string().min(1, "Selecciona un barbero"),
  /** Fecha en formato ISO (YYYY-MM-DD) */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  /** Hora en formato HH:mm (24h) */
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  email: z.email("Email inválido"),
  /** WhatsApp / teléfono (E.164 flexible para desarrollo) */
  phone: z
    .string()
    .min(8, "Número de WhatsApp inválido")
    .max(20, "Número demasiado largo")
    .regex(/^\+?[\d\s()-]+$/, "Usa solo números y el prefijo +"),
  clientId: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

/** Valores iniciales del wizard de reserva */
export const appointmentDefaultValues: AppointmentFormValues = {
  serviceId: "",
  barberId: "",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
};
