// src/app/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  try {
    const supabase = await createClient()
    const {  data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      redirect('/admin')
    } else {
      redirect('/login')
    }
  } catch (error) {
    redirect('/login')
  }
}