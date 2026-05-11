// src/components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const menuItems = [
  { 
    href: '/admin', 
    label: 'Panel', 
    icon: '📊',
    description: 'Resumen general'
  },
  { 
    href: '/admin/tournaments', 
    label: 'Torneos', 
    icon: '🏆',
    description: 'Gestionar competiciones'
  },
  { 
    href: '/admin/teams', 
    label: 'Equipos', 
    icon: '👥',
    description: 'Registrar equipos'
  },
  { 
    href: '/admin/sanctions', 
    label: 'Sanciones', 
    icon: '🟨',
    description: 'Tarjetas y multas'
  },
  { 
    href: '/admin/settings', 
    label: 'Configuración', 
    icon: '⚙️',
    description: 'Ajustes del sistema'
  },
  { 
    href: '/admin/reports/financial', 
    label: 'Reportes', 
    icon: '📋',
    description: 'Informes y estadísticas'
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* ========== MOBILE HEADER (solo visible en móvil) ========== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#003ec7] text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Botón Hamburguesa */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo pequeño */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/logoicon.png"
              alt="FutsalCTP"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-heading font-bold text-sm">
              <span className="text-white">Futsal</span>
              <span className="text-[#fe6b00]">CTP</span>
            </span>
          </div>
          
          {/* Spacer para centrar */}
          <div className="w-10" />
        </div>
      </header>

      {/* ========== OVERLAY (solo móvil) ========== */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-45 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside className={cn(
        'fixed lg:static top-0 left-0 h-screen w-72 border-r border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-xl z-50 transition-transform duration-300 ease-in-out',
        // Desktop: siempre visible en su posición normal
        'lg:translate-x-0',
        // Mobile: se desliza según isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        
        {/* Header con Logo - VERTICAL */}
        <div className="relative border-b border-outline-variant/20 px-6 py-6">
          <Link 
            href="/admin" 
            className="flex flex-col items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            {/* Logo Icon */}
            <div className="relative w-24 h-24 mb-3">
              <Image
                src="/images/logoicon.png"
                alt="FutsalCTP"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            {/* Texto debajo del logo */}
            <div className="text-center space-y-0.5">
              <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight">
                <span className="text-[#003ec7]">Futsal</span>
                <span className="text-[#fe6b00]">CTP</span>
              </h1>
              <p className="text-xs text-on-surface-variant font-body font-medium">
                Panel de Administración
              </p>
            </div>
          </Link>
          
          {/* Botón cerrar (solo móvil) */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
                  'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl before:transition-all before:duration-300',
                  isActive
                    ? 'bg-primary/10 text-[#003ec7] before:bg-[#fe6b00] shadow-soft'
                    : 'text-on-surface-variant hover:bg-primary/5 hover:text-on-surface before:bg-transparent'
                )}
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Icon Container */}
                <div className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-br from-[#003ec7] to-[#0052ff] text-white shadow-md'
                    : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary/10 group-hover:text-[#003ec7]'
                )}>
                  <span className="text-lg">{item.icon}</span>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-heading text-sm font-semibold truncate transition-colors',
                    isActive ? 'text-[#003ec7]' : 'text-on-surface group-hover:text-on-surface'
                  )}>
                    {item.label}
                  </p>
                  <p className={cn(
                    'text-xs truncate transition-colors',
                    isActive ? 'text-on-surface-variant' : 'text-outline-variant group-hover:text-on-surface-variant'
                  )}>
                    {item.description}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-2 w-2 rounded-full bg-[#fe6b00] animate-pulse" />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer - User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-outline-variant/20 bg-surface-container-low/50 p-4 backdrop-blur-sm">
          {/* User Info */}
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#fe6b00] to-[#a04100] text-white font-heading font-bold text-sm">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-semibold text-on-surface truncate">
                Administrador
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                admin@futsal.com
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="group flex w-full items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-all duration-300 hover:border-error/50 hover:bg-error/5 hover:text-error"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container-high text-xs transition-colors group-hover:bg-error/20">
                🚪
              </span>
              <span className="font-heading">Cerrar Sesión</span>
            </button>
          </form>
        </div>

        {/* Decorative Elements */}
        <div className="pointer-events-none absolute bottom-32 left-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="pointer-events-none absolute top-32 right-4 h-32 w-32 rounded-full bg-secondary-container/5 blur-3xl" />
      </aside>
    </>
  )
}