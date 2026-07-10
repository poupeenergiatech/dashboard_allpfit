# Sprint 1 (S1-08) — build multi-stage aproveitando o output "standalone" do Next.js,
# que copia só o necessário pra rodar em produção (não o node_modules inteiro).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# As variáveis NEXT_PUBLIC_* precisam existir em build time (ficam embutidas no bundle
# do client) — o EasyPanel deve passá-las como build args/env do serviço.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed-admin.mjs ./scripts/seed-admin.mjs
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Roda scripts/migrate.mjs (aplica o schema, idempotente) antes do server.js — ver
# docker-entrypoint.sh. Sem isso, um DATABASE_URL apontando pra um Postgres novo sobe
# o app sem nenhuma tabela criada.
ENTRYPOINT ["./docker-entrypoint.sh"]
