/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mintlify primary (black) + inversion
        primary: '#0a0a0a',
        'on-primary': '#ffffff',

        // Signature mint accent — reserved for accent CTAs and active states
        mint: {
          DEFAULT: '#00d4a4',
          deep: '#00b48a',
          soft: '#7cebcb',
        },
        // Backward-compatible "brand" scale mapped to the mint accent family
        brand: {
          50: '#e6fbf6',
          100: '#c5f5e9',
          200: '#9cecd8',
          300: '#5fe0c2',
          400: '#22d3ab',
          500: '#00d4a4',
          600: '#00b48a',
          700: '#009374',
          800: '#00745c',
          900: '#005544',
        },

        // Surfaces
        canvas: '#ffffff',
        surface: {
          DEFAULT: '#f7f7f7',
          muted: '#f7f7f7',
          soft: '#fafafa',
          card: '#ffffff',
        },

        // Hairlines / dividers
        hairline: {
          DEFAULT: '#e5e5e5',
          soft: '#ededed',
        },

        // Text ramp (ink → muted)
        ink: {
          DEFAULT: '#0a0a0a',
          muted: '#5a5a5c',
          faint: '#888888',
        },
        charcoal: '#1c1c1e',
        slate: '#3a3a3c',
        steel: '#5a5a5c',
        stone: '#888888',
        muted: '#a8a8aa',

        // Documentation tag blue
        tag: '#3772cf',

        // Semantic (aligned to Mintlify tones)
        safe: '#1ba673',
        warning: '#c37d0d',
        danger: '#d45656',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        // Cards standardize on 12px per the design's disciplined radius scale
        card: '12px',
      },
      letterSpacing: {
        tightest: '-2px',
        tighter: '-1px',
        tight: '-0.5px',
        wideMicro: '0.5px',
      },
      fontSize: {
        micro: ['11px', { lineHeight: '15px' }],
        caption: ['13px', { lineHeight: '18px' }],
      },
    },
  },
  plugins: [],
};
