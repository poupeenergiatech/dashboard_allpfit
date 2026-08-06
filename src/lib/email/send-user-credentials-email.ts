import { getSmtpFromAddress, getSmtpTransporter } from './smtp'
import { buildUserCredentialsEmail, type UserCredentialsEmailVariant } from './user-credentials-email-template'

// Dispara o email de credenciais (criação de conta ou redefinição de senha) sem nunca
// bloquear quem chamou: se o SMTP não estiver configurado ou o envio falhar, só loga um
// aviso — a conta já foi criada / a senha já foi trocada no banco antes desse ponto, e a
// tela de sucesso em /usuarios continua mostrando a senha pra copiar/repassar
// manualmente, mesmo fallback de sempre (decisão explícita: não travar a ação por causa
// do email).
export async function sendUserCredentialsEmail(params: {
  to: string
  senha: string
  urlSistema: string
  whatsappUrl: string
  variant: UserCredentialsEmailVariant
}): Promise<void> {
  const transporter = getSmtpTransporter()
  if (!transporter) {
    console.warn('[email] SMTP não configurado (ver SMTP_* em .env.example) — email de credenciais não enviado.')
    return
  }

  const { subject, html } = buildUserCredentialsEmail({
    email: params.to,
    senha: params.senha,
    urlSistema: params.urlSistema,
    whatsappUrl: params.whatsappUrl,
    variant: params.variant,
  })

  try {
    await transporter.sendMail({
      from: getSmtpFromAddress(),
      to: params.to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[email] Falha ao enviar email de credenciais para', params.to, err)
  }
}
