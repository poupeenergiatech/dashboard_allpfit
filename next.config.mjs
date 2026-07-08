/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera .next/standalone — imagem Docker final não precisa do node_modules inteiro.
  output: 'standalone',
};

export default nextConfig;
