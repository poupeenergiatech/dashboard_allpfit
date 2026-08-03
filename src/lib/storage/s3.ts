import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const REGION = process.env.AWS_REGION
const BUCKET = process.env.AWS_S3_BUCKET_NOTAS_FISCAIS

// Singleton via globalThis — mesmo motivo do pool do Postgres (src/lib/db/pool.ts):
// não recriar o client a cada hot-reload em dev.
const globalForS3 = globalThis as unknown as { s3Client?: S3Client }
const s3 = globalForS3.s3Client ?? new S3Client({ region: REGION })
if (process.env.NODE_ENV !== 'production') globalForS3.s3Client = s3

function requireBucket(): string {
  if (!BUCKET) {
    throw new Error('AWS_S3_BUCKET_NOTAS_FISCAIS não configurado — veja .env.example.')
  }
  return BUCKET
}

// Bucket público (decisão registrada na conversa que criou notas_fiscais): a URL
// devolvida aqui já é a URL final de leitura, sem link assinado. Sem `ACL:
// public-read` de propósito — buckets novos da AWS vêm com "Object Ownership:
// Bucket owner enforced", que desliga ACL de objeto; a leitura pública precisa
// vir de uma bucket policy configurada no console (ver .env.example), não daqui.
export async function uploadNotaFiscalPdf(key: string, buffer: Buffer): Promise<string> {
  const bucket = requireBucket()
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  )
  return `https://${bucket}.s3.${REGION}.amazonaws.com/${key}`
}

export async function deleteNotaFiscalPdf(key: string): Promise<void> {
  const bucket = requireBucket()
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// Extrai o key S3 de volta de uma URL pública gerada por uploadNotaFiscalPdf —
// usado pra apagar o objeto antigo ao substituir ou excluir uma nota fiscal.
export function keyFromNotaFiscalUrl(url: string): string {
  return new URL(url).pathname.replace(/^\//, '')
}
