"use client";

import { es } from "date-fns/locale";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { TIME_SLOTS } from "@/types/booking";

type DateTimeStepProps = {
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
};

export function DateTimeStep({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: DateTimeStepProps) {
  const selected = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : undefined;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-xl font-bold tracking-[0.06em] text-[var(--silver-light)] sm:text-2xl">
          Fecha y hora
        </h3>
        <p className="text-sm text-[var(--silver)]">
          Elige un día y un hueco disponible.
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

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const active = slot === selectedTime;
              const disabled = !selectedDate;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectTime(slot)}
                  className={cn(
                    "min-h-11 border px-2 py-2.5 text-sm transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-40",
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
