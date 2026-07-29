import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dashboard Alle Energia",
  description: "Dashboard de performance da Alle Energia.",
};

// Roda antes da primeira pintura (via dangerouslySetInnerHTML no <head>) pra
// aplicar a classe "dark" no <html> sem esperar o React hidratar — sem isso,
// quem tem preferência por tema escuro salva veria um flash claro->escuro a
// cada carregamento.
const THEME_INIT_SCRIPT = `
try {
  var stored = localStorage.getItem('allpfit-theme');
  var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
