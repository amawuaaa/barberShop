"use client";

import { BOOKING_STEPS, type BookingStep } from "@/types/booking";
import { cn } from "@/lib/utils";

type BookingProgressProps = {
  currentStep: BookingStep;
};

export function BookingProgress({ currentStep }: BookingProgressProps) {
  return (
    <ol
      className="flex items-center justify-between gap-1 sm:gap-3"
      aria-label="Progreso de reserva"
    >
      {BOOKING_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
            <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center text-xs font-semibold transition-colors duration-300",
                  isDone && "bg-[var(--silver)] text-[var(--ink)]",
                  isActive && "bg-[var(--silver-light)] text-[var(--ink)]",
                  !isDone &&
                    !isActive &&
                    "border border-[var(--line)] bg-transparent text-[var(--steel)]"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  "max-w-[4.5rem] truncate text-center text-[10px] leading-tight sm:max-w-none sm:text-left sm:text-xs md:text-sm transition-colors duration-300",
                  isActive
                    ? "font-medium text-[var(--silver-light)]"
                    : "text-[var(--steel)]"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 hidden h-px min-w-2 flex-1 sm:mb-0 sm:block transition-colors duration-500",
                  isDone ? "bg-[var(--silver)]" : "bg-[var(--line)]"
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
