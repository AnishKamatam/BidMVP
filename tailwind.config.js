// tailwind.config.js
// Tailwind CSS configuration
// Defines where Tailwind looks for class names and custom theme settings
// Extended with design system tokens from design.json

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  // It will only include CSS for classes actually used in these files
  content: [
    './pages/**/*.{js,jsx}',      // Pages directory (if using pages router)
    './components/**/*.{js,jsx}',  // Component files
    './app/**/*.{js,jsx}',         // App directory (App Router)
  ],
  theme: {
    extend: {
      // Font family - Inter from design.json
      fontFamily: {
        inter: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      // Colors from design.json
      colors: {
        // Primary UI colors
        'primary-ui': '#3B82F6',      // Blue primary UI accent
        'primary-bg': '#FFFFFF',      // White background (light theme default)
        'primary-bg-dark': '#1F2937', // Dark background (dark theme)
        'primary-accent': '#DC2626',  // Red accent (kept for errors/destructive actions)
        
        // Neutral colors
        'neutral-white': '#FFFFFF',   // Pure white for cards
        'neutral-black': '#000000',   // Pure black for text
        'gray-light': '#F3F4F6',      // Very light gray for subtle backgrounds
        'gray-border': '#E5E7EB',     // Light gray for borders
        'gray-medium': '#9CA3AF',     // Medium gray for secondary text
        'gray-dark': '#4B5563',       // Dark gray for tertiary text
        'gray-bg': '#374151',         // Dark gray for buttons/backgrounds (dark theme)
        
        // Gender colors
        'gender-woman': '#EC4899',    // Pink for woman/female
        'gender-man': '#3B82F6',      // Blue for man/male
        'gender-nonBinary': '#10B981', // Green for non-binary/other
        
        // Premium feature colors
        'premium-blue': '#3B82F6',    // Blue for premium features (MoonitX)
        'premium-yellow': '#FBBF24',  // Yellow for gifts
        'premium-orange': '#F59E0B',  // Orange for boosts
        
        // Semantic colors
        'success': '#10B981',         // Green for success/accept
        'error': '#EF4444',           // Red for errors/deny
        'warning': '#F59E0B',         // Orange for warnings
        'info': '#3B82F6',            // Blue for info (same as primary-ui)
      },
      // Gradient colors
      backgroundImage: {
        'gradient-blue-orange': 'linear-gradient(to right, #3B82F6, #F59E0B)',
        'gradient-blue-purple': 'linear-gradient(to right, #3B82F6, #8B5CF6)',
      },
      // Typography scale from design.json
      fontSize: {
        'display': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading1': ['1.5rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading2': ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        'heading3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }],
        'bodySmall': ['0.875rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.01em' }],
      },
      // Spacing scale from design.json
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      // Border radius from design.json
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        'full': '9999px',
      },
      // Shadows from design.json
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [], // No additional Tailwind plugins currently installed
}

