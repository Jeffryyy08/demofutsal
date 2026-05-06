// src/components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold">Torneo Futsal</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80">
            Inicio
          </Link>
          <Link href="/partidos" className="transition-colors hover:text-foreground/80">
            Partidos
          </Link>
          <Link href="/posiciones" className="transition-colors hover:text-foreground/80">
            Posiciones
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Ingresar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}