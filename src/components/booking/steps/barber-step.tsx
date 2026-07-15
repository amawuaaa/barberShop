"use client";

import { cn } from "@/lib/utils";
import type { BarberOption } from "@/types/booking";

type BarberStepProps = {
  barbers: BarberOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function BarberStep({ barbers, selectedId, onSelect }: BarberStepProps) {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-2xl font-bold tracking-[0.06em] text-[var(--silver-light)]">
          Elige tu barbero
        </h3>
        <p className="text-sm text-[var(--silver)]">
          Cada uno tiene su estilo. Tú decides.
        </p>
      </header>

      <ul className="grid gap-3">
        {barbers.map((barber) => {
          const selected = barber.id === selectedId;
          const initials = barber.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2);

          return (
            <li key={barber.id}>
              <button
                type="button"
                onClick={() => onSelect(barber.id)}
                className={cn(
                  "flex w-full items-center gap-4 border px-4 py-4 text-left transition-all duration-300",
                  selected
                    ? "border-[var(--silver)] bg-[#2c3036] shadow-[inset_3px_0_0_0_var(--silver-light)]"
                    : "border-[var(--line)] bg-[var(--ink)] hover:border-[var(--silver)] hover:bg-[#1c1f24]"
                )}
              >
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center font-display text-sm font-bold tracking-wider transition-colors duration-300",
                    selected
                      ? "bg-[var(--silver-light)] text-[var(--ink)]"
                      : "bg-[#2c3036] text-[var(--silver)]"
                  )}
                  aria-hidden
                >
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-[var(--silver-light)]">
                    {barber.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--steel)]">
                    {barber.specialty}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
