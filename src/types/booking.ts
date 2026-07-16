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

export function formatPrice(cents: number, locale = "es-ES", currency = "EUR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
