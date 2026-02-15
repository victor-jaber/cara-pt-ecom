import { emailTemplate } from "./base";
import type { AppLanguage } from "../request-language";

export type AccountStatus = "approved" | "rejected";

export function accountStatusCustomerEmail(params: {
  firstName: string;
  status: AccountStatus;
  language: AppLanguage;
  appUrl?: string;
}): { subject: string; html: string } {
  const name = (params.firstName || "").trim();
  const t = copy[params.language] || copy.pt;

  const base = (params.appUrl || "").trim().replace(/\/$/, "");
  const loginUrl = base ? `${base}/login` : "";
  const contactUrl = base ? `${base}/contacto` : "";

  const variant = params.status === "approved" ? t.approved : t.rejected;

  const content = `
    <h2>${variant.heading}${name ? `, ${escapeHtml(name)}` : ""}</h2>
    <p>${variant.intro}</p>

    <div class="info-box">
      <p><strong>${variant.boxTitle}</strong></p>
      <ul>
        ${variant.lines.map((line) => `<li>${line}</li>`).join("\n")}
      </ul>
    </div>

    ${loginUrl && params.status === "approved" ? `<p><a class="button" href="${loginUrl}">${variant.cta}</a></p>` : ""}

    ${contactUrl ? `<p>${variant.help} <a href="${contactUrl}">${variant.helpLink}</a>.</p>` : `<p>${variant.help}</p>`}

    <p>${variant.signature}</p>
  `;

  return {
    subject: variant.subject,
    html: emailTemplate(content, variant.title),
  };
}

const copy: Record<
  AppLanguage,
  {
    approved: {
      subject: string;
      title: string;
      heading: string;
      intro: string;
      boxTitle: string;
      lines: string[];
      cta: string;
      help: string;
      helpLink: string;
      signature: string;
    };
    rejected: {
      subject: string;
      title: string;
      heading: string;
      intro: string;
      boxTitle: string;
      lines: string[];
      cta: string;
      help: string;
      helpLink: string;
      signature: string;
    };
  }
> = {
  pt: {
    approved: {
      subject: "A sua conta foi aprovada",
      title: "Conta aprovada",
      heading: "Olá",
      intro: "Boas notícias: a sua conta foi aprovada.",
      boxTitle: "Já pode avançar",
      lines: [
        "Já pode iniciar sessão e aceder ao catálogo.",
        "Se tiver alguma dúvida, fale connosco pelo formulário de contacto.",
      ],
      cta: "Iniciar sessão",
      help: "Precisa de ajuda?",
      helpLink: "Contacte-nos",
      signature: "Atenciosamente,<br>Equipa Cara Fillers",
    },
    rejected: {
      subject: "Atualização sobre a sua conta",
      title: "Conta não aprovada",
      heading: "Olá",
      intro:
        "Obrigado pelo seu cadastro. Neste momento, não foi possível aprovar a sua conta.",
      boxTitle: "Próximos passos",
      lines: [
        "Se acredita que isto foi um engano, entre em contacto connosco.",
        "Pode enviar informações adicionais para ajudarmos na validação.",
      ],
      cta: "",
      help: "Se precisar de ajuda,",
      helpLink: "contacte-nos",
      signature: "Atenciosamente,<br>Equipa Cara Fillers",
    },
  },
  en: {
    approved: {
      subject: "Your account has been approved",
      title: "Account approved",
      heading: "Hello",
      intro: "Good news: your account has been approved.",
      boxTitle: "You can proceed",
      lines: [
        "You can now sign in and access the catalog.",
        "If you have any questions, reach out via our contact form.",
      ],
      cta: "Sign in",
      help: "Need help?",
      helpLink: "Contact us",
      signature: "Best regards,<br>Cara Fillers Team",
    },
    rejected: {
      subject: "Update about your account",
      title: "Account not approved",
      heading: "Hello",
      intro: "Thank you for registering. At this time, we could not approve your account.",
      boxTitle: "Next steps",
      lines: [
        "If you believe this is a mistake, please contact us.",
        "You may send additional information to help with validation.",
      ],
      cta: "",
      help: "If you need help,",
      helpLink: "contact us",
      signature: "Best regards,<br>Cara Fillers Team",
    },
  },
  es: {
    approved: {
      subject: "Tu cuenta ha sido aprobada",
      title: "Cuenta aprobada",
      heading: "Hola",
      intro: "Buenas noticias: tu cuenta ha sido aprobada.",
      boxTitle: "Ya puedes continuar",
      lines: [
        "Ya puedes iniciar sesión y acceder al catálogo.",
        "Si tienes alguna duda, contáctanos mediante el formulario de contacto.",
      ],
      cta: "Iniciar sesión",
      help: "¿Necesitas ayuda?",
      helpLink: "Contáctanos",
      signature: "Atentamente,<br>Equipo de Cara Fillers",
    },
    rejected: {
      subject: "Actualización sobre tu cuenta",
      title: "Cuenta no aprobada",
      heading: "Hola",
      intro:
        "Gracias por registrarte. En este momento, no fue posible aprobar tu cuenta.",
      boxTitle: "Próximos pasos",
      lines: [
        "Si crees que es un error, por favor contáctanos.",
        "Puedes enviar información adicional para ayudarnos con la validación.",
      ],
      cta: "",
      help: "Si necesitas ayuda,",
      helpLink: "contáctanos",
      signature: "Atentamente,<br>Equipo de Cara Fillers",
    },
  },
  fr: {
    approved: {
      subject: "Votre compte a été validé",
      title: "Compte validé",
      heading: "Bonjour",
      intro: "Bonne nouvelle : votre compte a été validé.",
      boxTitle: "Vous pouvez continuer",
      lines: [
        "Vous pouvez désormais vous connecter et accéder au catalogue.",
        "Si vous avez des questions, contactez-nous via le formulaire de contact.",
      ],
      cta: "Se connecter",
      help: "Besoin d’aide ?",
      helpLink: "Contactez-nous",
      signature: "Cordialement,<br>L’équipe Cara Fillers",
    },
    rejected: {
      subject: "Mise à jour concernant votre compte",
      title: "Compte non validé",
      heading: "Bonjour",
      intro:
        "Merci pour votre inscription. Pour le moment, nous n’avons pas pu valider votre compte.",
      boxTitle: "Prochaines étapes",
      lines: [
        "Si vous pensez qu’il s’agit d’une erreur, veuillez nous contacter.",
        "Vous pouvez envoyer des informations complémentaires pour faciliter la validation.",
      ],
      cta: "",
      help: "Si vous avez besoin d’aide,",
      helpLink: "contactez-nous",
      signature: "Cordialement,<br>L’équipe Cara Fillers",
    },
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
