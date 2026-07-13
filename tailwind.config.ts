import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
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
