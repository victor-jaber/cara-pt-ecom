export function emailTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Inter, "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #2b0f1b;
      margin: 0;
      padding: 0;
      background-color: #fff5fa;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #f5d0e3;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
    }
    .header {
      background: #EC1D74;
      color: white;
      padding: 28px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background: #fff0f7;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b2140;
      border-top: 1px solid #f5d0e3;
    }
    a {
      color: #EC1D74;
      text-decoration: underline;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #EC1D74;
      color: white !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      margin: 10px 0;
    }
    .info-box {
      background: #fff0f7;
      border-left: 4px solid #EC1D74;
      padding: 15px;
      margin: 15px 0;
      border-radius: 10px;
    }
    .warning-box {
      background: #fff7fb;
      border-left: 4px solid #EC1D74;
      padding: 15px;
      margin: 15px 0;
      border-radius: 10px;
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
      <p style="font-size: 12px; color: #8a2a52;">© ${new Date().getFullYear()} Cara Fillers. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
