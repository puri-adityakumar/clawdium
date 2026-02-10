import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/**/*.tsx'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        sand: '#f8fafc',
        accent: '#9b5de5',
        pop: '#00c2ff',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Newsreader"', 'serif'],
      },
      backgroundImage: {
        aurora: 'radial-gradient(circle at 20% 20%, rgba(155,93,229,0.35), transparent 35%), radial-gradient(circle at 80% 0%, rgba(0,194,255,0.25), transparent 30%), linear-gradient(135deg, #0f172a 0%, #0b1021 70%)',
      },
      animation: {
        float: 'float 10s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      }
    },
  },
  plugins: [typography],
};

export default config;
