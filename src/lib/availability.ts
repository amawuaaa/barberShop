import { prisma } from "@/lib/prisma";
import type { AppointmentStatus } from "@prisma/client";

const SLOT_INTERVAL_MINUTES = 30;

/** Estados que ocupan el calendario (bloquean slots). */
export const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Genera slots de inicio cada 30 min dentro del horario,
 * respetando pausa y dejando espacio para la duración del servicio.
 */
export function generateCandidateSlots(params: {
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  serviceDurationMinutes: number;
}): string[] {
  const start = timeToMinutes(params.startTime);
  const end = timeToMinutes(params.endTime);
  const breakStart = params.breakStart
    ? timeToMinutes(params.breakStart)
    : null;
  const breakEnd = params.breakEnd ? timeToMinutes(params.breakEnd) : null;
  const duration = params.serviceDurationMinutes;

  const slots: string[] = [];

  for (let t = start; t + duration <= end; t += SLOT_INTERVAL_MINUTES) {
    const slotEnd = t + duration;

    // Solapa con pausa
    if (
      breakStart !== null &&
      breakEnd !== null &&
      t < breakEnd &&
      slotEnd > breakStart
    ) {
      continue;
    }

    slots.push(minutesToTime(t));
  }

  return slots;
}

type BusyBlock = { start: number; end: number };

function buildBusyBlocks(
  appointments: { time: string; service: { duration: number } }[]
): BusyBlock[] {
  return appointments.map((appointment) => {
    const start = timeToMinutes(appointment.time);
    return { start, end: start + appointment.service.duration };
  });
}

function overlaps(aStart: number, aEnd: number, b: BusyBlock): boolean {
  return aStart < b.end && aEnd > b.start;
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * Slots libres para un barbero en una fecha, filtrando solapes con citas activas.
 */
export async function getAvailableSlots(params: {
  barberId: string;
  date: string;
  serviceId: string;
}): Promise<{ slots: string[]; reason?: string }> {
  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, active: true },
  });

  if (!service) {
    return { slots: [], reason: "Servicio no encontrado" };
  }

  const day = parseDateOnly(params.date);
  const dayOfWeek = day.getUTCDay();

  const availability = await prisma.barberAvailability.findUnique({
    where: {
      barberId_dayOfWeek: {
        barberId: params.barberId,
        dayOfWeek,
      },
    },
  });

  if (!availability) {
    return { slots: [], reason: "El barbero no trabaja este día" };
  }

  const candidates = generateCandidateSlots({
    startTime: availability.startTime,
    endTime: availability.endTime,
    breakStart: availability.breakStart,
    breakEnd: availability.breakEnd,
    serviceDurationMinutes: service.duration,
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      barberId: params.barberId,
      date: day,
      status: { in: BLOCKING_STATUSES },
    },
    select: {
      time: true,
      service: { select: { duration: true } },
    },
  });

  const busy = buildBusyBlocks(appointments);
  const now = new Date();
  const isToday =
    params.date ===
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = candidates.filter((slot) => {
    const start = timeToMinutes(slot);
    const end = start + service.duration;

    if (isToday && start <= nowMinutes) {
      return false;
    }

    return !busy.some((block) => overlaps(start, end, block));
  });

  return { slots };
}

/**
 * Comprueba si un slot concreto sigue libre (race-condition al confirmar).
 */
export async function assertSlotAvailable(params: {
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { slots, reason } = await getAvailableSlots(params);

  if (!slots.includes(params.time)) {
    return {
      ok: false,
      error: reason ?? "Ese horario ya no está disponible",
    };
  }

  return { ok: true };
}
