import { emailTemplate } from './base';

export function welcomeEmail(firstName: string): string {
    const content = `
    <h2>Bem-vindo, ${firstName}!</h2>
    <p>Obrigado por se registar na Cara Fillers. A sua conta foi criada com sucesso.</p>
    
    <div class="info-box">
      <p><strong>Próximos passos:</strong></p>
      <ul>
        <li>Explore o nosso catálogo de produtos</li>
        <li>Complete o seu perfil profissional</li>
        <li>Faça o seu primeiro pedido</li>
      </ul>
    </div>
    
    <p>Se tiver alguma dúvida, não hesite em contactar-nos.</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '🎉 Bem-vindo à Cara Fillers');
}

export function loginEmail(firstName: string, ip: string, date: Date): string {
    const content = `
    <h2>Olá, ${firstName}</h2>
    <p>Foi detetado um novo acesso à sua conta.</p>
    
    <div class="info-box">
      <p><strong>Detalhes do acesso:</strong></p>
      <ul>
        <li><strong>Data/Hora:</strong> ${date.toLocaleString('pt-PT')}</li>
        <li><strong>Endereço IP:</strong> ${ip}</li>
      </ul>
    </div>
    
    <p>Se foi você, pode ignorar este email. Se não reconhece este acesso, por favor altere a sua palavra-passe imediatamente.</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '🔐 Novo acesso à sua conta');
}

export function newDeviceEmail(firstName: string, ip: string, userAgent: string): string {
    const content = `
    <h2>Olá, ${firstName}</h2>
    <p>Detetámos um acesso à sua conta a partir de um novo dispositivo.</p>
    
    <div class="warning-box">
      <p><strong>⚠️ Detalhes do novo dispositivo:</strong></p>
      <ul>
        <li><strong>Endereço IP:</strong> ${ip}</li>
        <li><strong>Dispositivo:</strong> ${userAgent}</li>
        <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-PT')}</li>
      </ul>
    </div>
    
    <p>Se foi você, pode ignorar este email. O dispositivo foi adicionado à lista de dispositivos conhecidos.</p>
    
    <p><strong>Se não reconhece este acesso:</strong></p>
    <ul>
      <li>Altere a sua palavra-passe imediatamente</li>
      <li>Contacte-nos se suspeitar de atividade não autorizada</li>
    </ul>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '🚨 Novo dispositivo detetado');
}
