/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          dark: '#6F4E37',      // Koyu kahverengi
          medium: '#8B6F47',   // Orta kahverengi
          light: '#D2B48C',    // Sütlü kahve
          cream: '#F5E6D3',     // Krem rengi
        },
      },
      boxShadow: {
        'coffee': '0 4px 15px rgba(111, 78, 55, 0.3)',
        'coffee-lg': '0 8px 25px rgba(111, 78, 55, 0.4)',
      },
    },
  },
  plugins: [],
}

