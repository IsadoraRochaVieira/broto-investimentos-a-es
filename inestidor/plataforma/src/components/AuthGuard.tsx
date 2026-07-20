'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, carregando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!carregando && !user) router.replace('/login')
  }, [user, carregando, router])

  if (carregando || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4d5f7a', fontSize: '0.88rem' }}>Carregando...</div>
      </div>
    )
  }

  return <>{children}</>
}
