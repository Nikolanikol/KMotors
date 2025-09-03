module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/tw-animate-css/dist/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', "sans-serif"],
      },
      colors: {
        "orange-accent": "#eb6753",
      },
      borderColor: {
        "orange-accent": "#eb6753",
      },
    },
  },
  plugins: [],
};
