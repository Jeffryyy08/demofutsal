// src/services/auth.service.ts
import { supabase } from '@/lib/supabase'

export interface LoginCredentials {
  email: string
  password: string
}

export async function signIn(credentials: LoginCredentials) {
  console.log('🔐 Intentando login con:', credentials.email)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    console.log('📥 Respuesta de Supabase:', { data, error })

    if (error) {
      console.error('❌ Error de Supabase:', error)
      throw error
    }
    
    console.log('✅ Login exitoso, user:', data.user?.email)
    return { success: true, user: data.user }
  } catch (error) {
    console.error('💥 Error en signIn:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al iniciar sesión',
    }
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}