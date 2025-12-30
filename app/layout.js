// app/layout.js
// Root layout component that wraps the entire app
// Sets up fonts, metadata, and global providers

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { FraternityProvider } from '@/contexts/FraternityContext'

// Configure Inter font from Google Fonts
// The variable option creates a CSS custom property we can reference
const inter = Inter({ 
  subsets: ['latin'],           // Only load Latin character set
  variable: '--font-inter',     // Creates CSS var: --font-inter
})

// Page metadata for SEO and browser tabs
export const metadata = {
  title: 'BidMVP',
  description: 'Mobile bidding interface',
}

// Viewport settings optimized for mobile devices
export const viewport = {
  width: 'device-width',        // Scale to device width
  initialScale: 1,              // Don't zoom in/out on load
  maximumScale: 1,              // Prevent user zoom (app-like behavior)
  userScalable: false,          // Disable pinch-to-zoom
  viewportFit: 'cover',         // Fill notches on modern phones
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter`}>
        {/* Wrap entire app in AuthProvider so any component can access auth state */}
        <AuthProvider>
          {/* Wrap in FraternityProvider so any component can access fraternity state */}
          <FraternityProvider>{children}</FraternityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

