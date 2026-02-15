import type { Request } from "express";
import { storage } from "./storage";
import { sendEmail } from "./email";
import { contactMessageAdminEmail, pendingApprovalAdminEmail } from "./email-templates/admin";

export function getAppUrlFromRequest(req: Request): string {
  const env = process.env.APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const origin = req.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  const host = req.get("host")?.trim();
  const proto = req.protocol;
  if (host) return `${proto}://${host}`;

  return "";
}

export async function notifyAdminPendingApproval(params: {
  req: Request;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    profession?: string | null;
    createdAt?: Date | string | null;
  };
}): Promise<boolean> {
  const settings = await storage.getNotificationSettings();
  const to = settings?.notificationEmail?.trim();
  if (!to) {
    console.warn("Admin notification skipped: notificationEmail not configured");
    return false;
  }

  const appUrl = getAppUrlFromRequest(params.req);

  return await sendEmail({
    to,
    subject: "Novo cadastro pendente",
    html: pendingApprovalAdminEmail({ appUrl, user: params.user }),
  });
}

export async function notifyAdminContactMessage(params: {
  req: Request;
  message: {
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    body: string;
  };
}): Promise<boolean> {
  const settings = await storage.getNotificationSettings();
  const to = settings?.notificationEmail?.trim();
  if (!to) {
    console.warn("Admin notification skipped: notificationEmail not configured");
    return false;
  }

  const appUrl = getAppUrlFromRequest(params.req);

  return await sendEmail({
    to,
    subject: "Nova mensagem de contacto",
    html: contactMessageAdminEmail({ appUrl, message: params.message }),
  });
}
