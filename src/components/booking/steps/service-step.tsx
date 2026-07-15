"use client";

import { cn } from "@/lib/utils";
import { formatPrice, type ServiceOption } from "@/types/booking";
import { Clock } from "lucide-react";

type ServiceStepProps = {
  services: ServiceOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ServiceStep({ services, selectedId, onSelect }: ServiceStepProps) {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-2xl font-bold tracking-[0.06em] text-[var(--silver-light)]">
          ¿Qué necesitas hoy?
        </h3>
        <p className="text-sm text-[var(--silver)]">
          Elige el servicio para ver duración y precio.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const selected = service.id === selectedId;

          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => onSelect(service.id)}
                className={cn(
                  "group flex w-full flex-col gap-3 border px-4 py-4 text-left transition-all duration-300",
                  selected
                    ? "border-[var(--silver)] bg-[#2c3036] shadow-[inset_3px_0_0_0_var(--silver-light)]"
                    : "border-[var(--line)] bg-[var(--ink)] hover:border-[var(--silver)] hover:bg-[#1c1f24]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[var(--silver-light)]">
                    {service.name}
                  </span>
                  <span className="shrink-0 font-display text-lg font-semibold text-[var(--silver)]">
                    {formatPrice(service.price)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--steel)]">
                  <Clock className="size-3.5" aria-hidden />
                  {service.duration} min
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
