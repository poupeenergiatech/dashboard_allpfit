function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const SUBJECT = 'Redefinir sua senha — Dashboard Alle Energia'

// Mesma identidade visual do email de credenciais (user-credentials-email-template.ts:
// hero roxo #7b00ae, CTA laranja #fe6e00, fonte Outfit), simplificado pro caso de
// auto-atendimento: um botão só (o link expira em 1h — ver RESET_TOKEN_TTL_MS em
// esqueci-senha/actions.ts) e um aviso de "se não foi você, ignore" no lugar dos boxes
// de credencial (aqui não há senha nenhuma pra mostrar, só um link).
export function buildPasswordResetEmail(params: { to: string; resetUrl: string }): { subject: string; html: string } {
  const email = escapeHtml(params.to)
  const resetUrl = escapeHtml(params.resetUrl)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f2f0f7;font-family:Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f0f7;padding:28px 0 48px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="height:16px;"></td></tr>

        <!-- ─── HERO ─── -->
        <tr>
          <td style="background:#7b00ae;border-radius:24px 24px 0 0;padding:36px 44px 28px;text-align:center;">
            <img src="https://files.catbox.moe/k20020.png" alt="Alle Energia" style="max-width:180px;height:auto;display:block;margin:0 auto;opacity:0.95;">
          </td>
        </tr>

        <tr>
          <td style="background:#7b00ae;border-radius:0 0 24px 24px;padding:32px 44px 40px;text-align:center;">
            <h1 style="font-family:'Outfit',sans-serif;color:#ffffff;font-size:32px;font-weight:900;line-height:1.1;margin:0 0 14px;letter-spacing:-1.5px;">
              Redefinir <span style="color:#fe953b;">senha</span>
            </h1>
            <p style="color:#ffffff;font-size:14px;line-height:1.7;margin:0;font-weight:400;">
              Recebemos um pedido pra redefinir a senha da conta <strong>${email}</strong> no
              <strong>Dashboard Alle Energia</strong>.
            </p>
          </td>
        </tr>

        <tr><td style="height:12px;"></td></tr>

        <!-- ─── CTA ─── -->
        <tr>
          <td style="background:#ffffff;border-radius:24px;padding:44px;box-shadow:0 2px 12px rgba(0,0,0,0.06);text-align:center;">
            <h2 style="font-family:'Outfit',sans-serif;color:#111;font-size:24px;font-weight:900;margin:0 0 10px;letter-spacing:-0.5px;">Escolha sua nova senha</h2>
            <p style="color:#999;font-size:14px;margin:0 0 28px;">Clique no botão abaixo pra continuar. Esse link vale por <strong>1 hora</strong> e só pode ser usado uma vez.</p>

            <a href="${resetUrl}" style="display:inline-block;background:#fe6e00;color:#fff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;text-decoration:none;padding:15px 32px;border-radius:50px;letter-spacing:-0.2px;">
              Redefinir minha senha →
            </a>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td style="background:#f8f6fc;border-radius:14px;padding:18px 22px;border:1px solid #ede8f7;text-align:left;">
                  <p style="color:#777;font-size:13px;line-height:1.6;margin:0;">
                    ⚠️ Se você não pediu essa redefinição, pode ignorar este email com segurança — sua senha
                    atual continua a mesma e nada muda até que o link acima seja usado.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:12px;"></td></tr>

        <!-- ─── FOOTER ─── -->
        <tr>
          <td style="background:#7b00ae;border-radius:20px;padding:36px 44px;border-top:4px solid #fe6e00;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <img src="https://files.catbox.moe/k20020.png" alt="Alle Energia" style="max-width:130px;height:auto;display:block;opacity:0.9;">
                </td>
                <td valign="middle" align="right">
                  <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;line-height:1.6;">
                    Alle Energia<br>
                    <span style="font-weight:400;color:rgba(255,255,255,0.5);">© 2026 · Todos os direitos reservados.</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- LEGAL -->
        <tr>
          <td style="padding:16px 10px;text-align:center;">
            <p style="color:#bbb;font-size:11px;margin:0;">
              E-mail automático — não responda diretamente.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`

  return { subject: SUBJECT, html }
}
