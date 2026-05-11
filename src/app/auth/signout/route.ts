// src/app/auth/signout/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // ✅ Usar URL relativa (recomendado) o la URL correcta del sitio
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'))
  
  // O si tienes variable de entorno:
  // return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}