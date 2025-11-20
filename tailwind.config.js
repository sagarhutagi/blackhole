/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Gen Z Palette
        primary: {
          DEFAULT: '#8B5CF6', // Violet
          hover: '#7C3AED',
          light: '#A78BFA',
        },
        secondary: {
          DEFAULT: '#EC4899', // Pink
          hover: '#DB2777',
          light: '#F472B6',
        },
        accent: {
          DEFAULT: '#06B6D4', // Cyan
          hover: '#0891B2',
          light: '#22D3EE',
        },
        background: {
          dark: '#0F172A', // Slate 900
          card: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'], // Clean sans-serif
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      }
    },
  },
  plugins: [],
}
