module.exports = {
  purge: [],
  theme: {
    extend: {
      colors: {
        // Legacy palette (kept for existing post styles)
        burnt_sienna: '#e27d60ff',
        independence: '#37496dff',
        platinum: '#e6e6e6ff',
        steel_teal: '#698a8cff',
        puce: '#c38d9eff',
        puce_dark: '#9c4f68ff',
        // Research-notebook dark palette
        navy: {
          950: '#050b18',
          900: '#0a0e1a',
          800: '#0d1427',
          700: '#111c35',
          600: '#1a2742',
          500: '#243254',
        },
        lab: {
          teal:    '#2dd4bf',  // primary accent
          cyan:    '#22d3ee',  // secondary accent
          green:   '#4ade80',  // highlight / success
          blue:    '#60a5fa',  // link colour
          amber:   '#fbbf24',  // warm highlight
          muted:   '#94a3b8',  // body muted text
          surface: '#111827',  // card background
          border:  '#1e293b',  // card border
        },
      },
      fontSize: {
        'xxs': 'xx-small',
        'xs': 'x-small',
        'sm': 'small',
        'md': 'medium',
        'lg': '1.25rem',
        'xl': 'x-large',
        'xxl': 'xx-large'
      },
      transitionDuration: {
        '4000': '4000ms'
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      fontFamily:{
        'pathway-gothic': ['"Pathway Gothic One"', 'sans-serif'],
        'nanum-gothic': ['"Nanum Gothic Coding"', 'monospace'],
        'epilogue': ['Epilogue', 'sans-serif'],
        'oswald': ['Oswald', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
      },
      margin:{
        '-2.5': '-0.625rem'
      }
    }
  },
  variants: {
    transitionProperty: ['responsive', 'hover', 'focus', 'group-hover'],
    transitionDuration: ['responsive', 'hover', 'focus', 'group-hover'],
    transitionDelay: ['responsive', 'hover', 'focus', 'group-hover'],
    transitionTimingFunction: ['responsive', 'hover', 'focus', 'group-hover'],
    lineClamp: ['responsive'],
    scale: ['responsive', 'hover', 'focus', 'group-hover'],
    height: ['responsive', 'hover', 'focus', 'group-hover'],
    margin: ['responsive', 'hover', 'focus', 'group-hover'],
  },
  plugins: [require('@neojp/tailwindcss-line-clamp-utilities')],
}
