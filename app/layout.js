// app/layout.js
// Root layout component that wraps the entire app
// Sets up fonts, metadata, and global providers

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { FriendProvider } from '@/contexts/FriendContext'
import { FraternityProvider } from '@/contexts/FraternityContext'
import { ChatProvider } from '@/contexts/ChatContext'
import LayoutWrapper from '@/components/LayoutWrapper'
import PWAMetaTags from '@/components/PWAMetaTags'

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BidMVP',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
}

// Viewport settings optimized for mobile devices
export const viewport = {
  width: 'device-width',        // Scale to device width
  initialScale: 1,              // Don't zoom in/out on load
  maximumScale: 1,              // Prevent user zoom (app-like behavior)
  userScalable: false,          // Disable pinch-to-zoom
  viewportFit: 'cover',         // Fill notches on modern phones
  themeColor: '#3B82F6',        // Browser theme color
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter`}>
        <PWAMetaTags />
        {/* Wrap entire app in AuthProvider so any component can access auth state */}
        <AuthProvider>
          {/* Wrap in FriendProvider so any component can access friend state */}
          <FriendProvider>
            {/* Wrap in FraternityProvider so any component can access fraternity state */}
            <FraternityProvider>
              {/* Wrap in ChatProvider so any component can access chat state */}
              <ChatProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ChatProvider>
            </FraternityProvider>
          </FriendProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

