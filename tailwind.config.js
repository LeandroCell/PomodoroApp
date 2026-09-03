/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FBF6EF',
          100: '#F5EFE6',
          200: '#E6D5BE',
          300: '#D2B48C',
          400: '#B08968',
          500: '#8B5E3C',
          600: '#6B4423',
          700: '#4A2E19',
          800: '#3A2314',
          900: '#26160C',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FBF6EF',
        },
        break: {
          light: '#7FB8A4',
          DEFAULT: '#4E9A81',
          dark: '#356E5C',
        },
        longbreak: {
          light: '#7FA8D9',
          DEFAULT: '#4A7FB5',
          dark: '#325A82',
        },
      },
    },
  },
  plugins: [],
};
