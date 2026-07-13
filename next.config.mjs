/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera .next/standalone — imagem Docker final não precisa do node_modules inteiro.
  output: 'standalone',
  // Nesta versão do Next, instrumentation.ts (src/instrumentation.ts — liga o
  // scheduler do sync automático diário) só roda com essa flag; não é o padrão ainda.
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
