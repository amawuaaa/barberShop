import { Resend } from "resend";
import twilio from "twilio";
import { buildAppointmentManageUrl } from "@/lib/appointment-token";

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

export type StatusNotificationPayload = NotificationPayload & {
  status: "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED";
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

function manageFooter(appointmentId: string): string {
  const url = buildAppointmentManageUrl(appointmentId);
  if (!url) return "";
  return `\nGestiona tu cita: ${url}`;
}

function statusLabel(
  status: StatusNotificationPayload["status"]
): string {
  switch (status) {
    case "CONFIRMED":
      return "confirmada";
    case "CANCELLED":
      return "cancelada";
    case "RESCHEDULED":
      return "reprogramada";
    case "COMPLETED":
      return "completada";
  }
}

function buildMessageBody(payload: NotificationPayload): string {
  return [
    `Hola ${payload.customerName},`,
    `Tu cita en SIGMABARBER está registrada:`,
    `${payload.serviceName} con ${payload.barberName}`,
    `${payload.date} a las ${payload.time}.`,
    `Ref: ${payload.appointmentId}`,
    `Estado: pendiente de confirmación.`,
    manageFooter(payload.appointmentId).trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStatusMessageBody(payload: StatusNotificationPayload): string {
  const label = statusLabel(payload.status);
  const lines = [
    `Hola ${payload.customerName},`,
    `Tu cita en SIGMABARBER está ${label}:`,
    `${payload.serviceName} con ${payload.barberName}`,
    `${payload.date} a las ${payload.time}.`,
    `Ref: ${payload.appointmentId}`,
  ];

  if (payload.status !== "CANCELLED" && payload.status !== "COMPLETED") {
    const footer = manageFooter(payload.appointmentId).trim();
    if (footer) lines.push(footer);
  }

  return lines.join("\n");
}

function buildEmailHtml(
  payload: NotificationPayload,
  options?: { title?: string; statusLine?: string }
): string {
  const manageUrl = buildAppointmentManageUrl(payload.appointmentId);
  const manageBlock = manageUrl
    ? `<p style="margin-top: 20px;"><a href="${manageUrl}" style="color: #141414;">Cancelar o reprogramar</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; color: #141414; line-height: 1.5;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">${options?.title ?? "Cita registrada"}</h1>
      <p>Hola <strong>${payload.customerName}</strong>,</p>
      <p>${options?.statusLine ?? "Tu reserva en <strong>SIGMABARBER</strong> quedó guardada:"}</p>
      <ul>
        <li><strong>Servicio:</strong> ${payload.serviceName}</li>
        <li><strong>Barbero:</strong> ${payload.barberName}</li>
        <li><strong>Fecha:</strong> ${payload.date}</li>
        <li><strong>Hora:</strong> ${payload.time}</li>
        <li><strong>Referencia:</strong> ${payload.appointmentId}</li>
      </ul>
      ${manageBlock}
    </div>
  `;
}

async function sendEmail(
  payload: NotificationPayload,
  options: { subject: string; text: string; html: string }
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
      subject: options.subject,
      html: options.html,
      text: options.text,
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

async function sendWhatsApp(
  payload: NotificationPayload,
  body: string,
  ownerPrefix = "Nueva cita SIGMABARBER"
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
    const to = formatPhoneForWhatsApp(payload.customerPhone);

    await client.messages.create({ from, to, body });

    const ownerWhatsApp = process.env.NOTIFY_OWNER_WHATSAPP;
    if (ownerWhatsApp) {
      await client.messages.create({
        from,
        to: formatPhoneForWhatsApp(ownerWhatsApp),
        body: [
          ownerPrefix,
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

/**
 * Email vía Resend.
 * Vars: RESEND_API_KEY, RESEND_FROM_EMAIL
 * Opcional: NOTIFY_OWNER_EMAIL (copia al dueño)
 */
export async function sendEmailConfirmation(
  payload: NotificationPayload
): Promise<NotificationResult> {
  return sendEmail(payload, {
    subject: `Confirmación de cita — ${payload.date} ${payload.time}`,
    text: buildMessageBody(payload),
    html: buildEmailHtml(payload, {
      statusLine:
        "Tu reserva en <strong>SIGMABARBER</strong> quedó guardada:",
    }),
  });
}

/**
 * WhatsApp vía Twilio.
 * Vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 * Opcional: NOTIFY_OWNER_WHATSAPP
 */
export async function sendWhatsAppConfirmation(
  payload: NotificationPayload
): Promise<NotificationResult> {
  return sendWhatsApp(payload, buildMessageBody(payload));
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

/** Aviso al cambiar estado (admin o cliente). */
export async function dispatchStatusChangeNotifications(
  payload: StatusNotificationPayload
): Promise<NotificationResult[]> {
  const label = statusLabel(payload.status);
  const text = buildStatusMessageBody(payload);
  const title =
    payload.status === "RESCHEDULED"
      ? "Cita reprogramada"
      : `Cita ${label}`;

  const html = buildEmailHtml(payload, {
    title,
    statusLine: `Tu reserva en <strong>SIGMABARBER</strong> está <strong>${label}</strong>:`,
  });

  const results = await Promise.all([
    sendEmail(payload, {
      subject: `${title} — ${payload.date} ${payload.time}`,
      text,
      html,
    }),
    sendWhatsApp(
      payload,
      text,
      `Cita ${label} — SIGMABARBER`
    ),
  ]);
  return results;
}

function buildReminderMessageBody(payload: NotificationPayload): string {
  return [
    `Hola ${payload.customerName},`,
    `Recordatorio: mañana tienes cita en SIGMABARBER.`,
    `${payload.serviceName} con ${payload.barberName}`,
    `${payload.date} a las ${payload.time}.`,
    `Ref: ${payload.appointmentId}`,
    manageFooter(payload.appointmentId).trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Recordatorio ~24h antes de la cita. */
export async function dispatchReminderNotifications(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  const text = buildReminderMessageBody(payload);
  const html = buildEmailHtml(payload, {
    title: "Recordatorio de cita",
    statusLine:
      "Te recordamos tu reserva en <strong>SIGMABARBER</strong>:",
  });

  return Promise.all([
    sendEmail(payload, {
      subject: `Recordatorio — ${payload.date} ${payload.time}`,
      text,
      html,
    }),
    sendWhatsApp(payload, text, "Recordatorio cita — SIGMABARBER"),
  ]);
}
