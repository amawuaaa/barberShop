import type { BarberOption, ServiceOption } from "@/types/booking";

/** Catálogo estático para la demo visual (sin base de datos). */
export const DEMO_SERVICES: ServiceOption[] = [
  { id: "svc-corte", name: "Corte clásico", duration: 30, price: 1800 },
  { id: "svc-barba", name: "Barba", duration: 20, price: 1200 },
  { id: "svc-combo", name: "Corte + Barba", duration: 45, price: 2800 },
  { id: "svc-afeitado", name: "Afeitado tradicional", duration: 35, price: 2200 },
];

export const DEMO_BARBERS: BarberOption[] = [
  {
    id: "barber-marcos",
    name: "Marcos Llanos",
    specialty: "Cortes fade y textura",
  },
  {
    id: "barber-lucas",
    name: "Lucas Herrera",
    specialty: "Barba y afeitado clásico",
  },
  {
    id: "barber-mateo",
    name: "Mateo Ruiz",
    specialty: "Estilo contemporáneo",
  },
];
