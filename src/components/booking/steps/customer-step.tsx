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

const fieldClassName =
  "h-12 rounded-none border-[var(--line)] bg-[var(--ink)] px-3 text-base text-[var(--silver-light)] placeholder:text-[var(--steel)] focus-visible:border-[var(--silver)] focus-visible:ring-[var(--silver)]/30";

export function CustomerStep({
  register,
  errors,
  service,
  barber,
  date,
  time,
}: CustomerStepProps) {
  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="space-y-2">
        <h3 className="font-display text-2xl font-bold tracking-[0.06em] text-[var(--silver-light)] sm:text-3xl">
          Tus datos
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-[var(--silver)] sm:text-base">
          Último paso. Te enviaremos la confirmación por email y WhatsApp.
        </p>
      </header>

      <aside className="border border-[var(--line)] bg-[var(--ink)]">
        <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <p className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--silver-light)]">
            RESUMEN DE CITA
          </p>
        </div>
        <dl className="divide-y divide-[var(--line)]">
          <div className="flex items-baseline justify-between gap-4 px-4 py-3.5 sm:px-5">
            <dt className="text-sm text-[var(--steel)]">Servicio</dt>
            <dd className="text-right text-sm font-medium text-[var(--silver-light)]">
              {service?.name ?? "—"}
              {service ? (
                <span className="mt-0.5 block text-[var(--silver)]">
                  {formatPrice(service.price)}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3.5 sm:px-5">
            <dt className="text-sm text-[var(--steel)]">Barbero</dt>
            <dd className="text-right text-sm font-medium text-[var(--silver-light)]">
              {barber?.name ?? "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3.5 sm:px-5">
            <dt className="text-sm text-[var(--steel)]">Cuándo</dt>
            <dd className="text-right text-sm font-medium text-[var(--silver-light)]">
              {date || "—"}
              {time ? (
                <span className="mt-0.5 block text-[var(--silver)]">{time}</span>
              ) : null}
            </dd>
          </div>
        </dl>
      </aside>

      <div className="space-y-5 border border-[var(--line)] bg-[#1a1d22] p-4 sm:space-y-6 sm:p-6">
        <p className="font-display text-sm font-semibold tracking-[0.12em] text-[var(--silver-light)]">
          CONTACTO
        </p>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-5">
          <div className="space-y-2.5 sm:col-span-2">
            <Label
              htmlFor="name"
              className="text-sm text-[var(--silver)] sm:text-base"
            >
              Nombre completo
            </Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Tu nombre"
              className={fieldClassName}
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="email"
              className="text-sm text-[var(--silver)] sm:text-base"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              className={fieldClassName}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="phone"
              className="text-sm text-[var(--silver)] sm:text-base"
            >
              WhatsApp
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+34 600 000 000"
              className={fieldClassName}
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
