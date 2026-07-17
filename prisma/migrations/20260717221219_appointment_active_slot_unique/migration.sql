-- Evita dos citas activas con el mismo barbero, día y hora de inicio.
-- Los solapes por duración se serializan con pg_advisory_xact_lock en la app.
CREATE UNIQUE INDEX "Appointment_barber_date_time_active_key"
ON "Appointment" ("barberId", "date", "time")
WHERE "status" IN ('PENDING', 'CONFIRMED');
