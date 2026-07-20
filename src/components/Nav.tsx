'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Aba = 'home' | 'macro' | 'backtest' | 'segunda' | 'geopolitica' | 'patrimonio' | 'noticias' | 'sugestoes' | 'comite' | 'mapa'

const links: { href: string; label: string; id: Aba }[] = [
  { href: '/painel',        label: 'Relatórios',   id: 'home'        },
  { href: '/mapa',          label: 'Market Map',   id: 'mapa'        },
  { href: '/comite',        label: 'A Mesa',       id: 'comite'      },
  { href: '/sugestoes',     label: '10 Sugestões', id: 'sugestoes'   },
  { href: '/segunda-feira', label: 'Segunda',      id: 'segunda'     },
  { href: '/macro',         label: 'Macro',        id: 'macro'       },
  { href: '/noticias',      label: 'Notícias BR',  id: 'noticias'    },
  { href: '/geopolitica',   label: 'Geopolítica',  id: 'geopolitica' },
  { href: '/patrimonio',    label: 'Patrimônio',   id: 'patrimonio'  },
  { href: '/backtesting',   label: 'Backtesting',  id: 'backtest'    },
]

export default function Nav({ ativa }: { ativa: Aba }) {
  const { user, logout, assinante } = useAuth()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      <nav style={{
        position: 'sticky', top: 10, zIndex: 200,
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(10,14,20,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #1c2538',
        borderRadius: 12,
        height: 48,
        padding: '0 12px',
        gap: 0,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, paddingRight: 16, borderRight: '1px solid #1c2538', textDecoration: 'none', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icone-pequi.png" alt="Caryo Map" width={28} height={28} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(240,180,41,0.35))', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Caryo<span style={{ color: 'var(--gold-bright)' }}> Map</span>
            </div>
            <div style={{ fontSize: 8.5, color: 'var(--muted)', letterSpacing: '0.14em', marginTop: 3, textTransform: 'uppercase' }}>Stock Market Radar</div>
          </div>
        </Link>

        {/* Links — oculta em mobile */}
        <div style={{ display: 'flex', gap: 2, flex: 1, padding: '0 8px', overflowX: 'auto' }} className="nav-links-desktop">
          {links.map(l => {
            const isAtiva = ativa === l.id
            return (
              <Link key={l.id} href={l.href} style={{
                padding: '5px 10px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: isAtiva ? 600 : 400,
                color: isAtiva ? '#5b9bff' : '#4d5f7a',
                background: isAtiva ? 'rgba(16,82,204,0.15)' : 'transparent',
                border: `1px solid ${isAtiva ? 'rgba(91,155,255,0.25)' : 'transparent'}`,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'color 0.12s, background 0.12s',
              }}>
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* Direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #1c2538', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="dot-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a63c', display: 'inline-block' }}/>
            <span style={{ fontSize: 10, color: '#00a63c', fontWeight: 600, letterSpacing: '0.06em' }}>AO VIVO</span>
          </div>

          {assinante ? (
            <span title="Assinatura ativa" style={{ fontSize: 10, fontWeight: 700, color: '#f0b429', background: 'rgba(212,146,10,0.14)', border: '1px solid rgba(212,146,10,0.35)', borderRadius: 5, padding: '3px 8px', fontFamily: 'var(--mono)' }}>★ PRO</span>
          ) : (
            <Link href="/assinar" style={{ fontSize: 11, fontWeight: 700, color: '#0a0e14', background: 'linear-gradient(135deg,#d4920a,#f0b429)', borderRadius: 6, padding: '4px 11px', textDecoration: 'none' }}>Assinar ✨</Link>
          )}

          {user && (
            <>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#d4920a', fontWeight: 600 }}>
                R$ {user.capital.toLocaleString('pt-BR')}
              </span>
              <button
                onClick={() => { logout(); router.push('/login') }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1c2538',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#4d5f7a',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >Sair</button>
            </>
          )}

          {/* Hamburger — só mobile */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Menu"
            style={{
              display: 'none',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, flexDirection: 'column', gap: 4,
            }}
            className="hamburger"
          >
            <span style={{ width: 18, height: 1.5, background: '#8a9bbf', display: 'block', borderRadius: 1 }}/>
            <span style={{ width: 14, height: 1.5, background: '#8a9bbf', display: 'block', borderRadius: 1 }}/>
            <span style={{ width: 18, height: 1.5, background: '#8a9bbf', display: 'block', borderRadius: 1 }}/>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {menuAberto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setMenuAberto(false)}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 260,
            background: '#0f1520',
            borderLeft: '1px solid #1c2538',
            padding: '20px 0',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #1c2538', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>B3 Radar</div>
              {user && <div style={{ fontSize: 12, color: '#d4920a', fontFamily: 'var(--mono)', marginTop: 4 }}>R$ {user.capital.toLocaleString('pt-BR')}</div>}
            </div>
            {links.map(l => (
              <Link key={l.id} href={l.href} onClick={() => setMenuAberto(false)} style={{
                display: 'block', padding: '11px 20px',
                fontSize: 14, color: ativa === l.id ? '#5b9bff' : '#8a9bbf',
                fontWeight: ativa === l.id ? 600 : 400,
                background: ativa === l.id ? 'rgba(16,82,204,0.1)' : 'transparent',
                textDecoration: 'none',
              }}>
                {l.label}
              </Link>
            ))}
            {user && (
              <button onClick={() => { logout(); router.push('/login') }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 20px', marginTop: 8, borderTop: '1px solid #1c2538',
                background: 'transparent', border: 'none',
                fontSize: 14, color: '#e53555', cursor: 'pointer',
              }}>Sair</button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
