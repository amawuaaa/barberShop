import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Limpia datos previos en desarrollo
  await prisma.appointment.deleteMany();
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

  const barbers = await Promise.all([
    prisma.barber.create({
      data: { name: "Marcos Llanos", specialty: "Cortes fade y textura" },
    }),
    prisma.barber.create({
      data: { name: "Lucas Herrera", specialty: "Barba y afeitado clásico" },
    }),
    prisma.barber.create({
      data: { name: "Mateo Ruiz", specialty: "Estilo contemporáneo" },
    }),
  ]);

  console.log(`Seed OK: ${services.length} servicios, ${barbers.length} barberos`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
