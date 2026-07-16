"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@prisma/client";

type AdminAppointment = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  service: { name: string; duration: number; price: number };
  barber: { name: string };
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

const STATUS_ACTIONS: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

type AdminDashboardProps = {
  appointments: AdminAppointment[];
  initialDate: string;
};

export function AdminDashboard({
  appointments: initialAppointments,
  initialDate,
}: AdminDashboardProps) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const titleDate = useMemo(() => {
    try {
      return format(new Date(`${dateFilter}T12:00:00`), "EEEE d MMMM", {
        locale: es,
      });
    } catch {
      return dateFilter;
    }
  }, [dateFilter]);

  function loadDay(date: string) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/admin/appointments?date=${encodeURIComponent(date)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Error al cargar citas");
        return;
      }

      setAppointments(
        payload.appointments.map(
          (appointment: AdminAppointment & { date: string | Date }) => ({
            ...appointment,
            date:
              typeof appointment.date === "string"
                ? appointment.date.slice(0, 10)
                : format(new Date(appointment.date), "yyyy-MM-dd"),
          })
        )
      );
    });
  }

  function updateStatus(id: string, status: AppointmentStatus) {
    setError(null);
    setUpdatingId(id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      setUpdatingId(null);

      if (!response.ok) {
        setError(payload.error ?? "No se pudo actualizar");
        return;
      }

      setAppointments((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: payload.appointment.status } : item
        )
      );
    });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm tracking-[0.2em] text-[var(--silver)]">
            SIGMABARBER
          </p>
          <h1 className="font-display text-3xl font-bold tracking-wide text-[var(--silver-light)]">
            Citas
          </h1>
          <p className="mt-1 capitalize text-[var(--steel)]">{titleDate}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="date" className="text-xs text-[var(--steel)]">
              Día
            </label>
            <Input
              id="date"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-auto bg-[var(--mist)]"
            />
          </div>
          <Button
            type="button"
            onClick={() => loadDay(dateFilter)}
            disabled={isPending}
            className="min-h-11 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)]"
          >
            {isPending && !updatingId ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Filtrar"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="min-h-11 border-[var(--line)] text-[var(--silver)]"
          >
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {appointments.length === 0 ? (
        <p className="border border-[var(--line)] bg-[var(--mist)] px-4 py-8 text-center text-[var(--steel)]">
          No hay citas para este día.
        </p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="border border-[var(--line)] bg-[var(--mist)] px-4 py-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--silver-light)]">
                    {appointment.time} · {appointment.name}
                  </p>
                  <p className="text-sm text-[var(--silver)]">
                    {appointment.service.name} con {appointment.barber.name}
                  </p>
                  <p className="text-xs text-[var(--steel)]">
                    {appointment.phone} · {appointment.email}
                  </p>
                  <p
                    className={cn(
                      "inline-block pt-1 text-xs font-medium uppercase tracking-wide",
                      appointment.status === "CONFIRMED" && "text-emerald-400",
                      appointment.status === "PENDING" && "text-amber-300",
                      appointment.status === "CANCELLED" && "text-red-400",
                      appointment.status === "COMPLETED" && "text-[var(--silver)]"
                    )}
                  >
                    {STATUS_LABEL[appointment.status]}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={
                        appointment.status === status ? "default" : "outline"
                      }
                      disabled={
                        appointment.status === status ||
                        updatingId === appointment.id
                      }
                      onClick={() => updateStatus(appointment.id, status)}
                      className={cn(
                        "text-xs",
                        appointment.status === status
                          ? "bg-[var(--silver-light)] text-[var(--ink)]"
                          : "border-[var(--line)] text-[var(--silver)]"
                      )}
                    >
                      {updatingId === appointment.id &&
                      appointment.status !== status ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        STATUS_LABEL[status]
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
