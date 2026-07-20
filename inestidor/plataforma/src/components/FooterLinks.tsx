'use client'

const links = [
  { label: 'Relatórios',   href: '/painel' },
  { label: 'Market Map',   href: '/mapa' },
  { label: 'A Mesa',       href: '/comite' },
  { label: 'Termos & Avisos', href: '/termos' },
]

export default function FooterLinks() {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      {links.map(l => (
        <a
          key={l.href}
          href={l.href}
          style={{ color: '#4d5f7a', fontSize: 13, transition: 'color 0.12s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#5b9bff')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#4d5f7a')}
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}
