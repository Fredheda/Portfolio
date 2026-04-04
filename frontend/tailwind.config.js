export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          cyan: '#22d3ee',
          blue: '#38bdf8',
          violet: '#a78bfa',
          gold: '#fbbf24',
        },
        surface: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
        'permanent-marker': ['"Permanent Marker"', 'cursive'],
        caveat: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
};
