import { emailTemplate } from "./base";
import type { AppLanguage } from "../request-language";

export function pendingApprovalCustomerEmail(params: {
  firstName: string;
  language: AppLanguage;
}): { subject: string; html: string } {
  const name = (params.firstName || "").trim() || "";
  const t = copy[params.language] || copy.pt;

  const content = `
    <h2>${t.heading}${name ? `, ${escapeHtml(name)}` : ""}</h2>
    <p>${t.intro}</p>

    <div class="info-box">
      <p><strong>${t.boxTitle}</strong></p>
      <ul>
        <li>${t.line1}</li>
        <li>${t.line2}</li>
      </ul>
    </div>

    <p>${t.outro}</p>

    <p>${t.signature}</p>
  `;

  return {
    subject: t.subject,
    html: emailTemplate(content, t.title),
  };
}

const copy: Record<
  AppLanguage,
  {
    subject: string;
    title: string;
    heading: string;
    intro: string;
    boxTitle: string;
    line1: string;
    line2: string;
    outro: string;
    signature: string;
  }
> = {
  pt: {
    subject: "A sua conta está em análise",
    title: "Conta em aprovação",
    heading: "Olá",
    intro:
      "Recebemos o seu cadastro e a sua conta está pendente para aprovação.",
    boxTitle: "O que acontece agora?",
    line1: "A nossa equipa irá validar os seus dados profissionais.",
    line2: "Em média, a resposta da aprovação é emitida em até 48 horas úteis.",
    outro:
      "Assim que a sua conta for aprovada, poderá aceder ao catálogo e realizar pedidos.",
    signature: "Atenciosamente,<br>Equipa Cara Fillers",
  },
  en: {
    subject: "Your account is under review",
    title: "Account approval",
    heading: "Hello",
    intro: "We received your registration and your account is pending approval.",
    boxTitle: "What happens next?",
    line1: "Our team will review your professional details.",
    line2: "On average, approval is issued within up to 48 business hours.",
    outro:
      "Once your account is approved, you will be able to access the catalog and place orders.",
    signature: "Best regards,<br>Cara Fillers Team",
  },
  es: {
    subject: "Tu cuenta está en revisión",
    title: "Aprobación de cuenta",
    heading: "Hola",
    intro:
      "Hemos recibido tu registro y tu cuenta está pendiente de aprobación.",
    boxTitle: "¿Qué pasa ahora?",
    line1: "Nuestro equipo revisará tus datos profesionales.",
    line2: "En promedio, la aprobación se emite en hasta 48 horas hábiles.",
    outro:
      "Una vez aprobada tu cuenta, podrás acceder al catálogo y realizar pedidos.",
    signature: "Atentamente,<br>Equipo de Cara Fillers",
  },
  fr: {
    subject: "Votre compte est en cours de validation",
    title: "Validation du compte",
    heading: "Bonjour",
    intro:
      "Nous avons bien reçu votre inscription et votre compte est en attente de validation.",
    boxTitle: "Et maintenant ?",
    line1: "Notre équipe va vérifier vos informations professionnelles.",
    line2: "En moyenne, la validation est effectuée sous 48 heures ouvrées.",
    outro:
      "Une fois votre compte validé, vous pourrez accéder au catalogue et passer des commandes.",
    signature: "Cordialement,<br>L’équipe Cara Fillers",
  },
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
