// src/components/ui/GlassNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon?: string
}

interface GlassNavProps {
  items: NavItem[]
}

export function GlassNav({ items }: GlassNavProps) {
  const pathname = usePathname()

  return (
    <nav className="nav-glass fixed top-0 left-0 right-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 px-gutter">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-2xl shadow-glow group-hover:shadow-large transition-all">
              ⚽
            </div>
            <span className="font-heading text-headline-md text-onSurface">
              Futsal<span className="text-primary">Pro</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {items.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-6 py-3 font-heading text-label-caps rounded-t-lg',
                    'transition-all duration-300',
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-onSurfaceVariant hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-container rounded-t-full animate-scale-in" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* User/Profile */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-primary/10 transition-colors flex items-center justify-center">
              👤
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}