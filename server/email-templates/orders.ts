import { emailTemplate } from './base';

interface Order {
    id: string;
    total: string;
    createdAt: Date | null;
    shippingAddress: string | null;
    items?: any[];
}

export function orderCreatedEmail(order: Order, userName: string): string {
    const content = `
    <h2>Pedido Criado com Sucesso</h2>
    <p>Olá ${userName},</p>
    <p>O seu pedido foi criado com sucesso e está a aguardar pagamento.</p>
    
    <div class="info-box">
      <p><strong>Detalhes do Pedido:</strong></p>
      <ul>
        <li><strong>Número do Pedido:</strong> #${order.id}</li>
        <li><strong>Total:</strong> €${order.total}</li>
        <li><strong>Data:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT')}</li>
      </ul>
    </div>
    
    <div class="warning-box">
      <p><strong>⏰ Ação Necessária</strong></p>
      <p>Por favor, complete o pagamento para confirmar o seu pedido.</p>
    </div>
    
    <p>Pode acompanhar o estado do seu pedido na área de cliente.</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '🛒 Pedido #' + order.id + ' Criado');
}

export function orderConfirmedEmail(order: Order, userName: string): string {
    const content = `
    <h2>Pagamento Confirmado! ✅</h2>
    <p>Olá ${userName},</p>
    <p>Boa notícia! O pagamento do seu pedido foi confirmado com sucesso.</p>
    
    <div class="info-box">
      <p><strong>Detalhes do Pedido:</strong></p>
      <ul>
        <li><strong>Número do Pedido:</strong> #${order.id}</li>
        <li><strong>Total Pago:</strong> €${order.total}</li>
        <li><strong>Estado:</strong> Confirmado</li>
      </ul>
    </div>
    
    <p>O seu pedido está agora em preparação e será enviado em breve.</p>
    <p>Receberá um email assim que o pedido for expedido.</p>
    
    <p>Obrigado pela sua confiança!</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '✅ Pedido #' + order.id + ' Confirmado');
}

export function orderShippedEmail(
    order: Order,
    userName: string,
    trackingCode?: string
): string {
    const content = `
    <h2>Pedido Enviado! 📦</h2>
    <p>Olá ${userName},</p>
    <p>O seu pedido foi expedido e está a caminho!</p>
    
    <div class="info-box">
      <p><strong>Detalhes do Envio:</strong></p>
      <ul>
        <li><strong>Número do Pedido:</strong> #${order.id}</li>
        ${trackingCode ? `<li><strong>Código de Rastreio:</strong> ${trackingCode}</li>` : ''}
        <li><strong>Morada de Entrega:</strong> ${order.shippingAddress}</li>
      </ul>
    </div>
    
    ${trackingCode ? `
      <p>Use o código de rastreio acima para acompanhar a sua encomenda.</p>
    ` : ''}
    
    <p>Receberá um email de confirmação assim que a encomenda for entregue.</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '📦 Pedido #' + order.id + ' Enviado');
}

export function orderDeliveredEmail(order: Order, userName: string): string {
    const content = `
    <h2>Pedido Entregue! 🎉</h2>
    <p>Olá ${userName},</p>
    <p>O seu pedido foi entregue com sucesso!</p>
    
    <div class="info-box">
      <p><strong>Detalhes:</strong></p>
      <ul>
        <li><strong>Número do Pedido:</strong> #${order.id}</li>
        <li><strong>Data de Entrega:</strong> ${new Date().toLocaleString('pt-PT')}</li>
      </ul>
    </div>
    
    <p>Esperamos que esteja satisfeito com a sua compra!</p>
    <p>Se tiver alguma questão ou feedback, não hesite em contactar-nos.</p>
    
    <p>Obrigado por escolher a Cara Fillers!</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '🎉 Pedido #' + order.id + ' Entregue');
}

export function orderPendingReminderEmail(order: Order, userName: string): string {
    const content = `
    <h2>Lembrete: Pagamento Pendente</h2>
    <p>Olá ${userName},</p>
    <p>O seu pedido ainda está a aguardar pagamento.</p>
    
    <div class="warning-box">
      <p><strong>⏰ Pedido #${order.id}</strong></p>
      <p>Total: €${order.total}</p>
      <p>Por favor, complete o pagamento para confirmar o seu pedido.</p>
    </div>
    
    <p>Pode aceder aos detalhes do pedido na área de cliente.</p>
    
    <p>Atenciosamente,<br>Equipa Cara Fillers</p>
  `;

    return emailTemplate(content, '⏰ Lembrete: Pedido #' + order.id + ' Pendente');
}
