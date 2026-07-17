import { z } from "zod";

export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  /** Duración en minutos */
  duration: z
    .number()
    .int("La duración debe ser un número entero")
    .min(10, "Mínimo 10 minutos")
    .max(240, "Máximo 240 minutos"),
  /** Precio en céntimos */
  price: z
    .number()
    .int("El precio debe ser un número entero")
    .min(0, "El precio no puede ser negativo")
    .max(1_000_000, "Precio demasiado alto"),
  active: z.boolean().optional(),
});

export const serviceUpdateSchema = serviceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "No hay cambios" }
);

export const barberSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  specialty: z
    .string()
    .min(2, "La especialidad debe tener al menos 2 caracteres")
    .max(120, "La especialidad es demasiado larga"),
  active: z.boolean().optional(),
});

export const barberUpdateSchema = barberSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "No hay cambios" }
);

export type ServiceInput = z.infer<typeof serviceSchema>;
export type BarberInput = z.infer<typeof barberSchema>;
