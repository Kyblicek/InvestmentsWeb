import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
        serif: ['"Noto Serif"', 'serif'],
      },
      colors: {
        primary: '#1f2937',
        accent: '#c8ab7d',
        muted: '#f5f5f5',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#1f2937',
          accent: '#c8ab7d',
          neutral: '#1f1f1f',
          'base-100': '#ffffff',
          'base-200': '#f7f7f7',
          'base-300': '#e6e6e6',
        },
      },
    ],
  },
};
