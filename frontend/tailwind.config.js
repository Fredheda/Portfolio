// Scheme 3, "soft blue wash" (Portfolio v2 spec, owner decision 2026-11-01).
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f7f9fd',
        ink: '#0f2440',
        muted: '#4b5c78',
        royal: '#1d4ed8',
        line: '#e3e9f5',
        panel: '#0a1a33',
        panelText: '#e6edf8',
        panelMuted: '#9fb0cc',
        prompt: '#f0b429',
        toolLine: '#7dd3fc',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        page: '1120px',
      },
    },
  },
  plugins: [],
};
