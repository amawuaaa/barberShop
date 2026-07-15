export type ServiceOption = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type BarberOption = {
  id: string;
  name: string;
  specialty: string;
};

export type BookingStep = 1 | 2 | 3 | 4;

export const BOOKING_STEPS = [
  { id: 1 as const, label: "Servicio" },
  { id: 2 as const, label: "Barbero" },
  { id: 3 as const, label: "Fecha y hora" },
  { id: 4 as const, label: "Tus datos" },
];

/** Horarios disponibles de ejemplo (lun–sáb) */
export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
] as const;

export function formatPrice(cents: number, locale = "es-ES", currency = "EUR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
