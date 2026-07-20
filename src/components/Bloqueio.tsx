'use client'
import Link from 'next/link'

/**
 * Cartão de bloqueio para conteúdo de assinante.
 * Renderiza os `children` (o conteúdo real) quando `liberado` for true;
 * caso contrário mostra a chamada para assinar.
 */
export default function Bloqueio({
  liberado,
  titulo = 'Conteúdo de assinante',
  descricao = 'Este é o conteúdo fresco do dia — disponível no plano Caryo Map.',
  children,
}: {
  liberado: boolean
  titulo?: string
  descricao?: string
  children: React.ReactNode
}) {
  if (liberado) return <>{children}</>

  return (
    <div style={{
      position: 'relative',
      border: '1px solid rgba(212,146,10,0.35)',
      background: 'linear-gradient(135deg, var(--gold-bg), transparent)',
      borderRadius: 14, padding: '2.2rem 1.5rem', textAlign: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 30, marginBottom: 12 }}>🔒</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{titulo}</div>
      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 18px' }}>{descricao}</p>
      <Link href="/assinar" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #d4920a, #f0b429)', color: '#0a0e14',
        fontWeight: 800, fontSize: 14, padding: '11px 24px', borderRadius: 10, textDecoration: 'none',
        boxShadow: '0 6px 24px rgba(212,146,10,0.3)',
      }}>
        Assinar o Caryo Map →
      </Link>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 14 }}>
        A partir de <strong style={{ color: 'var(--gold-bright)' }}>R$ 197/ano</strong> · o conteúdo antigo continua grátis
      </div>
    </div>
  )
}
