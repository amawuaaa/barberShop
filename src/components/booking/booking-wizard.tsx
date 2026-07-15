"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  appointmentDefaultValues,
  appointmentSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";
import type { BarberOption, BookingStep, ServiceOption } from "@/types/booking";
import { BookingProgress } from "./booking-progress";
import { ServiceStep } from "./steps/service-step";
import { BarberStep } from "./steps/barber-step";
import { DateTimeStep } from "./steps/datetime-step";
import { CustomerStep } from "./steps/customer-step";

type BookingWizardProps = {
  services: ServiceOption[];
  barbers: BarberOption[];
};

export function BookingWizard({ services, barbers }: BookingWizardProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    service: string;
    barber: string;
    date: string;
    time: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointmentDefaultValues,
    mode: "onTouched",
  });

  const values = watch();
  const selectedService = services.find((s) => s.id === values.serviceId);
  const selectedBarber = barbers.find((b) => b.id === values.barberId);

  async function goNext() {
    const fieldsByStep: Record<BookingStep, (keyof AppointmentFormValues)[]> = {
      1: ["serviceId"],
      2: ["barberId"],
      3: ["date", "time"],
      4: ["name", "email", "phone"],
    };

    const valid = await trigger(fieldsByStep[step]);
    if (!valid) return;

    if (step < 4) {
      setStep((step + 1) as BookingStep);
    }
  }

  function goBack() {
    if (step > 1) {
      setStep((step - 1) as BookingStep);
    }
  }

  function onSubmit(data: AppointmentFormValues) {
    setSubmitError(null);

    startTransition(() => {
      const service = services.find((s) => s.id === data.serviceId);
      const barber = barbers.find((b) => b.id === data.barberId);

      // Demo visual: confirmación local, sin API ni correos
      setConfirmation({
        id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        service: service?.name ?? "—",
        barber: barber?.name ?? "—",
        date: data.date,
        time: data.time,
      });
    });
  }

  if (confirmation) {
    return (
      <div className="booking-panel animate-fade-up space-y-6 px-5 py-8 sm:px-8">
        <div className="flex flex-col items-start gap-3">
          <CheckCircle2 className="size-10 text-[var(--silver-light)]" aria-hidden />
          <h3 className="font-display text-3xl font-bold tracking-[0.06em] text-[var(--silver-light)]">
            Cita reservada
          </h3>
          <p className="max-w-md text-[var(--silver)]">
            Demo lista. No se guarda nada ni se envía email o WhatsApp — solo
            para enseñar el flujo.
          </p>
        </div>
        <dl className="grid gap-2 border border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--steel)]">Servicio</dt>
            <dd className="font-medium text-[var(--silver-light)]">{confirmation.service}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--steel)]">Barbero</dt>
            <dd className="font-medium text-[var(--silver-light)]">{confirmation.barber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--steel)]">Cuándo</dt>
            <dd className="font-medium text-[var(--silver-light)]">
              {confirmation.date} · {confirmation.time}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--steel)]">Referencia</dt>
            <dd className="font-mono text-xs text-[var(--silver)]">{confirmation.id}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="outline"
          className="border-[var(--silver)] text-[var(--silver-light)] hover:bg-[var(--silver-light)] hover:text-[var(--ink)]"
          onClick={() => {
            setConfirmation(null);
            setStep(1);
            setValue("serviceId", "");
            setValue("barberId", "");
            setValue("date", "");
            setValue("time", "");
            setValue("name", "");
            setValue("email", "");
            setValue("phone", "");
          }}
        >
          Reservar otra cita
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="booking-panel space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8"
    >
      <BookingProgress currentStep={step} />

      <div key={step} className="animate-fade-up min-h-[280px]">
        {step === 1 && (
          <ServiceStep
            services={services}
            selectedId={values.serviceId}
            onSelect={(id) => {
              setValue("serviceId", id, { shouldValidate: true });
            }}
          />
        )}
        {step === 2 && (
          <BarberStep
            barbers={barbers}
            selectedId={values.barberId}
            onSelect={(id) => {
              setValue("barberId", id, { shouldValidate: true });
            }}
          />
        )}
        {step === 3 && (
          <DateTimeStep
            selectedDate={values.date}
            selectedTime={values.time}
            onSelectDate={(date) => setValue("date", date, { shouldValidate: true })}
            onSelectTime={(time) => setValue("time", time, { shouldValidate: true })}
          />
        )}
        {step === 4 && (
          <CustomerStep
            register={register}
            errors={errors}
            service={selectedService}
            barber={selectedBarber}
            date={values.date}
            time={values.time}
          />
        )}
      </div>

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-5 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 1 || isPending}
          className="min-h-11 gap-1 px-3 text-[var(--silver)] hover:text-[var(--silver-light)]"
        >
          <ChevronLeft className="size-4" />
          Atrás
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={goNext}
            className="min-h-11 gap-1 bg-[var(--silver-light)] px-4 text-[var(--ink)] hover:bg-[var(--silver)]"
          >
            Continuar
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isPending}
            className="min-h-11 min-w-0 gap-2 bg-[var(--silver-light)] px-4 text-[var(--ink)] hover:bg-[var(--silver)] sm:min-w-36"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reservando…
              </>
            ) : (
              "Confirmar cita"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
