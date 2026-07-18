"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DAY_LABELS,
  emptyWeekSchedule,
  type DayScheduleInput,
} from "@/lib/validations/availability";

type AvailabilityRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type ExceptionRow = {
  id: string;
  date: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  note: string | null;
};

type BarberWithSchedule = {
  id: string;
  name: string;
  specialty: string;
  availabilities: AvailabilityRow[];
  exceptions: ExceptionRow[];
};

type AdminScheduleEditorProps = {
  barbers: BarberWithSchedule[];
};

function toWeekDays(availabilities: AvailabilityRow[]): DayScheduleInput[] {
  const base = emptyWeekSchedule().map((day) => ({
    ...day,
    enabled: false,
    startTime: "09:00",
    endTime: "19:00",
    breakStart: "",
    breakEnd: "",
  }));

  for (const row of availabilities) {
    base[row.dayOfWeek] = {
      dayOfWeek: row.dayOfWeek,
      enabled: true,
      startTime: row.startTime,
      endTime: row.endTime,
      breakStart: row.breakStart ?? "",
      breakEnd: row.breakEnd ?? "",
    };
  }

  return base;
}

export function AdminScheduleEditor({ barbers: initialBarbers }: AdminScheduleEditorProps) {
  const [barbers, setBarbers] = useState(initialBarbers);
  const [selectedId, setSelectedId] = useState(initialBarbers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    isClosed: true,
    startTime: "09:00",
    endTime: "14:00",
    breakStart: "",
    breakEnd: "",
    note: "",
  });

  const selected = useMemo(
    () => barbers.find((barber) => barber.id === selectedId) ?? null,
    [barbers, selectedId]
  );

  const [days, setDays] = useState<DayScheduleInput[]>(() =>
    toWeekDays(initialBarbers[0]?.availabilities ?? [])
  );

  function selectBarber(id: string) {
    const barber = barbers.find((item) => item.id === id);
    if (!barber) return;
    setSelectedId(id);
    setDays(toWeekDays(barber.availabilities));
    setError(null);
    setSuccess(null);
  }

  function updateDay(dayOfWeek: number, patch: Partial<DayScheduleInput>) {
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day
      )
    );
    setSuccess(null);
  }

  function save() {
    if (!selected) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(
        `/api/admin/barbers/${selected.id}/availability`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo guardar");
        return;
      }

      setBarbers((current) =>
        current.map((barber) =>
          barber.id === selected.id
            ? { ...barber, availabilities: payload.availabilities }
            : barber
        )
      );
      setSuccess("Horario guardado. Ya afecta a las reservas nuevas.");
    });
  }

  function addException() {
    if (!selected || !exceptionForm.date) {
      setError("Elige una fecha para la excepción");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(
        `/api/admin/barbers/${selected.id}/exceptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exceptionForm),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo guardar la excepción");
        return;
      }

      setBarbers((current) =>
        current.map((barber) => {
          if (barber.id !== selected.id) return barber;
          const withoutDate = barber.exceptions.filter(
            (item) => item.date !== payload.exception.date
          );
          return {
            ...barber,
            exceptions: [...withoutDate, payload.exception].sort((a, b) =>
              a.date.localeCompare(b.date)
            ),
          };
        })
      );
      setExceptionForm((current) => ({
        ...current,
        date: "",
        note: "",
      }));
      setSuccess("Excepción guardada. Ya afecta a las reservas nuevas.");
    });
  }

  function removeException(exceptionId: string) {
    if (!selected) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(
        `/api/admin/barbers/${selected.id}/exceptions/${exceptionId}`,
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo eliminar");
        return;
      }

      setBarbers((current) =>
        current.map((barber) =>
          barber.id === selected.id
            ? {
                ...barber,
                exceptions: barber.exceptions.filter(
                  (item) => item.id !== exceptionId
                ),
              }
            : barber
        )
      );
      setSuccess("Excepción eliminada.");
    });
  }

  if (barbers.length === 0) {
    return (
      <p className="border border-[var(--line)] bg-[var(--mist)] px-4 py-8 text-center text-[var(--steel)]">
        No hay barberos activos.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {barbers.map((barber) => (
          <button
            key={barber.id}
            type="button"
            onClick={() => selectBarber(barber.id)}
            className={cn(
              "min-h-11 border px-3 py-2 text-sm transition-colors",
              selectedId === barber.id
                ? "border-[var(--silver-light)] bg-[var(--silver-light)] text-[var(--ink)]"
                : "border-[var(--line)] text-[var(--silver)] hover:border-[var(--silver)]"
            )}
          >
            {barber.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-4">
          <header>
            <h2 className="font-display text-2xl font-bold tracking-wide text-[var(--silver-light)]">
              {selected.name}
            </h2>
            <p className="text-sm text-[var(--steel)]">{selected.specialty}</p>
          </header>

          <ul className="space-y-3">
            {days.map((day) => (
              <li
                key={day.dayOfWeek}
                className="border border-[var(--line)] bg-[var(--mist)] px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <label className="flex items-center gap-3 text-[var(--silver-light)]">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { enabled: event.target.checked })
                      }
                      className="size-4 accent-[var(--silver-light)]"
                    />
                    <span className="min-w-28 font-medium">
                      {DAY_LABELS[day.dayOfWeek]}
                    </span>
                  </label>

                  <div
                    className={cn(
                      "grid grid-cols-2 gap-2 sm:grid-cols-4",
                      !day.enabled && "pointer-events-none opacity-40"
                    )}
                  >
                    <Field
                      label="Inicio"
                      value={day.startTime || ""}
                      onChange={(value) => updateDay(day.dayOfWeek, { startTime: value })}
                    />
                    <Field
                      label="Fin"
                      value={day.endTime || ""}
                      onChange={(value) => updateDay(day.dayOfWeek, { endTime: value })}
                    />
                    <Field
                      label="Pausa desde"
                      value={day.breakStart || ""}
                      onChange={(value) => updateDay(day.dayOfWeek, { breakStart: value })}
                    />
                    <Field
                      label="Pausa hasta"
                      value={day.breakEnd || ""}
                      onChange={(value) => updateDay(day.dayOfWeek, { breakEnd: value })}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-400" role="status">
              {success}
            </p>
          )}

          <Button
            type="button"
            onClick={save}
            disabled={isPending}
            className="min-h-11 gap-2 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)]"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar horario
          </Button>

          <section className="space-y-4 border-t border-[var(--line)] pt-6">
            <header>
              <h3 className="font-display text-xl font-bold tracking-wide text-[var(--silver-light)]">
                Días libres y excepciones
              </h3>
              <p className="text-sm text-[var(--steel)]">
                Festivos, vacaciones o un horario especial solo para un día.
              </p>
            </header>

            <div className="space-y-3 border border-[var(--line)] bg-[var(--mist)] px-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-[var(--steel)]">
                  <span>Fecha</span>
                  <Input
                    type="date"
                    value={exceptionForm.date}
                    onChange={(event) =>
                      setExceptionForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="bg-[var(--ink)] text-[var(--silver-light)]"
                  />
                </label>
                <label className="space-y-1 text-xs text-[var(--steel)]">
                  <span>Nota (opcional)</span>
                  <Input
                    value={exceptionForm.note}
                    onChange={(event) =>
                      setExceptionForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Vacaciones, festivo…"
                    className="bg-[var(--ink)] text-[var(--silver-light)]"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-[var(--silver-light)]">
                <input
                  type="checkbox"
                  checked={exceptionForm.isClosed}
                  onChange={(event) =>
                    setExceptionForm((current) => ({
                      ...current,
                      isClosed: event.target.checked,
                    }))
                  }
                  className="size-4 accent-[var(--silver-light)]"
                />
                Día libre completo
              </label>

              {!exceptionForm.isClosed && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field
                    label="Inicio"
                    value={exceptionForm.startTime}
                    onChange={(value) =>
                      setExceptionForm((current) => ({
                        ...current,
                        startTime: value,
                      }))
                    }
                  />
                  <Field
                    label="Fin"
                    value={exceptionForm.endTime}
                    onChange={(value) =>
                      setExceptionForm((current) => ({
                        ...current,
                        endTime: value,
                      }))
                    }
                  />
                  <Field
                    label="Pausa desde"
                    value={exceptionForm.breakStart}
                    onChange={(value) =>
                      setExceptionForm((current) => ({
                        ...current,
                        breakStart: value,
                      }))
                    }
                  />
                  <Field
                    label="Pausa hasta"
                    value={exceptionForm.breakEnd}
                    onChange={(value) =>
                      setExceptionForm((current) => ({
                        ...current,
                        breakEnd: value,
                      }))
                    }
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={addException}
                disabled={isPending}
                variant="outline"
                className="min-h-11 gap-2 border-[var(--line)] text-[var(--silver)]"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Añadir excepción
              </Button>
            </div>

            {(selected.exceptions?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--steel)]">
                Sin excepciones próximas.
              </p>
            ) : (
              <ul className="space-y-2">
                {selected.exceptions.map((exception) => (
                  <li
                    key={exception.id}
                    className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--mist)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 text-sm">
                      <p className="font-medium capitalize text-[var(--silver-light)]">
                        {format(new Date(`${exception.date}T12:00:00`), "EEEE d MMMM", {
                          locale: es,
                        })}
                      </p>
                      <p className="text-[var(--steel)]">
                        {exception.isClosed
                          ? "Día libre"
                          : `${exception.startTime} – ${exception.endTime}`}
                        {exception.note ? ` · ${exception.note}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => removeException(exception.id)}
                      className="min-h-10 gap-2 border-[var(--line)] text-[var(--silver)]"
                    >
                      <Trash2 className="size-3.5" />
                      Quitar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs text-[var(--steel)]">
      <span>{label}</span>
      <Input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-[var(--ink)] text-[var(--silver-light)]"
      />
    </label>
  );
}
