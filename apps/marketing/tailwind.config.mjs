/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        slate: {
          850: '#1e293b',
          950: '#020617',
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.700'),
            a: {
              color: theme('colors.teal.600'),
              '&:hover': {
                color: theme('colors.teal.700'),
              },
            },
            h1: { color: theme('colors.slate.900'), fontWeight: '900' },
            h2: { color: theme('colors.slate.900'), fontWeight: '800' },
            h3: { color: theme('colors.slate.900'), fontWeight: '700' },
            h4: { color: theme('colors.slate.900'), fontWeight: '700' },
            code: { color: theme('colors.teal.600') },
            blockquote: {
              borderLeftColor: theme('colors.teal.500'),
              backgroundColor: theme('colors.teal.50'),
              padding: '1.5rem',
              fontStyle: 'italic',
              borderRadius: '0.75rem',
            },
            img: {
              borderRadius: '1.5rem',
              boxShadow: theme('boxShadow.2xl'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
}
