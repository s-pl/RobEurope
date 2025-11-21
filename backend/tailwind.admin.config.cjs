module.exports = {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#d9ecff',
          200: '#b3d9ff',
          300: '#85c2ff',
          400: '#4da3ff',
          500: '#1d7fe6',
          600: '#0f5fb4',
          700: '#094382',
          800: '#042851',
          900: '#02152e'
        }
      }
    }
  },
  plugins: []
};