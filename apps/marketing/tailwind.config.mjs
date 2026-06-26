/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
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
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.700'),
            lineHeight: '1.85',
            a: {
              color: theme('colors.teal.600'),
              textDecoration: 'underline',
              fontWeight: '600',
              '&:hover': {
                color: theme('colors.teal.700'),
              },
            },
            h1: {
              color: theme('colors.slate.900'),
              fontWeight: '900',
              letterSpacing: '-0.025em',
            },
            h2: {
              color: theme('colors.slate.900'),
              fontWeight: '800',
              letterSpacing: '-0.02em',
              marginTop: '2.5rem',
              marginBottom: '1.25rem',
            },
            h3: {
              color: theme('colors.slate.900'),
              fontWeight: '700',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h4: {
              color: theme('colors.slate.900'),
              fontWeight: '700',
            },
            p: {
              marginTop: '1.75rem',
              marginBottom: '1.75rem',
              fontSize: '1.125rem',
            },
            code: {
              color: theme('colors.teal.600'),
              backgroundColor: theme('colors.teal.50'),
              borderRadius: '0.25rem',
              padding: '0.1em 0.3em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            blockquote: {
              borderLeftColor: theme('colors.teal.500'),
              backgroundColor: theme('colors.teal.50'),
              padding: '1.5rem',
              fontStyle: 'italic',
              borderRadius: '0 0.75rem 0.75rem 0',
              color: theme('colors.slate.700'),
            },
            'blockquote p:first-of-type::before': { content: '""' },
            'blockquote p:last-of-type::after': { content: '""' },
            img: {
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              marginLeft: 'auto',
              marginRight: 'auto',
            },
            strong: {
              color: theme('colors.slate.900'),
              fontWeight: '700',
            },
            li: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'ul > li::marker': {
              color: theme('colors.teal.500'),
            },
            'ol > li::marker': {
              color: theme('colors.teal.600'),
              fontWeight: '700',
            },
            hr: {
              borderColor: theme('colors.slate.200'),
              marginTop: '3rem',
              marginBottom: '3rem',
            },
          },
        },
        xl: {
          css: {
            p: {
              fontSize: '1.15rem',
              lineHeight: '1.85',
            },
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
};
