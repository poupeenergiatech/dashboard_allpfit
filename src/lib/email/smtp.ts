import nodemailer, { type Transporter } from 'nodemailer'

const HOST = process.env.SMTP_HOST
const PORT = process.env.SMTP_PORT
const SECURE = process.env.SMTP_SECURE
const USER = process.env.SMTP_USER
const PASSWORD = process.env.SMTP_PASSWORD

// Singleton via globalThis — mesmo motivo do pool do Postgres (src/lib/db/pool.ts) e do
// client do S3 (src/lib/storage/s3.ts): não recriar a conexão a cada hot-reload em dev.
const globalForSmtp = globalThis as unknown as { smtpTransporter?: Transporter }

// null quando falta configuração — quem chama decide o que fazer (ver
// sendUserCredentialsEmail: só loga um aviso e segue sem bloquear a ação que disparou
// o email, mesmo padrão "funciona sem todo secret configurado" já usado no resto do
// projeto — ver AGREGADOR_API_URL, AWS_* etc. em .env.example).
export function getSmtpTransporter(): Transporter | null {
  if (!HOST || !PORT || !USER || !PASSWORD) return null

  if (!globalForSmtp.smtpTransporter) {
    globalForSmtp.smtpTransporter = nodemailer.createTransport({
      host: HOST,
      port: Number(PORT),
      secure: SECURE !== 'false', // porta 465 da Hostinger exige SSL/TLS — default ligado
      auth: { user: USER, pass: PASSWORD },
    })
  }
  return globalForSmtp.smtpTransporter
}

export function getSmtpFromAddress(): string {
  return `Alle Energia <${USER ?? 'no-reply@alleenergia.com'}>`
}
