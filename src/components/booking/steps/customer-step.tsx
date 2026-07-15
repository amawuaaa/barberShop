"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppointmentFormValues } from "@/lib/validations/appointment";
import { formatPrice, type BarberOption, type ServiceOption } from "@/types/booking";

type CustomerStepProps = {
  register: UseFormRegister<AppointmentFormValues>;
  errors: FieldErrors<AppointmentFormValues>;
  service?: ServiceOption;
  barber?: BarberOption;
  date: string;
  time: string;
};

export function CustomerStep({
  register,
  errors,
  service,
  barber,
  date,
  time,
}: CustomerStepProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h3 className="font-display text-2xl font-bold tracking-[0.06em] text-[var(--silver-light)]">
          Tus datos
        </h3>
        <p className="text-sm text-[var(--silver)]">
          En la demo no se envía nada; solo completamos el flujo.
        </p>
      </header>

      <aside className="border border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-sm">
        <p className="font-medium text-[var(--silver-light)]">Resumen</p>
        <ul className="mt-2 space-y-1 text-[var(--silver)]">
          <li>
            Servicio: {service?.name ?? "—"}
            {service ? ` · ${formatPrice(service.price)}` : ""}
          </li>
          <li>Barbero: {barber?.name ?? "—"}</li>
          <li>
            Cuándo: {date || "—"} {time ? `a las ${time}` : ""}
          </li>
        </ul>
      </aside>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name" className="text-[var(--silver)]">
            Nombre completo
          </Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Tu nombre"
            className="border-[var(--line)] bg-[var(--ink)] text-[var(--silver-light)] placeholder:text-[var(--steel)]"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[var(--silver)]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="border-[var(--line)] bg-[var(--ink)] text-[var(--silver-light)] placeholder:text-[var(--steel)]"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[var(--silver)]">
            WhatsApp
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+34 600 000 000"
            className="border-[var(--line)] bg-[var(--ink)] text-[var(--silver-light)] placeholder:text-[var(--steel)]"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
