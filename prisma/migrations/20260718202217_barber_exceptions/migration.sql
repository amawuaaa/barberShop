-- CreateTable
CREATE TABLE "BarberException" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarberException_barberId_idx" ON "BarberException"("barberId");

-- CreateIndex
CREATE INDEX "BarberException_date_idx" ON "BarberException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BarberException_barberId_date_key" ON "BarberException"("barberId", "date");

-- AddForeignKey
ALTER TABLE "BarberException" ADD CONSTRAINT "BarberException_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
