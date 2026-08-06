export type UserCredentialsEmailVariant = 'created' | 'reset'

// users.email não tem coluna de nome (ver db/migrations/0001_init.sql) — sem cadastro
// de nome próprio no fluxo de criação de usuário, uso a parte antes do "@" como
// saudação amigável (ex.: "joao.silva@x.com" -> "Joao Silva").
export function greetingNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const HERO_COPY: Record<UserCredentialsEmailVariant, { badge: string; paragraph: string }> = {
  created: {
    badge: 'Suas Credenciais',
    paragraph:
      'Suas credenciais de acesso ao <strong>Dashboard Alle Energia</strong> foram criadas com sucesso. Agora você já pode acessar a plataforma.',
  },
  reset: {
    badge: 'Senha Redefinida',
    paragraph:
      'Sua senha de acesso ao <strong>Dashboard Alle Energia</strong> foi redefinida com sucesso. Use os dados abaixo pra entrar na plataforma.',
  },
}

const SUBJECT: Record<UserCredentialsEmailVariant, string> = {
  created: 'Suas credenciais de acesso — Dashboard Alle Energia',
  reset: 'Sua senha foi redefinida — Dashboard Alle Energia',
}

// Adaptado do template de design fornecido (n8n, mesma identidade visual Alle Energia)
// pros dois casos em que uma senha é entregue: criação de conta (usuarios/actions.ts
// createUser) e redefinição de senha (resetUserPassword) — mesmo HTML, só muda o texto
// do topo e o assunto. Pede pra trocar a senha padrão por uma de preferência do
// usuário, sem forçar isso no login (decisão registrada na conversa que pediu este
// email: nenhuma trava nova no fluxo de autenticação).
export function buildUserCredentialsEmail(params: {
  email: string
  senha: string
  urlSistema: string
  whatsappUrl: string
  variant: UserCredentialsEmailVariant
}): { subject: string; html: string } {
  const nome = escapeHtml(greetingNameFromEmail(params.email))
  const email = escapeHtml(params.email)
  const senha = escapeHtml(params.senha)
  const urlSistema = escapeHtml(params.urlSistema)
  const whatsappUrl = escapeHtml(params.whatsappUrl)
  const { badge, paragraph } = HERO_COPY[params.variant]

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT[params.variant]}</title>
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
          <td style="background:#7b00ae;border-radius:0 0 24px 24px;padding:32px 44px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="58%" valign="middle" style="padding-right:24px;">
                  <h1 style="font-family:'Outfit',sans-serif;color:#ffffff;font-size:38px;font-weight:900;line-height:1.1;margin:0 0 14px;letter-spacing:-1.5px;">
                    Olá,<br><span style="color:#fe953b;">${nome}!</span>
                  </h1>
                  <p style="color:#ffffff;font-size:14px;line-height:1.7;margin:0 0 26px;font-weight:400;">
                    ${paragraph}
                  </p>
                  <a href="${urlSistema}" style="display:inline-block;background:#fe6e00;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:50px;letter-spacing:-0.2px;">
                    Acessar o Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:12px;"></td></tr>

        <!-- ─── CREDENCIAIS ─── -->
        <tr>
          <td style="background:#ffffff;border-radius:24px;padding:44px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

            <div style="display:inline-block;background:#7b00ae;border-radius:8px;padding:5px 14px;margin-bottom:16px;">
              <span style="color:#fff;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">🔑 ${badge}</span>
            </div>
            <h2 style="font-family:'Outfit',sans-serif;color:#111;font-size:28px;font-weight:900;margin:0 0 6px;letter-spacing:-1px;">Dados de Acesso</h2>
            <p style="color:#999;font-size:14px;margin:0 0 28px;">Use as informações abaixo para entrar na plataforma — e depois troque essa senha por uma de sua preferência em qualquer momento.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td style="background:#f8f6fc;border-radius:14px;padding:20px 24px;border:1px solid #ede8f7;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="color:#b260b6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">👤 Usuário / E-mail</div>
                        <div style="color:#111;font-size:18px;font-weight:800;letter-spacing:-0.3px;">${email}</div>
                      </td>
                      <td align="right" valign="middle">
                        <div style="background:#7b00ae;border-radius:8px;padding:6px 14px;">
                          <span style="color:#fff;font-size:11px;font-weight:700;">Login</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td style="background:#f8f6fc;border-radius:14px;padding:20px 24px;border:1px solid #ede8f7;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="color:#b260b6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">🔒 Senha</div>
                        <div style="color:#111;font-size:22px;font-weight:900;letter-spacing:3px;font-variant-numeric:tabular-nums;">${senha}</div>
                      </td>
                      <td align="right" valign="middle">
                        <div style="background:#fe6e00;border-radius:8px;padding:6px 14px;">
                          <span style="color:#fff;font-size:11px;font-weight:700;">Senha</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f8f6fc;border-radius:14px;padding:20px 24px;border:1px solid #ede8f7;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="color:#b260b6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">🌐 Link de Acesso</div>
                        <a href="${urlSistema}" style="color:#7b00ae;font-size:15px;font-weight:700;text-decoration:none;">${urlSistema}</a>
                      </td>
                      <td align="right" valign="middle">
                        <a href="${urlSistema}" style="display:inline-block;background:#7b00ae;color:#fff;font-size:11px;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:50px;">Abrir →</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr><td style="height:12px;"></td></tr>

        <!-- ─── SUPORTE ─── -->
        <tr>
          <td style="background:#ffffff;border-radius:24px;padding:44px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="55%" valign="middle" style="padding-right:24px;">
                  <h2 style="font-family:'Outfit',sans-serif;color:#111;font-size:32px;font-weight:900;line-height:1.1;margin:0 0 12px;letter-spacing:-1px;">Ficou alguma <span style="color:#7b00ae;">dúvida?</span></h2>
                  <p style="color:#777;font-size:14px;line-height:1.7;margin:0 0 24px;">Segunda a sexta, das 8h às 18h. Nossa equipe está pronta para te ajudar com o acesso.</p>

                  <div style="margin-bottom:14px;">
                    <div style="color:#b260b6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">E-mail</div>
                    <a href="mailto:suporte@alleenergia.com" style="color:#7b00ae;font-size:14px;font-weight:700;text-decoration:none;">suporte@alleenergia.com</a>
                  </div>
                  <div>
                    <div style="color:#b260b6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">WhatsApp</div>
                    <div style="color:#111;font-size:14px;font-weight:700;">(31) 93618-1441</div>
                    <div style="color:#111;font-size:14px;font-weight:700;">(11) 93620-9323</div>
                  </div>
                </td>
                <td width="45%" valign="middle">
                  <div style="background:#7b00ae;border-radius:20px;padding:28px;text-align:center;">
                    <div style="color:#fe953b;font-size:40px;margin-bottom:12px;">💬</div>
                    <div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:6px;">Suporte rápido</div>
                    <div style="color:rgba(255,255,255,0.65);font-size:13px;line-height:1.5;margin-bottom:18px;">Atendemos via WhatsApp com agilidade.</div>
                    <a href="${whatsappUrl}" style="display:inline-block;background:#fe6e00;color:#fff;font-size:12px;font-weight:800;text-decoration:none;padding:11px 22px;border-radius:50px;">Falar agora →</a>
                  </div>
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

  return { subject: SUBJECT[params.variant], html }
}
