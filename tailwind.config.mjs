// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
const config = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        perspective: {
          '1000': '1000px',
        },
        transform: ['group-hover'],
      },
    },
    plugins: [],
  };
  
  export default config;