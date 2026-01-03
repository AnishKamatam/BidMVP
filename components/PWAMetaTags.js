// components/PWAMetaTags.js
// Client component to add PWA meta tags that aren't supported by Next.js metadata API
// This adds iOS-specific meta tags and other PWA-related tags

'use client'

import { useEffect } from 'react'

export default function PWAMetaTags() {
  useEffect(() => {
    // Only run on client side
    if (typeof document === 'undefined') return

    // Add iOS-specific meta tags that aren't fully covered by metadata API
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'BidMVP' },
      { name: 'msapplication-TileColor', content: '#3B82F6' },
    ]

    const linkTags = [
      { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
      { rel: 'apple-touch-icon', sizes: '152x152', href: '/icons/icon-152x152.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/icon-192x192.png' },
      { rel: 'apple-touch-icon', sizes: '167x167', href: '/icons/icon-192x192.png' },
    ]

    // Add meta tags
    metaTags.forEach(tag => {
      if (!document.querySelector(`meta[name="${tag.name}"]`)) {
        const meta = document.createElement('meta')
        meta.name = tag.name
        meta.content = tag.content
        document.head.appendChild(meta)
      }
    })

    // Add link tags
    linkTags.forEach(tag => {
      const selector = tag.sizes 
        ? `link[rel="${tag.rel}"][sizes="${tag.sizes}"]`
        : `link[rel="${tag.rel}"]:not([sizes])`
      
      if (!document.querySelector(selector)) {
        const link = document.createElement('link')
        link.rel = tag.rel
        link.href = tag.href
        if (tag.sizes) {
          link.setAttribute('sizes', tag.sizes)
        }
        document.head.appendChild(link)
      }
    })
  }, [])

  return null
}

