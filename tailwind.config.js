/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        indigoBrand: '#6366F1',
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgba(59, 130, 246, 0.35)',
      },
      fontFamily: {
        sans: ['Poppins', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
