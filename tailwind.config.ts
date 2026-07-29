import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Escala neutra realinhada ao handoff de redesign (2026-07-29): os hex
        // exatos de bg/surface/border/text de lá viram os shades slate-50..950
        // usados em TODO o app (cards, textos, bordas, tabelas) em vez de tocar
        // cada arquivo individualmente — a maioria dos componentes já segue o
        // padrão "slate-N claro / slate-M escuro" pro mesmo papel semântico
        // (ex.: muted = slate-500 claro + slate-400 escuro), e por coincidência os
        // hex do handoff pra claro/escuro do mesmo papel são quase idênticos (ex.:
        // muted claro #6b6d7a ~= faint escuro #6b6e7d), então um valor por shade
        // cobre os dois contextos. 300/600/700/950 não têm hex explícito no
        // handoff — interpolados entre os vizinhos que têm.
        slate: {
          50: "#fafafc",
          100: "#eef0f4",
          200: "#e7e7ee",
          300: "#c4c6d2",
          400: "#9698a6",
          500: "#6b6d7a",
          600: "#52545f",
          700: "#3a3c46",
          800: "#242732",
          900: "#17181d",
          950: "#0e0f14",
        },
        // Identidade visual (logo iconalle.png): roxo #7b00ae e laranja #fe6e00.
        // Escala gerada por interpolação RGB em direção a branco/preto a partir do
        // hex exato — brand-600 e accent-500 são os hex de marca, sem arredondar.
        brand: {
          50: "#faf5fc",
          100: "#f2e6f7",
          200: "#dfc2ec",
          300: "#c894dd",
          400: "#ab5ccb",
          500: "#9029bb",
          600: "#7b00ae",
          700: "#6a0096",
          800: "#59007d",
          900: "#450061",
          950: "#310046",
        },
        accent: {
          50: "#fff9f5",
          100: "#fff1e6",
          200: "#ffdcc2",
          300: "#ffc294",
          400: "#fea25c",
          500: "#fe6e00",
          600: "#ef6700",
          700: "#da5f00",
          800: "#b74f00",
          900: "#8e3e00",
          950: "#662c00",
        },
      },
    },
  },
  plugins: [],
};
export default config;
