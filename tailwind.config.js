// tailwind.config.js

const themeSettings = {
  fonts: {
    primary: 'Montserrat, sans-serif',
    secondary: 'Lato, sans-serif',
  },
  colors: {
    light: {
      text: {
        primaryHeading: '#1f2937',
        secondaryHeading: '#374151',
        body: '#4b5563',
      },
      background: {
        default: '#f3f4f6',      // Lightest Gray (Page BG)
        accordion: '#e5e7eb',  // Mid Gray (Accordion BG)
        card: '#ffffff',         // White (Content Card BG)
      },
      accent: {
        primary: '#2563eb',
      },
    },
    dark: {
      text: {
        primaryHeading: '#f3f4f6',
        secondaryHeading: '#d1d5db',
        body: '#9ca3af',
      },
      background: {
        default: '#111827',      // Darkest Blue/Gray (Page BG)
        accordion: '#1f2937',  // Mid Dark Blue/Gray (Accordion BG)
        card: '#374151',         // Lighter Gray (Content Card BG)
      },
      accent: {
        primary: '#3b82f6',
      },
    },
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: [themeSettings.fonts.primary],
        body: [themeSettings.fonts.secondary],
      },
      colors: {
        'primary-heading': themeSettings.colors.light.text.primaryHeading,
        'secondary-heading': themeSettings.colors.light.text.secondaryHeading,
        'body-text': themeSettings.colors.light.text.body,
        'background': themeSettings.colors.light.background.default,
        'accordion-bg': themeSettings.colors.light.background.accordion, // New Color
        'card-bg': themeSettings.colors.light.background.card,
        'accent': themeSettings.colors.light.accent.primary,
        'dark-primary-heading': themeSettings.colors.dark.text.primaryHeading,
        'dark-secondary-heading': themeSettings.colors.dark.text.secondaryHeading,
        'dark-body-text': themeSettings.colors.dark.text.body,
        'dark-background': themeSettings.colors.dark.background.default,
        'dark-accordion-bg': themeSettings.colors.dark.background.accordion, // New Color
        'dark-card-bg': themeSettings.colors.dark.background.card,
        'dark-accent': themeSettings.colors.dark.accent.primary,
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

