/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.35)'
      },
      backgroundImage: {
        stadium:
          'radial-gradient(circle at top left, rgba(139,92,246,0.24), transparent 26%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 22%), linear-gradient(180deg, rgba(11,16,32,1), rgba(17,24,39,1))'
      }
    }
  },
  plugins: []
};
