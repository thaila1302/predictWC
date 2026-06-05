/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(15,23,42,0.05), 0 20px 60px rgba(15,23,42,0.12)'
      },
      backgroundImage: {
        stadium:
          'radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 20%), radial-gradient(circle at top right, rgba(16,185,129,0.1), transparent 18%), linear-gradient(180deg, rgba(248,250,252,1), rgba(238,246,255,1), rgba(255,255,255,1))'
      }
    }
  },
  plugins: []
};
