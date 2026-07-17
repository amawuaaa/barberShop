"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/types/booking";

export type CatalogService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
};

export type CatalogBarber = {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
};

type AdminCatalogEditorProps = {
  services: CatalogService[];
  barbers: CatalogBarber[];
};

function eurosToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros < 0) return null;
  return Math.round(euros * 100);
}

function centsToEurosInput(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function AdminCatalogEditor({
  services: initialServices,
  barbers: initialBarbers,
}: AdminCatalogEditorProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [barbers, setBarbers] = useState(initialBarbers);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    name: "",
    duration: "30",
    price: "18",
  });
  const [newBarber, setNewBarber] = useState({
    name: "",
    specialty: "",
  });

  function refreshAfterChange() {
    router.refresh();
  }

  function createService() {
    setError(null);
    setSuccess(null);

    const duration = Number(newService.duration);
    const price = eurosToCents(newService.price);

    if (!newService.name.trim() || !Number.isInteger(duration) || price === null) {
      setError("Revisa nombre, duración y precio del servicio");
      return;
    }

    setBusyKey("create-service");
    startTransition(async () => {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newService.name.trim(),
          duration,
          price,
        }),
      });
      const payload = await response.json();
      setBusyKey(null);

      if (!response.ok) {
        setError(payload.error ?? "No se pudo crear el servicio");
        return;
      }

      setServices((current) =>
        [...current, payload.service].sort((a, b) =>
          Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
        )
      );
      setNewService({ name: "", duration: "30", price: "18" });
      setSuccess("Servicio creado");
      refreshAfterChange();
    });
  }

  function updateService(
    id: string,
    patch: Partial<Pick<CatalogService, "name" | "duration" | "price" | "active">>
  ) {
    setError(null);
    setSuccess(null);
    setBusyKey(`service-${id}`);

    startTransition(async () => {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      setBusyKey(null);

      if (!response.ok) {
        setError(payload.error ?? "No se pudo actualizar el servicio");
        return;
      }

      setServices((current) =>
        current
          .map((service) => (service.id === id ? payload.service : service))
          .sort(
            (a, b) =>
              Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
          )
      );
      setSuccess("Servicio actualizado");
      refreshAfterChange();
    });
  }

  function createBarber() {
    setError(null);
    setSuccess(null);

    if (!newBarber.name.trim() || !newBarber.specialty.trim()) {
      setError("Nombre y especialidad del barbero son obligatorios");
      return;
    }

    setBusyKey("create-barber");
    startTransition(async () => {
      const response = await fetch("/api/admin/barbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBarber.name.trim(),
          specialty: newBarber.specialty.trim(),
        }),
      });
      const payload = await response.json();
      setBusyKey(null);

      if (!response.ok) {
        setError(payload.error ?? "No se pudo crear el barbero");
        return;
      }

      setBarbers((current) =>
        [...current, payload.barber].sort((a, b) =>
          Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
        )
      );
      setNewBarber({ name: "", specialty: "" });
      setSuccess(
        "Barbero creado con horario lun–sáb. Ajústalo en la pestaña Horarios."
      );
      refreshAfterChange();
    });
  }

  function updateBarber(
    id: string,
    patch: Partial<Pick<CatalogBarber, "name" | "specialty" | "active">>
  ) {
    setError(null);
    setSuccess(null);
    setBusyKey(`barber-${id}`);

    startTransition(async () => {
      const response = await fetch(`/api/admin/barbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      setBusyKey(null);

      if (!response.ok) {
        setError(payload.error ?? "No se pudo actualizar el barbero");
        return;
      }

      setBarbers((current) =>
        current
          .map((barber) =>
            barber.id === id
              ? {
                  id: payload.barber.id,
                  name: payload.barber.name,
                  specialty: payload.barber.specialty,
                  active: payload.barber.active,
                }
              : barber
          )
          .sort(
            (a, b) =>
              Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
          )
      );
      setSuccess("Barbero actualizado");
      refreshAfterChange();
    });
  }

  return (
    <div className="space-y-10">
      {(error || success) && (
        <div className="space-y-1">
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
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-[var(--silver-light)]">
            Servicios
          </h2>
          <p className="text-sm text-[var(--steel)]">
            Precio en euros. Solo los activos aparecen en la reserva online.
          </p>
        </div>

        <div className="grid gap-3 border border-[var(--line)] bg-[var(--mist)] p-4 sm:grid-cols-[1fr_7rem_7rem_auto]">
          <div className="space-y-1">
            <Label htmlFor="new-service-name">Nombre</Label>
            <Input
              id="new-service-name"
              value={newService.name}
              onChange={(event) =>
                setNewService((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Corte clásico"
              className="bg-[var(--ink)]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-service-duration">Minutos</Label>
            <Input
              id="new-service-duration"
              type="number"
              min={10}
              step={5}
              value={newService.duration}
              onChange={(event) =>
                setNewService((current) => ({
                  ...current,
                  duration: event.target.value,
                }))
              }
              className="bg-[var(--ink)]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-service-price">Precio (€)</Label>
            <Input
              id="new-service-price"
              inputMode="decimal"
              value={newService.price}
              onChange={(event) =>
                setNewService((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              className="bg-[var(--ink)]"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={createService}
              disabled={isPending}
              className="min-h-11 w-full bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)] sm:w-auto"
            >
              {busyKey === "create-service" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4" />
                  Añadir
                </>
              )}
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              busy={busyKey === `service-${service.id}`}
              disabled={isPending}
              onSave={(patch) => updateService(service.id, patch)}
              onToggleActive={() =>
                updateService(service.id, { active: !service.active })
              }
            />
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-[var(--silver-light)]">
            Barberos
          </h2>
          <p className="text-sm text-[var(--steel)]">
            Al crear uno se asigna horario lun–sáb. Los inactivos no salen en
            reservas.
          </p>
        </div>

        <div className="grid gap-3 border border-[var(--line)] bg-[var(--mist)] p-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="new-barber-name">Nombre</Label>
            <Input
              id="new-barber-name"
              value={newBarber.name}
              onChange={(event) =>
                setNewBarber((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Nombre del barbero"
              className="bg-[var(--ink)]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-barber-specialty">Especialidad</Label>
            <Input
              id="new-barber-specialty"
              value={newBarber.specialty}
              onChange={(event) =>
                setNewBarber((current) => ({
                  ...current,
                  specialty: event.target.value,
                }))
              }
              placeholder="Fade, barba…"
              className="bg-[var(--ink)]"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={createBarber}
              disabled={isPending}
              className="min-h-11 w-full bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)] sm:w-auto"
            >
              {busyKey === "create-barber" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4" />
                  Añadir
                </>
              )}
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {barbers.map((barber) => (
            <BarberRow
              key={barber.id}
              barber={barber}
              busy={busyKey === `barber-${barber.id}`}
              disabled={isPending}
              onSave={(patch) => updateBarber(barber.id, patch)}
              onToggleActive={() =>
                updateBarber(barber.id, { active: !barber.active })
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ServiceRow({
  service,
  busy,
  disabled,
  onSave,
  onToggleActive,
}: {
  service: CatalogService;
  busy: boolean;
  disabled: boolean;
  onSave: (
    patch: Partial<Pick<CatalogService, "name" | "duration" | "price">>
  ) => void;
  onToggleActive: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [duration, setDuration] = useState(String(service.duration));
  const [price, setPrice] = useState(centsToEurosInput(service.price));

  const dirty =
    name.trim() !== service.name ||
    Number(duration) !== service.duration ||
    eurosToCents(price) !== service.price;

  return (
    <li
      className={cn(
        "space-y-3 border border-[var(--line)] bg-[var(--mist)] px-4 py-4",
        !service.active && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-[var(--steel)]">
          {service.active ? "Activo" : "Inactivo"} · {formatPrice(service.price)}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onToggleActive}
          className="border-[var(--line)] text-[var(--silver)]"
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : service.active ? (
            "Desactivar"
          ) : (
            "Activar"
          )}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-[var(--ink)]"
          aria-label="Nombre del servicio"
        />
        <Input
          type="number"
          min={10}
          step={5}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="bg-[var(--ink)]"
          aria-label="Duración en minutos"
        />
        <Input
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="bg-[var(--ink)]"
          aria-label="Precio en euros"
        />
        <Button
          type="button"
          disabled={!dirty || disabled}
          onClick={() => {
            const cents = eurosToCents(price);
            const minutes = Number(duration);
            if (cents === null || !Number.isInteger(minutes)) return;
            onSave({
              name: name.trim(),
              duration: minutes,
              price: cents,
            });
          }}
          className="min-h-11 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)] disabled:opacity-40"
        >
          {busy && dirty ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </li>
  );
}

function BarberRow({
  barber,
  busy,
  disabled,
  onSave,
  onToggleActive,
}: {
  barber: CatalogBarber;
  busy: boolean;
  disabled: boolean;
  onSave: (
    patch: Partial<Pick<CatalogBarber, "name" | "specialty">>
  ) => void;
  onToggleActive: () => void;
}) {
  const [name, setName] = useState(barber.name);
  const [specialty, setSpecialty] = useState(barber.specialty);

  const dirty =
    name.trim() !== barber.name || specialty.trim() !== barber.specialty;

  return (
    <li
      className={cn(
        "space-y-3 border border-[var(--line)] bg-[var(--mist)] px-4 py-4",
        !barber.active && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-[var(--steel)]">
          {barber.active ? "Activo" : "Inactivo"}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onToggleActive}
          className="border-[var(--line)] text-[var(--silver)]"
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : barber.active ? (
            "Desactivar"
          ) : (
            "Activar"
          )}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-[var(--ink)]"
          aria-label="Nombre del barbero"
        />
        <Input
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          className="bg-[var(--ink)]"
          aria-label="Especialidad"
        />
        <Button
          type="button"
          disabled={!dirty || disabled}
          onClick={() =>
            onSave({
              name: name.trim(),
              specialty: specialty.trim(),
            })
          }
          className="min-h-11 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)] disabled:opacity-40"
        >
          {busy && dirty ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </li>
  );
}
