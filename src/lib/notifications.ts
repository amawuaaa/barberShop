import { Resend } from "resend";
import twilio from "twilio";

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

export type NotificationResult = {
  channel: "email" | "whatsapp";
  status: "sent" | "skipped" | "failed";
  detail?: string;
};

function formatPhoneForWhatsApp(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;

  const digits = trimmed.replace(/[^\d+]/g, "");
  const withPlus = digits.startsWith("+") ? digits : `+${digits}`;
  return `whatsapp:${withPlus}`;
}

function buildMessageBody(payload: NotificationPayload): string {
  return [
    `Hola ${payload.customerName},`,
    `Tu cita en SIGMABARBER está registrada:`,
    `${payload.serviceName} con ${payload.barberName}`,
    `${payload.date} a las ${payload.time}.`,
    `Ref: ${payload.appointmentId}`,
    `Estado: pendiente de confirmación.`,
  ].join("\n");
}

function buildEmailHtml(payload: NotificationPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #141414; line-height: 1.5;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">Cita registrada</h1>
      <p>Hola <strong>${payload.customerName}</strong>,</p>
      <p>Tu reserva en <strong>SIGMABARBER</strong> quedó guardada:</p>
      <ul>
        <li><strong>Servicio:</strong> ${payload.serviceName}</li>
        <li><strong>Barbero:</strong> ${payload.barberName}</li>
        <li><strong>Fecha:</strong> ${payload.date}</li>
        <li><strong>Hora:</strong> ${payload.time}</li>
        <li><strong>Referencia:</strong> ${payload.appointmentId}</li>
      </ul>
      <p style="color: #555;">Estado actual: pendiente. Te avisaremos si hay cambios.</p>
    </div>
  `;
}

/**
 * Email vía Resend.
 * Vars: RESEND_API_KEY, RESEND_FROM_EMAIL
 * Opcional: NOTIFY_OWNER_EMAIL (copia al dueño)
 */
export async function sendEmailConfirmation(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info(
      `[notifications/email] skipped — faltan RESEND_API_KEY / RESEND_FROM_EMAIL → ${payload.customerEmail}`
    );
    return {
      channel: "email",
      status: "skipped",
      detail: "RESEND_API_KEY o RESEND_FROM_EMAIL no configurados",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const owner = process.env.NOTIFY_OWNER_EMAIL;
    const to = owner
      ? [payload.customerEmail, owner]
      : [payload.customerEmail];

    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Confirmación de cita — ${payload.date} ${payload.time}`,
      html: buildEmailHtml(payload),
      text: buildMessageBody(payload),
    });

    if (error) {
      console.error("[notifications/email]", error);
      return {
        channel: "email",
        status: "failed",
        detail: error.message ?? "Error Resend",
      };
    }

    console.info(
      `[notifications/email] sent → ${payload.customerEmail} (cita ${payload.appointmentId})`
    );
    return { channel: "email", status: "sent" };
  } catch (error) {
    console.error("[notifications/email]", error);
    return {
      channel: "email",
      status: "failed",
      detail: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * WhatsApp vía Twilio.
 * Vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 * Opcional: NOTIFY_OWNER_WHATSAPP
 *
 * Sandbox Twilio: el cliente debe unirse al sandbox antes de recibir mensajes.
 */
export async function sendWhatsAppConfirmation(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.info(
      `[notifications/whatsapp] skipped — faltan vars Twilio → ${payload.customerPhone}`
    );
    return {
      channel: "whatsapp",
      status: "skipped",
      detail:
        "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM no configurados",
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const body = buildMessageBody(payload);
    const to = formatPhoneForWhatsApp(payload.customerPhone);

    await client.messages.create({ from, to, body });

    const ownerWhatsApp = process.env.NOTIFY_OWNER_WHATSAPP;
    if (ownerWhatsApp) {
      await client.messages.create({
        from,
        to: formatPhoneForWhatsApp(ownerWhatsApp),
        body: [
          `Nueva cita SIGMABARBER`,
          `${payload.customerName} — ${payload.customerPhone}`,
          `${payload.serviceName} con ${payload.barberName}`,
          `${payload.date} ${payload.time}`,
          `Ref: ${payload.appointmentId}`,
        ].join("\n"),
      });
    }

    console.info(
      `[notifications/whatsapp] sent → ${to} (cita ${payload.appointmentId})`
    );
    return { channel: "whatsapp", status: "sent" };
  } catch (error) {
    console.error("[notifications/whatsapp]", error);
    return {
      channel: "whatsapp",
      status: "failed",
      detail: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/** Dispara email + WhatsApp sin tumbar la reserva si fallan. */
export async function dispatchAppointmentNotifications(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  const results = await Promise.all([
    sendEmailConfirmation(payload),
    sendWhatsAppConfirmation(payload),
  ]);
  return results;
}
