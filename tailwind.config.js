/** @type {import('tailwindcss').Config} */

/**
 * CAPA 3 del sistema de diseno.
 *
 * Aqui no hay ni un solo valor hexadecimal: cada color apunta a un token de
 * `src/styles/tokens.css`. La sintaxis `rgb(var(--x) / <alpha-value>)` es lo que
 * mantiene vivos los modificadores de opacidad (`bg-error-50/50`, `border-error-500/30`).
 *
 * Cambiar la marca entera = editar tokens.css. Este archivo no se toca.
 */
const t = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Accion principal */
        primary: {
          50: t('--blue-50'),
          100: t('--blue-100'),
          200: t('--blue-200'),
          300: t('--blue-300'),
          400: t('--blue-400'),
          500: t('--blue-500'),
          600: t('--blue-600'),
          700: t('--blue-700'),
          800: t('--blue-800'),
          900: t('--blue-900'),
          950: t('--blue-950'),
        },

        /* Acento de dinero. Antes este rango era una copia literal de `primary`,
           asi que no existia un color de CTA diferenciado. Ahora es oro. */
        accent: {
          50: t('--gold-50'),
          100: t('--gold-100'),
          200: t('--gold-200'),
          300: t('--gold-300'),
          400: t('--gold-400'),
          500: t('--gold-500'),
          600: t('--gold-600'),
          700: t('--gold-700'),
          800: t('--gold-800'),
          900: t('--gold-900'),
          950: t('--gold-950'),
        },

        /* Semaforo de estado */
        success: {
          50: t('--green-50'),
          100: t('--green-100'),
          200: t('--green-200'),
          300: t('--green-300'),
          400: t('--green-400'),
          500: t('--green-500'),
          600: t('--green-600'),
          700: t('--green-700'),
          800: t('--green-800'),
          900: t('--green-900'),
        },
        warning: {
          50: t('--orange-50'),
          100: t('--orange-100'),
          200: t('--orange-200'),
          300: t('--orange-300'),
          400: t('--orange-400'),
          500: t('--orange-500'),
          600: t('--orange-600'),
          700: t('--orange-700'),
          800: t('--orange-800'),
          900: t('--orange-900'),
        },
        error: {
          50: t('--red-50'),
          100: t('--red-100'),
          200: t('--red-200'),
          300: t('--red-300'),
          400: t('--red-400'),
          500: t('--red-500'),
          600: t('--red-600'),
          700: t('--red-700'),
          800: t('--red-800'),
          900: t('--red-900'),
        },

        /* Neutros calidos */
        cream: {
          50: t('--warm-50'),
          100: t('--warm-100'),
          200: t('--warm-200'),
        },

        /* Tinta. Los tres niveles pasan 4.5:1 sobre lienzo y sobre superficie;
           el `ink-muted` anterior (#9B9489) se quedaba en 2.66:1. */
        ink: {
          DEFAULT: t('--color-text'),
          secondary: t('--color-text-secondary'),
          muted: t('--color-text-muted'),
        },

        /* Bordes: `line` separa (decorativo), `line-strong` delimita un control
           y cumple el 3:1 que exige WCAG 1.4.11 para elementos no textuales. */
        line: {
          DEFAULT: t('--color-border'),
          strong: t('--color-border-strong'),
        },

        surface: t('--color-surface'),
        sunken: t('--color-surface-sunken'),
        canvas: t('--color-bg'),
        rail: {
          DEFAULT: t('--rail-bg'),
          muted: t('--rail-muted'),
        },
        /* Superficie oscura del heroe del dashboard y del carrito de venta. */
        hero: t('--hero-bg'),
        focus: t('--color-ring'),
      },

      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        /* Cifras y datos secundarios (horas, montos de lista, unidades). Las
           cifras grandes de dinero van en `sans` con tabular-nums, no en mono. */
        mono: ['Geist Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        /* Solo para el logotipo. Ningun texto de interfaz usa serif: mezclar
           dos familias en pantallas densas resta legibilidad. */
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },

      fontSize: {
        /* Nada por debajo de 12px, y el cuerpo se queda en 16px para que iOS
           no haga zoom automatico al enfocar un campo. */
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },

      /* Alturas minimas de control: `touch` es el minimo tactil de WCAG 2.5.5 */
      minHeight: {
        control: 'var(--control-md)',
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      height: {
        'control-sm': 'var(--control-sm)',
        control: 'var(--control-md)',
        'control-lg': 'var(--control-lg)',
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-md)',
        '2xl': 'var(--radius-lg)',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },

      /* Breakpoints del checklist: 375 / 768 / 1024 / 1440 */
      screens: {
        xs: '375px',
        '3xl': '1440px',
      },

      transitionDuration: {
        fast: 'var(--duration-fast)',
        DEFAULT: 'var(--duration-base)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
        smooth: 'var(--ease)',
      },

      animation: {
        'fade-in': 'fadeIn var(--duration-slow) var(--ease)',
        'slide-up': 'slideUp var(--duration-slow) var(--ease)',
        'slide-in': 'slideIn var(--duration-slow) var(--ease)',
        'sheet-up': 'sheetUp var(--duration-slow) var(--ease)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
