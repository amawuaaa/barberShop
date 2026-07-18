"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Clock3, Loader2, LogOut, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@prisma/client";
import {
  AdminScheduleEditor,
  type ExceptionRow,
} from "@/components/admin/admin-schedule-editor";
import {
  AdminCatalogEditor,
  type CatalogBarber,
  type CatalogService,
} from "@/components/admin/admin-catalog-editor";

type AdminAppointment = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  service: { name: string; duration: number; price: number };
  barber: { id: string; name: string };
};

type BarberWithSchedule = {
  id: string;
  name: string;
  specialty: string;
  availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
  }[];
  exceptions: ExceptionRow[];
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
  barbers: BarberWithSchedule[];
  services: CatalogService[];
  catalogBarbers: CatalogBarber[];
  initialDate: string;
};

type AdminTab = "citas" | "horarios" | "catalogo";
type RangeMode = "day" | "week";

function normalizeAppointments(
  appointments: (AdminAppointment & { date: string | Date })[]
): AdminAppointment[] {
  return appointments.map((appointment) => ({
    ...appointment,
    date:
      typeof appointment.date === "string"
        ? appointment.date.slice(0, 10)
        : format(new Date(appointment.date), "yyyy-MM-dd"),
    barber: {
      id: appointment.barber.id,
      name: appointment.barber.name,
    },
  }));
}

function weekBounds(anchorDate: string): { from: string; to: string } {
  const start = startOfWeek(new Date(`${anchorDate}T12:00:00`), {
    weekStartsOn: 1,
  });
  const end = addDays(start, 6);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
  };
}

