"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AppointmentView = {
  id: string;
  name: string;
  date: string;
  time: string;
  status: string;
  service: { id: string; name: string; duration: number };
  barber: { id: string; name: string };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

type ManageAppointmentProps = {
  appointmentId: string;
  token: string;
};

export function ManageAppointment({
  appointmentId,
  token,
}: ManageAppointmentProps) {
  const [appointment, setAppointment] = useState<AppointmentView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(
        `/api/appointments/${appointmentId}?t=${encodeURIComponent(token)}`
      );
      const payload = await response.json();

      if (cancelled) return;

      if (!response.ok) {
        setLoadError(payload.error ?? "No se pudo cargar la cita");
        return;
      }

      setAppointment(payload.appointment);
      setDate(payload.appointment.date);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, token]);

  useEffect(() => {
    if (mode !== "reschedule" || !appointment || !date) return;

    const controller = new AbortController();
    setSlotsLoading(true);
    setSlots([]);
    setTime("");

    fetch(
      `/api/availability?barberId=${encodeURIComponent(appointment.barber.id)}&serviceId=${encodeURIComponent(appointment.service.id)}&date=${encodeURIComponent(date)}&ignore=${encodeURIComponent(appointmentId)}&t=${encodeURIComponent(token)}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setActionError(payload.error ?? "No se pudieron cargar horarios");
          return;
        }
        setSlots(payload.slots ?? []);
        setActionError(null);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setActionError("No se pudieron cargar horarios");
      })
      .finally(() => setSlotsLoading(false));

    return () => controller.abort();
  }, [mode, appointment, date, appointmentId, token]);

  function cancel() {
    if (!appointment) return;
    setActionError(null);

    startTransition(async () => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", token }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setActionError(payload.error ?? "No se pudo cancelar");
        return;
      }

      setAppointment(payload.appointment);
      setDoneMessage("Tu cita ha sido cancelada.");
      setMode("view");
    });
  }

  function reschedule() {
    if (!appointment || !date || !time) {
      setActionError("Elige fecha y hora");
      return;
    }
    setActionError(null);

    startTransition(async () => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", token, date, time }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setActionError(payload.error ?? "No se pudo reprogramar");
        return;
      }

      setAppointment(payload.appointment);
      setDoneMessage("Tu cita ha sido reprogramada.");
      setMode("view");
    });
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--silver-light)]">
          Enlace no válido
        </h1>
        <p className="text-[var(--steel)]">{loadError}</p>
        <Button asChild className="bg-[var(--silver-light)] text-[var(--ink)]">
          <Link href="/#reservar">Reservar de nuevo</Link>
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--silver)]" />
      </div>
    );
  }

  const locked =
    appointment.status === "CANCELLED" || appointment.status === "COMPLETED";

  const titleDate = (() => {
    try {
      return format(new Date(`${appointment.date}T12:00:00`), "EEEE d MMMM", {
        locale: es,
      });
    } catch {
      return appointment.date;
    }
  })();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12 sm:px-8">
      <header className="space-y-2 text-center">
        <p className="font-display text-sm tracking-[0.2em] text-[var(--silver)]">
          SIGMABARBER
        </p>
        <h1 className="font-display text-3xl font-bold tracking-wide text-[var(--silver-light)]">
          Tu cita
        </h1>
      </header>

      {doneMessage && (
        <p
          className="flex items-center justify-center gap-2 text-sm text-emerald-400"
          role="status"
        >
          <CheckCircle2 className="size-4" />
          {doneMessage}
        </p>
      )}

      <div className="space-y-2 border border-[var(--line)] bg-[var(--mist)] px-5 py-5">
        <p className="text-lg font-medium text-[var(--silver-light)]">
          {appointment.service.name}
        </p>
        <p className="text-[var(--silver)]">
          Con {appointment.barber.name}
        </p>
        <p className="capitalize text-[var(--silver)]">
          {titleDate} · {appointment.time}
        </p>
        <p className="text-sm text-[var(--steel)]">
          {STATUS_LABEL[appointment.status] ?? appointment.status}
        </p>
      </div>

      {actionError && (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      )}

      {!locked && mode === "view" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => {
              setMode("reschedule");
              setDoneMessage(null);
              setActionError(null);
            }}
            className="min-h-11 flex-1 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)]"
          >
            Reprogramar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={cancel}
            className="min-h-11 flex-1 border-[var(--line)] text-[var(--silver)]"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Cancelar cita"
            )}
          </Button>
        </div>
      )}

      {!locked && mode === "reschedule" && (
        <div className="space-y-4 border border-[var(--line)] bg-[var(--mist)] px-4 py-4">
          <label className="block space-y-1 text-xs text-[var(--steel)]">
            <span>Nueva fecha</span>
            <Input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(event) => setDate(event.target.value)}
              className="bg-[var(--ink)] text-[var(--silver-light)]"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs text-[var(--steel)]">Hora</p>
            {slotsLoading ? (
              <Loader2 className="size-4 animate-spin text-[var(--silver)]" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-[var(--steel)]">
                No hay horarios libres este día.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={cn(
                      "min-h-10 border px-3 text-sm transition-colors",
                      time === slot
                        ? "border-[var(--silver-light)] bg-[var(--silver-light)] text-[var(--ink)]"
                        : "border-[var(--line)] text-[var(--silver)] hover:border-[var(--silver)]"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={isPending || !time}
              onClick={reschedule}
              className="min-h-11 flex-1 bg-[var(--silver-light)] text-[var(--ink)]"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Guardar nuevo horario"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setMode("view")}
              className="min-h-11 border-[var(--line)] text-[var(--silver)]"
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-[var(--steel)]">
        <Link href="/" className="underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
