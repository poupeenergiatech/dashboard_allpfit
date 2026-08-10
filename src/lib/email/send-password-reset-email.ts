import { getSmtpFromAddress, getSmtpTransporter } from './smtp'
import { buildPasswordResetEmail } from './password-reset-email-template'

// Mesmo padrão de sendUserCredentialsEmail: nunca lança erro pra quem chama. requestPasswordReset
// (esqueci-senha/actions.ts) sempre redireciona pra "verifique seu email" independente do
// envio dar certo — travar aqui não mudaria a experiência de quem pediu o reset, só
// esconderia atrás de uma exceção um problema que já é só logado no resto do projeto (SMTP,
// S3, agregador).
export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
  const transporter = getSmtpTransporter()
  if (!transporter) {
    console.warn('[email] SMTP não configurado (ver SMTP_* em .env.example) — email de redefinição de senha não enviado.')
    return
  }

  const { subject, html } = buildPasswordResetEmail(params)

  try {
    await transporter.sendMail({
      from: getSmtpFromAddress(),
      to: params.to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[email] Falha ao enviar email de redefinição de senha para', params.to, err)
  }
}
