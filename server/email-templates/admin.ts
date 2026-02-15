import { emailTemplate } from "./base";

export function pendingApprovalAdminEmail(params: {
  appUrl: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    profession?: string | null;
    createdAt?: Date | string | null;
  };
}): string {
  const { appUrl, user } = params;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const approvalsUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/admin/aprovacoes` : "";

  const createdAtStr = user.createdAt
    ? new Date(user.createdAt as any).toLocaleString("pt-PT")
    : null;

  const content = `
    <h2>Novo cadastro pendente</h2>
    <p>Um novo utilizador registou-se e está a aguardar aprovação.</p>

    <div class="info-box">
      <p><strong>Dados do utilizador:</strong></p>
      <ul>
        <li><strong>Nome:</strong> ${escapeHtml(fullName) || "(sem nome)"}</li>
        <li><strong>Email:</strong> ${escapeHtml(user.email)}</li>
        ${user.phone ? `<li><strong>Telefone:</strong> ${escapeHtml(user.phone)}</li>` : ""}
        ${user.profession ? `<li><strong>Profissão:</strong> ${escapeHtml(user.profession)}</li>` : ""}
        ${createdAtStr ? `<li><strong>Data:</strong> ${escapeHtml(createdAtStr)}</li>` : ""}
      </ul>
    </div>

    ${approvalsUrl ? `
      <p>
        <a class="button" href="${approvalsUrl}">Abrir Aprovações no Admin</a>
      </p>
    ` : ""}

    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

  return emailTemplate(content, "Novo cadastro pendente");
}

export function contactMessageAdminEmail(params: {
  appUrl: string;
  message: {
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    body: string;
  };
}): string {
  const { appUrl, message } = params;
  const adminUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/admin` : "";

  const content = `
    <h2>Nova mensagem de contacto</h2>
    <p>Recebeu uma nova mensagem através do formulário de contacto do site.</p>

    <div class="info-box">
      <p><strong>Dados:</strong></p>
      <ul>
        <li><strong>Nome:</strong> ${escapeHtml(message.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(message.email)}</li>
        ${message.phone ? `<li><strong>Telefone:</strong> ${escapeHtml(message.phone)}</li>` : ""}
        ${message.subject ? `<li><strong>Assunto:</strong> ${escapeHtml(message.subject)}</li>` : ""}
      </ul>
    </div>

    <div class="warning-box">
      <p><strong>Mensagem:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message.body)}</p>
    </div>

    ${adminUrl ? `
      <p>
        <a class="button" href="${adminUrl}">Abrir Admin</a>
      </p>
    ` : ""}

    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

  return emailTemplate(content, "Nova mensagem de contacto");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
