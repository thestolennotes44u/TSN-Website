/** @type {import('tailwindcss').Config} */

const colors = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
];

const safelist = colors.flatMap((color) => [
  `bg-${color}-50`, `dark:bg-${color}-800`,
  `bg-${color}-100`, `dark:bg-${color}-900`,
  `text-${color}-800`, `dark:text-${color}-100`,
  `text-${color}-700`, `dark:text-${color}-300`,
  `text-${color}-600`, `dark:text-${color}-400`,
  `bg-${color}-600`, `hover:bg-${color}-700`,
  `border-${color}-600`, `dark:border-${color}-500`,
  `dark:text-${color}-200`,
]);

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist,
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}
