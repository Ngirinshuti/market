// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  // CRITICAL: This setting enables the dark mode functionality.
  // It tells Tailwind to look for the 'dark' class on the <html> element
  // (which is applied by your Header.tsx component) to enable dark mode styles.
  darkMode: 'class',

  content: [
    // This array tells Tailwind where to look for utility classes in your project.
    // Ensure these paths correctly cover all your components and pages.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // If you use a 'src' directory
  ],
  theme: {
    extend: {
      // You can define custom colors, fonts, spacing, etc., here.
      // Based on your Header.tsx, it uses 'coral-500'. Defining it here
      // ensures it's available in your theme.
      colors: {
        coral: {
          '500': '#FF6347', // A common, vibrant coral hex code (e.g., Tomato)
        },
      },
    },
  },
  plugins: [
    // Add any official or custom Tailwind plugins here.
  ],
};

export default config;