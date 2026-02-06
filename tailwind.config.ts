import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from logo
        poker: {
          brown: {
            DEFAULT: '#5c3d2e',
            dark: '#3d2920',
            light: '#8b5e3c',
          },
          gold: {
            DEFAULT: '#d4a84b',
            dark: '#b8922e',
            light: '#e8c36a',
          },
          red: {
            DEFAULT: '#c41e3a',
            dark: '#9a1830',
            light: '#e63950',
          },
          green: {
            DEFAULT: '#1a5f3c',
            dark: '#0f3d26',
            light: '#2a8f5c',
            felt: '#1e6b44',
          },
          cream: '#f5f0e6',
        },
      },
      backgroundImage: {
        'wood-pattern': 'linear-gradient(135deg, #5c3d2e 0%, #8b5e3c 50%, #5c3d2e 100%)',
        'felt-pattern': 'radial-gradient(ellipse at center, #2a8f5c 0%, #1a5f3c 50%, #0f3d26 100%)',
        'gold-gradient': 'linear-gradient(180deg, #e8c36a 0%, #d4a84b 50%, #b8922e 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(212, 168, 75, 0.39)',
        'gold-glow': '0 0 20px 4px rgba(212, 168, 75, 0.5)',
        'wood': '0 4px 14px 0 rgba(92, 61, 46, 0.5)',
        'logo': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(212, 168, 75, 0.2)',
      },
      dropShadow: {
        'logo': ['0 8px 24px rgba(0, 0, 0, 0.5)', '0 0 40px rgba(212, 168, 75, 0.3)'],
        'text': '0 2px 8px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
