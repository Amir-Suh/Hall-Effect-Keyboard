/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // All colors are driven by CSS variables defined in src/theme/tokens.css,
      // so a single component tree renders correctly in both dark and light themes.
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        sidebar: 'var(--sidebar)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'accent-soft': 'var(--accent-soft)',
        demo: 'var(--demo)',
        'demo-fg': 'var(--demo-fg)',
        key: 'var(--key)',
        'key-label': 'var(--key-label)',
        selected: 'var(--selected)',
        'callout-bg': 'var(--callout-bg)',
        'callout-border': 'var(--callout-border)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        key: '6px',
      },
    },
  },
  plugins: [],
};