export function AdminDashboard({
  appointments: initialAppointments,
  barbers,
  services,
  catalogBarbers,
  initialDate,
}: AdminDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("citas");
  const [rangeMode, setRangeMode] = useState<RangeMode>("day");
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [barberFilter, setBarberFilter] = useState("");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const week = useMemo(() => weekBounds(dateFilter), [dateFilter]);

  const titleDate = useMemo(() => {
    try {
      if (rangeMode === "week") {
        const fromLabel = format(new Date(`${week.from}T12:00:00`), "d MMM", {
          locale: es,
        });
        const toLabel = format(new Date(`${week.to}T12:00:00`), "d MMM", {
          locale: es,
        });
        return `${fromLabel} – ${toLabel}`;
      }
      return format(new Date(`${dateFilter}T12:00:00`), "EEEE d MMMM", {
        locale: es,
      });
    } catch {
      return dateFilter;
    }
  }, [dateFilter, rangeMode, week]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, AdminAppointment[]>();
    for (const appointment of appointments) {
      const list = map.get(appointment.date) ?? [];
      list.push(appointment);
      map.set(appointment.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments]);

  function loadAppointments(options?: {
    mode?: RangeMode;
    date?: string;
    barberId?: string;
  }) {
    const mode = options?.mode ?? rangeMode;
    const date = options?.date ?? dateFilter;
    const barberId = options?.barberId ?? barberFilter;

    setError(null);
    startTransition(async () => {
      const params = new URLSearchParams();
      if (mode === "week") {
        const bounds = weekBounds(date);
        params.set("from", bounds.from);
        params.set("to", bounds.to);
      } else {
        params.set("date", date);
      }
      if (barberId) params.set("barberId", barberId);

      const response = await fetch(`/api/admin/appointments?${params}`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Error al cargar citas");
        return;
      }

      setAppointments(normalizeAppointments(payload.appointments));
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
            Panel
          </h1>
          <p className="mt-1 text-[var(--steel)]">
            {tab === "citas" && <span className="capitalize">{titleDate}</span>}
            {tab === "horarios" && "Horarios, días libres y excepciones"}
            {tab === "catalogo" && "Servicios y barberos"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={logout}
          className="min-h-11 border-[var(--line)] text-[var(--silver)]"
        >
          <LogOut className="size-4" />
          Salir
        </Button>
      </header>

      <nav className="flex gap-2 border-b border-[var(--line)] pb-3">
        <TabButton
          active={tab === "citas"}
          onClick={() => setTab("citas")}
          icon={<CalendarDays className="size-4" />}
          label="Citas"
        />
        <TabButton
          active={tab === "horarios"}
          onClick={() => setTab("horarios")}
          icon={<Clock3 className="size-4" />}
          label="Horarios"
        />
        <TabButton
          active={tab === "catalogo"}
          onClick={() => setTab("catalogo")}
          icon={<Scissors className="size-4" />}
          label="Catálogo"
        />
      </nav>

      {tab === "citas" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={rangeMode === "day" ? "default" : "outline"}
                onClick={() => {
                  setRangeMode("day");
                  loadAppointments({ mode: "day" });
                }}
                className={cn(
                  "min-h-10",
                  rangeMode === "day"
                    ? "bg-[var(--silver-light)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--silver)]"
                )}
              >
                Día
              </Button>
              <Button
                type="button"
                size="sm"
                variant={rangeMode === "week" ? "default" : "outline"}
                onClick={() => {
                  setRangeMode("week");
                  loadAppointments({ mode: "week" });
                }}
                className={cn(
                  "min-h-10",
                  rangeMode === "week"
                    ? "bg-[var(--silver-light)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--silver)]"
                )}
              >
                Semana
              </Button>
            </div>

            <div className="space-y-1">
              <label htmlFor="date" className="text-xs text-[var(--steel)]">
                {rangeMode === "week" ? "Semana del" : "Día"}
              </label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-auto bg-[var(--mist)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="barber" className="text-xs text-[var(--steel)]">
                Barbero
              </label>
              <select
                id="barber"
                value={barberFilter}
                onChange={(event) => setBarberFilter(event.target.value)}
                className="flex h-9 min-w-40 rounded-lg border border-[var(--line)] bg-[var(--mist)] px-3 text-sm text-[var(--silver-light)]"
              >
                <option value="">Todos</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              onClick={() => loadAppointments()}
              disabled={isPending}
              className="min-h-11 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)]"
            >
              {isPending && !updatingId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Filtrar"
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {appointments.length === 0 ? (
            <p className="border border-[var(--line)] bg-[var(--mist)] px-4 py-8 text-center text-[var(--steel)]">
              No hay citas en este periodo.
            </p>
          ) : rangeMode === "week" ? (
            <div className="space-y-6">
              {groupedByDay.map(([day, dayAppointments]) => (
                <section key={day} className="space-y-3">
                  <h2 className="font-display text-lg font-bold capitalize tracking-wide text-[var(--silver-light)]">
                    {format(new Date(`${day}T12:00:00`), "EEEE d MMMM", {
                      locale: es,
                    })}
                  </h2>
                  <AppointmentList
                    appointments={dayAppointments}
                    updatingId={updatingId}
                    onUpdateStatus={updateStatus}
                  />
                </section>
              ))}
            </div>
          ) : (
            <AppointmentList
              appointments={appointments}
              updatingId={updatingId}
              onUpdateStatus={updateStatus}
            />
          )}
        </div>
      )}

      {tab === "horarios" && (
        <AdminScheduleEditor
          key={barbers.map((barber) => barber.id).join("-")}
          barbers={barbers}
        />
      )}

      {tab === "catalogo" && (
        <AdminCatalogEditor services={services} barbers={catalogBarbers} />
      )}
    </div>
  );
}

function AppointmentList({
  appointments,
  updatingId,
  onUpdateStatus,
}: {
  appointments: AdminAppointment[];
  updatingId: string | null;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}) {
  return (
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
                  onClick={() => onUpdateStatus(appointment.id, status)}
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
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
        active
          ? "border-[var(--silver-light)] text-[var(--silver-light)]"
          : "border-transparent text-[var(--steel)] hover:text-[var(--silver)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
