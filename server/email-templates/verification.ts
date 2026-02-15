import { emailTemplate } from './base';

export function verificationCodeEmail(code: string, type: 'registration' | 'email_change'): string {
    const title = type === 'registration'
        ? 'Verificação de Email - Novo Registro'
        : 'Verificação de Email - Alteração de Email';

    const message = type === 'registration'
        ? 'Use o código abaixo para completar o seu registro'
        : 'Use o código abaixo para confirmar a alteração do seu email';

    const content = `
    <h2>${title}</h2>
    <p>Olá,</p>
    <p>${message}:</p>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
      <div style="font-size: 48px; font-weight: bold; color: white; letter-spacing: 8px;">
        ${code}
      </div>
    </div>
    
    <div class="warning-box">
      <p><strong>⏰ Código Temporário</strong></p>
      <p>Este código expira em <strong>15 minutos</strong>.</p>
      <p>Se não solicitou este código, ignore este email.</p>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Por razões de segurança, nunca partilhe este código com ninguém.
    </p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, title);
}
