import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '0.875rem',      // 14px
        'sm': '1rem',          // 16px
        'base': '1.125rem',    // 18px ⭐ 기본 크기 상향
        'lg': '1.25rem',       // 20px
        'xl': '1.5rem',        // 24px
        '2xl': '1.75rem',      // 28px
        '3xl': '2rem',         // 32px
        '4xl': '2.5rem',       // 40px
        '5xl': '3rem',         // 48px
      },
      colors: {
        // 브랜드 색상 유지
        'brand-red': '#E50914',
        'brand-dark': '#141414',
        'brand-light-dark': '#2F2F2F',
        'brand-neutral': '#F5F5F1',
        'magic-gold': '#FFD700',
        // 고대비 텍스트 색상 추가 (WCAG AA 기준)
        'text': {
          'primary': '#111827',    // gray-900 (검정에 가까움)
          'secondary': '#374151',  // gray-700 (진한 회색)
          'tertiary': '#6B7280',   // gray-500 (중간 회색)
        },
        'surface': {
          'primary': '#FFFFFF',    // 흰색 배경
          'secondary': '#F9FAFB',  // gray-50 (밝은 회색)
          'tertiary': '#F3F4F6',   // gray-100
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
