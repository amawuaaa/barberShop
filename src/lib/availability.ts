import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, Prisma } from "@prisma/client";

const SLOT_INTERVAL_MINUTES = 30;

/** Estados que ocupan el calendario (bloquean slots). */
export const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

type DbClient = Prisma.TransactionClient | typeof prisma;

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
 * `ignoreAppointmentId` permite reprogramar sin que la propia cita bloquee el slot.
 */
export async function getAvailableSlots(
  params: {
    barberId: string;
    date: string;
    serviceId: string;
    ignoreAppointmentId?: string;
  },
  db: DbClient = prisma
): Promise<{ slots: string[]; reason?: string }> {
  const service = await db.service.findFirst({
    where: { id: params.serviceId, active: true },
  });

  if (!service) {
    return { slots: [], reason: "Servicio no encontrado" };
  }

  const day = parseDateOnly(params.date);
  const dayOfWeek = day.getUTCDay();

  const exception = await db.barberException.findUnique({
    where: {
      barberId_date: {
        barberId: params.barberId,
        date: day,
      },
    },
  });

  if (exception?.isClosed) {
    return {
      slots: [],
      reason: exception.note
        ? `No disponible: ${exception.note}`
        : "El barbero no trabaja este día",
    };
  }

  let schedule: {
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
  } | null = null;

  if (exception && !exception.isClosed && exception.startTime && exception.endTime) {
    schedule = {
      startTime: exception.startTime,
      endTime: exception.endTime,
      breakStart: exception.breakStart,
      breakEnd: exception.breakEnd,
    };
  } else {
    const availability = await db.barberAvailability.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: params.barberId,
          dayOfWeek,
        },
      },
    });

    if (availability) {
      schedule = {
        startTime: availability.startTime,
        endTime: availability.endTime,
        breakStart: availability.breakStart,
        breakEnd: availability.breakEnd,
      };
    }
  }

  if (!schedule) {
    return { slots: [], reason: "El barbero no trabaja este día" };
  }

  const candidates = generateCandidateSlots({
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    breakStart: schedule.breakStart,
    breakEnd: schedule.breakEnd,
    serviceDurationMinutes: service.duration,
  });

  const appointments = await db.appointment.findMany({
    where: {
      barberId: params.barberId,
      date: day,
      status: { in: BLOCKING_STATUSES },
      ...(params.ignoreAppointmentId
        ? { NOT: { id: params.ignoreAppointmentId } }
        : {}),
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
 * Comprueba si un slot concreto sigue libre.
 */
export async function assertSlotAvailable(
  params: {
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    ignoreAppointmentId?: string;
  },
  db: DbClient = prisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { slots, reason } = await getAvailableSlots(params, db);

  if (!slots.includes(params.time)) {
    return {
      ok: false,
      error: reason ?? "Ese horario ya no está disponible",
    };
  }

  return { ok: true };
}

export type CreateAppointmentInput = {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  clientId?: string;
};

/**
 * Crea una cita bajo lock por barbero+día para evitar doble reserva concurrente.
 * Complementado con índice único parcial (barberId, date, time) en citas activas.
 */
export async function createAppointmentSafely(input: CreateAppointmentInput) {
  return prisma.$transaction(async (tx) => {
    const [service, barber] = await Promise.all([
      tx.service.findFirst({
        where: { id: input.serviceId, active: true },
      }),
      tx.barber.findFirst({
        where: { id: input.barberId, active: true },
      }),
    ]);

    if (!service) {
      return {
        ok: false as const,
        status: 404 as const,
        error: "Servicio no encontrado",
      };
    }

    if (!barber) {
      return {
        ok: false as const,
        status: 404 as const,
        error: "Barbero no encontrado",
      };
    }

    // Serializa reservas del mismo barbero el mismo día (cubre solapes por duración).
    // Ambos args deben ser int4: pg_advisory_xact_lock(int, int) — no (int, bigint).
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${input.barberId}),
        hashtext(${input.date})
      )
    `;

    const availability = await assertSlotAvailable(
      {
        barberId: input.barberId,
        serviceId: input.serviceId,
        date: input.date,
        time: input.time,
      },
      tx
    );

    if (!availability.ok) {
      return {
        ok: false as const,
        status: 409 as const,
        error: availability.error,
      };
    }

    const appointment = await tx.appointment.create({
      data: {
        clientId: input.clientId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        date: parseDateOnly(input.date),
        time: input.time,
        status: "PENDING",
        barberId: input.barberId,
        serviceId: input.serviceId,
      },
      include: {
        service: true,
        barber: true,
      },
    });

    return { ok: true as const, appointment };
  });
}
