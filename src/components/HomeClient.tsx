'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomeClient() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      const t = setTimeout(() => {
        if (!localStorage.getItem('b3radar_session')) router.replace('/login')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [user, router])

  if (!user) return null

  const capital = user.capital
  const caixa = Math.round(capital * 0.15)
  const porAtivo = Math.round((capital - caixa) / 2 / 100) * 100

  return (
    <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderLeft: '4px solid #00a63c', borderRadius: 12, padding: '1.1rem 1.4rem', marginBottom: '2rem' }}>
      <div style={{ fontSize: '0.68rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem', fontWeight: 700 }}>
        Seu plano — R$ {capital.toLocaleString('pt-BR')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: 'Por posição', valor: `R$ ${porAtivo.toLocaleString('pt-BR')}`, cor: '#34d17e', sub: '~2 ativos simultâneos' },
          { label: 'Caixa livre', valor: `R$ ${caixa.toLocaleString('pt-BR')}`, cor: '#f0b429', sub: '15% reservado' },
          { label: 'Stop máx/op.', valor: `R$ ${Math.round(porAtivo * 0.05).toLocaleString('pt-BR')}`, cor: '#e53555', sub: '5% do capital por ativo' },
          { label: 'Alvo semana', valor: `R$ ${Math.round(capital * 1.03).toLocaleString('pt-BR')}`, cor: '#5b9bff', sub: '+3% semanal' },
        ].map(c => (
          <div key={c.label} style={{ background: '#0a0e14', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
            <div style={{ color: c.cor, fontWeight: 800, fontSize: '1.05rem', marginTop: 3 }}>{c.valor}</div>
            <div style={{ color: '#4d5f7a', fontSize: '0.7rem', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
