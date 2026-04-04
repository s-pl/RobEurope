/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#eff6ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1c1917',
        },
        paper: {
          DEFAULT: '#f8f7f4',
          dark: '#0c0a09',
        },
        competition: {
          DEFAULT: '#ef4444',
          muted: '#fef2f2',
        },
        contrast: '#0c0a09',
      },
    },
  },
  plugins: [],
};
