export function emailTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #000 0%, #333 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #000;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 0;
    }
    .info-box {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Cara Fillers</strong></p>
      <p>Este é um email automático, por favor não responda.</p>
      <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} Cara Fillers. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
