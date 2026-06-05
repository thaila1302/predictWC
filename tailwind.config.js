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
          'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 24%), radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 22%), linear-gradient(180deg, rgba(248,250,252,1), rgba(226,232,240,1), rgba(241,245,249,1))'
      }
    }
  },
  plugins: []
};
