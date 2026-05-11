// src/app/admin/layout.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No hay usuario, redirigiendo...')
      redirect('/login')
    }

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:pt-0 pt-14">{children}</main>
      </div>
    )
  } catch (error) {
    console.error('Error en admin layout:', error)
    redirect('/login')
  }
}