import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Lun–sáb 09:00–19:00 con pausa 13:00–15:00. Domingo cerrado. */
const WEEKDAY_SCHEDULE = {
  startTime: "09:00",
  endTime: "19:00",
  breakStart: "13:00",
  breakEnd: "15:00",
} as const;

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.barberAvailability.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();

  const services = await Promise.all([
    prisma.service.create({
      data: { name: "Corte clásico", duration: 30, price: 1800 },
    }),
    prisma.service.create({
      data: { name: "Barba", duration: 20, price: 1200 },
    }),
    prisma.service.create({
      data: { name: "Corte + Barba", duration: 45, price: 2800 },
    }),
    prisma.service.create({
      data: { name: "Afeitado tradicional", duration: 35, price: 2200 },
    }),
  ]);

  const barberDefs = [
    { name: "Marcos Llanos", specialty: "Cortes fade y textura" },
    { name: "Lucas Herrera", specialty: "Barba y afeitado clásico" },
    { name: "Mateo Ruiz", specialty: "Estilo contemporáneo" },
  ];

  const barbers = [];
  for (const def of barberDefs) {
    const barber = await prisma.barber.create({ data: def });
    barbers.push(barber);

    // 1–6 = lunes–sábado
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
      await prisma.barberAvailability.create({
        data: {
          barberId: barber.id,
          dayOfWeek,
          ...WEEKDAY_SCHEDULE,
        },
      });
    }
  }

  // Cita de ejemplo (bloquea un slot) para mañana si no es domingo
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  while (tomorrow.getUTCDay() === 0) {
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  }
  tomorrow.setUTCHours(0, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      name: "Cliente ejemplo",
      phone: "+34600000000",
      email: "ejemplo@sigmabarber.test",
      date: tomorrow,
      time: "10:00",
      status: "CONFIRMED",
      barberId: barbers[0].id,
      serviceId: services[0].id,
    },
  });

  console.log(
    `Seed OK: ${services.length} servicios, ${barbers.length} barberos, horarios lun–sáb + 1 cita ejemplo`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
