// src/app/layout.tsx
import type { Metadata } from "next"
import { Lexend, Plus_Jakarta_Sans } from 'next/font/google'
import "./globals.css"

// Configurar fuentes
const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Futsal Pro - Torneo Escolar",
  description: "Sistema de gestión de torneos de futsal escolar",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${lexend.variable} ${plusJakarta.variable} font-body`}>
        {children}
      </body>
    </html>
  )
}