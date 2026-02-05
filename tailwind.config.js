/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#195bac',
          dark: '#144a8c',
          light: '#3375c4',
        },
        secondary: {
          DEFAULT: '#00BFFF',
          dark: '#185F99',
          light: '#33ccff',
        },
        background: {
          DEFAULT: '#e9f4ff',
          dark: '#d4e8f9',
          card: '#ffffff',
        },
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'premium-in': 'premium-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'premium-fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      boxShadow: {
        'bubble': '0 2px 5px rgba(0, 0, 0, 0.05)',
        'bubble-sent': '0 2px 5px rgba(25, 91, 172, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
        'header': '0 4px 30px rgba(0, 0, 0, 0.03)',
        'float': '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
        'soft': '0 5px 15px rgba(0,0,0,0.05)',
        'glow': '0 0 15px rgba(25, 91, 172, 0.4)',
      },
    },
  },
  plugins: [],
};
