/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colores fijos de la marca
        naranja: { DEFAULT: '#FF8A1F', oscuro: '#C2560A' },
        petroleo: { DEFAULT: '#0F3D4A', profundo: '#0A2A33', tinta: '#0B2E38' },
        menta: { DEFAULT: '#3CCFA0', oscuro: '#1F9C75' },
        coral: { DEFAULT: '#FF6B5E', oscuro: '#C5382C' },
        crema: '#FFF6E9',
        // Colores que cambian con el modo claro/oscuro (ver index.css)
        fondo: 'var(--fondo)',
        tarjeta: 'var(--tarjeta)',
        tinta: 'var(--tinta)',
        suave: 'var(--suave)',
        borde: 'var(--borde)',
        cabecera: 'var(--cabecera)',
        campo: 'var(--campo)',
        'coral-bg': 'var(--coral-bg)',
        'coral-fg': 'var(--coral-fg)',
        'menta-bg': 'var(--menta-bg)',
        'menta-fg': 'var(--menta-fg)',
        'naranja-bg': 'var(--naranja-bg)',
        'naranja-fg': 'var(--naranja-fg)',
        'petroleo-bg': 'var(--petroleo-bg)',
        'petroleo-fg': 'var(--petroleo-fg)',
      },
      boxShadow: {
        relieve: '0 6px 0 var(--borde)',
        'relieve-sm': '0 4px 0 var(--borde)',
        'btn-naranja': '0 5px 0 #C2560A',
        'btn-menta': '0 5px 0 #1F9C75',
        'btn-coral': '0 5px 0 #C5382C',
        'btn-neutro': '0 5px 0 var(--borde)',
      },
      borderRadius: {
        '4xl': '28px',
        '5xl': '36px',
      },
    },
  },
  plugins: [],
};
