// src/components/forms/LoginForm.tsx
'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import Image from 'next/image'

export function LoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    // ✅ NO usar try/catch - redirect() lanza una excepción especial
    const result = await login(formData)
    
    // Solo llegamos aquí si el login FALLÓ (no hubo redirect)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si el login fue exitoso, redirect() ya se ejecutó
  }

  return (
    <AnimatedCard className="w-full max-w-md mx-auto p-8" animation="scale-in">
      {/* Logo y Título - Estilo Sidebar */}
      <div className="text-center mb-8">
        {/* Logo del sidebar */}
        <div className="inline-flex items-center justify-center mb-4">
          <Image
            src="/images/logoicon.png"  // ← Ajusta la ruta según donde tengas el logo
            alt="CTP Logo"
            width={120}
            height={120}
            className="drop-shadow-lg"
            priority
          />
        </div>
        
        {/* Título estilo sidebar */}
        <h1 className="font-heading text-2xl font-bold mb-1">
          <span className="text-[#003ec7]">Futsal</span><span className="text-[#fe6b00]">CTP</span>
        </h1>
        
        <p className="font-body text-body-md text-on-surface-variant">
          Inicio de sesión
        </p>
      </div>

      {/* Form */}
      <form action={handleSubmit} className="space-y-5">
        
        {/* Email Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="email" 
            className="font-heading text-label-caps text-on-surface-variant"
          >
            Correo electrónico
          </Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@colegio.edu"
              required
              disabled={loading}
              className="font-body text-body-md h-12 pl-4 pr-4 rounded-xl border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:bg-surface-container disabled:text-on-surface-variant"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              ✉️
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="password" 
            className="font-heading text-label-caps text-on-surface-variant"
          >
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
              className="font-body text-body-md h-12 pl-4 pr-4 rounded-xl border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:bg-surface-container disabled:text-on-surface-variant"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              🔒
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="p-4 rounded-xl bg-error-container/20 border border-error/30 animate-slide-up"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="text-error text-lg">⚠️</span>
              <p className="font-body text-body-md text-error font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full h-14 rounded-full font-heading text-label-caps text-white
            bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
            flex items-center justify-center gap-2
          `}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Ingresar al Panel</span>
            </>
          )}
        </button>

      </form>

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
        <p className="font-body text-body-sm text-on-surface-variant">
          ¿Problemas para acceder?{' '}
          <a 
            href="/auth/forgot-password" 
            className="font-heading text-label-caps text-primary hover:text-primary-container transition-colors"
          >
            Recuperar contraseña
          </a>
        </p>
        <p className="font-body text-body-xs text-on-surface-variant mt-3">
          © 2026 FutsalCTP • By Jeffry López
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary-container/5 blur-2xl" />
    </AnimatedCard>
  )
}