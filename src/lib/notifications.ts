/**
 * Stubs de integración para notificaciones post-reserva.
 *
 * Cuando configures las API keys, descomenta e implementa
 * las llamadas reales a Resend (email) y Twilio (WhatsApp).
 */

export type NotificationPayload = {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
};

/**
 * Envía confirmación por email vía Resend.
 * Docs: https://resend.com/docs/send-with-nextjs
 *
 * Variables de entorno necesarias:
 * - RESEND_API_KEY
 * - RESEND_FROM_EMAIL (ej. "SIGMABARBER <citas@tudominio.com>")
 */
export async function sendEmailConfirmation(
  payload: NotificationPayload
): Promise<void> {
  // ---------------------------------------------------------------------------
  // INTEGRACIÓN RESEND (email)
  // ---------------------------------------------------------------------------
  // 1. npm install resend
  // 2. import { Resend } from "resend";
  // 3. const resend = new Resend(process.env.RESEND_API_KEY);
  //
  // await resend.emails.send({
  //   from: process.env.RESEND_FROM_EMAIL!,
  //   to: payload.customerEmail,
  //   subject: `Confirmación de cita — ${payload.date} ${payload.time}`,
  //   html: `
  //     <h1>Hola ${payload.customerName}</h1>
  //     <p>Tu cita está registrada:</p>
  //     <ul>
  //       <li>Servicio: ${payload.serviceName}</li>
  //       <li>Barbero: ${payload.barberName}</li>
  //       <li>Fecha: ${payload.date} a las ${payload.time}</li>
  //     </ul>
  //   `,
  // });
  // ---------------------------------------------------------------------------

  console.info(
    `[notifications/email] Stub — cita ${payload.appointmentId} → ${payload.customerEmail}`
  );
}

/**
 * Envía confirmación por WhatsApp vía Twilio API.
 * Docs: https://www.twilio.com/docs/whatsapp/quickstart
 *
 * Variables de entorno necesarias:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (ej. "whatsapp:+14155238886")
 */
export async function sendWhatsAppConfirmation(
  payload: NotificationPayload
): Promise<void> {
  // ---------------------------------------------------------------------------
  // INTEGRACIÓN TWILIO / WHATSAPP
  // ---------------------------------------------------------------------------
  // 1. npm install twilio
  // 2. import twilio from "twilio";
  // 3. const client = twilio(
  //      process.env.TWILIO_ACCOUNT_SID,
  //      process.env.TWILIO_AUTH_TOKEN
  //    );
  //
  // const to = payload.customerPhone.startsWith("whatsapp:")
  //   ? payload.customerPhone
  //   : `whatsapp:${payload.customerPhone}`;
  //
  // await client.messages.create({
  //   from: process.env.TWILIO_WHATSAPP_FROM!,
  //   to,
  //   body: [
  //     `Hola ${payload.customerName},`,
  //     `Tu cita en SIGMABARBER está lista:`,
  //     `${payload.serviceName} con ${payload.barberName}`,
  //     `${payload.date} a las ${payload.time}.`,
  //     `ID: ${payload.appointmentId}`,
  //   ].join("\n"),
  // });
  // ---------------------------------------------------------------------------

  console.info(
    `[notifications/whatsapp] Stub — cita ${payload.appointmentId} → ${payload.customerPhone}`
  );
}
