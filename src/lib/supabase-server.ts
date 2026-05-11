// src/lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // ✅ PROTEGER set con try-catch para evitar errores en contextos inválidos
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignorar errores de contexto de cookies (esperado en Server Components)
            // Las cookies se actualizarán correctamente en Server Actions/Route Handlers
            console.debug('⚠️ Cookie set deferred (invalid context):', name)
          }
        },
        // ✅ PROTEGER remove con try-catch
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.debug('⚠️ Cookie remove deferred (invalid context):', name)
          }
        },
      },
    }
  )
}