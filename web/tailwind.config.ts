import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plaza: {
          blue: '#1F5297',
          slate: '#3B4B58',
          mist: '#ECEAEB',
          ink: '#1D1E1C',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['"Albert Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 18px 45px -28px rgba(29, 30, 28, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
