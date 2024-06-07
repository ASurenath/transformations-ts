/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'bg-[#1783b8]',
    'bg-[#4dc0ae]',
    'bg-[#a1e6db]',
    'bg-[#ffffff]',
    'text-[#1783b8]',
    'text-[#4dc0ae]',
    'border-[#1783b8]',
    'border-[#4dc0ae]',
    'border-[#a1e6db]'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

