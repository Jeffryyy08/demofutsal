// src/components/ui/AnimatedCard.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: 'slide-up' | 'fade-in' | 'scale-in'
  hoverEffect?: boolean
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  animation = 'slide-up',
  hoverEffect = true,
}: AnimatedCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-surface-container-lowest rounded-card shadow-soft',
        'transition-all duration-500 ease-out',
        isVisible ? `animate-${animation} opacity-100` : 'opacity-0',
        hoverEffect && 'hover:shadow-medium hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}