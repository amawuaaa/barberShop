"use client";

import { useEffect, useState } from "react";
import { es } from "date-fns/locale";
import { format, isBefore, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type DateTimeStepProps = {
  barberId: string;
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
};

export function DateTimeStep({
  barberId,
  serviceId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: DateTimeStepProps) {
  const [slots, setSlots] = useState<string[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : undefined;

  useEffect(() => {
    if (!selectedDate || !barberId || !serviceId) {
      setSlots([]);
      setReason(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setReason(null);

    const params = new URLSearchParams({
      barberId,
      serviceId,
      date: selectedDate,
    });

    fetch(`/api/availability?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setSlots([]);
          setReason(payload.error ?? "No se pudo cargar disponibilidad");
          return;
        }
        setSlots(payload.slots ?? []);
        setReason(payload.reason ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSlots([]);
        setReason("Error de red al cargar horarios");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedDate, barberId, serviceId]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-xl font-bold tracking-[0.06em] text-[var(--silver-light)] sm:text-2xl">
          Fecha y hora
        </h3>
        <p className="text-sm text-[var(--silver)]">
          Solo se muestran huecos libres según el horario del barbero.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="w-full overflow-x-auto">
          <Calendar
            mode="single"
            locale={es}
            selected={selected}
            onSelect={(day) => {
              if (!day) return;
              onSelectDate(format(day, "yyyy-MM-dd"));
              onSelectTime("");
            }}
            disabled={(day) => {
              const today = startOfDay(new Date());
              return isBefore(day, today) || day.getDay() === 0;
            }}
            className="mx-auto w-full max-w-[320px] border border-[var(--line)] bg-[var(--ink)] text-[var(--silver-light)] sm:mx-0"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--silver-light)]">
            {selectedDate
              ? `Horarios — ${format(new Date(`${selectedDate}T12:00:00`), "EEEE d MMM", { locale: es })}`
              : "Selecciona una fecha para ver horarios"}
          </p>

          {loading && (
            <p className="inline-flex items-center gap-2 text-sm text-[var(--steel)]">
              <Loader2 className="size-4 animate-spin" />
              Cargando disponibilidad…
            </p>
          )}

          {!loading && selectedDate && slots.length === 0 && (
            <p className="text-sm text-[var(--steel)]">
              {reason ?? "No hay huecos libres este día."}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const active = slot === selectedTime;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectTime(slot)}
                  className={cn(
                    "min-h-11 border px-2 py-2.5 text-sm transition-all duration-200",
                    active
                      ? "border-[var(--silver-light)] bg-[var(--silver-light)] text-[var(--ink)]"
                      : "border-[var(--line)] bg-[var(--ink)] text-[var(--silver)] hover:border-[var(--silver)] hover:text-[var(--silver-light)]"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
