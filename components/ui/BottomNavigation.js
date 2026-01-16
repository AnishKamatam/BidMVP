// components/ui/BottomNavigation.js
// Fixed bottom navigation bar component matching design.json specifications
// Props:
//   - items: Array of navigation items with path, label, icon, and optional onClick
//   - activePath: Current active route path for highlighting

'use client'

import { memo } from 'react'
import Link from 'next/link'

function BottomNavigation({ items, activePath }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-border flex items-center justify-around z-50"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        // Special case: Home path '/' should be active when on '/events' since home redirects to events
        const isActive = !item.onClick && (activePath === item.path || (item.path === '/' && activePath === '/events'))
        const iconColor = isActive ? 'text-primary-ui' : 'text-gray-medium'

        // If onClick is provided, use button; otherwise use Link
        if (item.onClick) {
          return (
            <button
              key={item.path || item.label}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-ui focus:ring-offset-2 rounded-md"
              aria-label={item.label}
            >
              <span className={`w-6 h-6 ${iconColor} transition-colors duration-200`}>
                {item.icon}
              </span>
            </button>
          )
        }

        return (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-ui focus:ring-offset-2 rounded-md"
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={`w-6 h-6 ${iconColor} transition-colors duration-200`}>
              {item.icon}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default memo(BottomNavigation)

