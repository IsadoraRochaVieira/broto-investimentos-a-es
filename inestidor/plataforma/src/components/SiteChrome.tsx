'use client'

import { usePathname } from 'next/navigation'
import BackgroundFX from '@/components/BackgroundFX'
import FooterLinks from '@/components/FooterLinks'

/* A moldura do Caryo (fundo escuro + rodapé "Caryo Map").
   O BROTO é marca irmã com pele própria: nas rotas /broto a gente esconde
   essa moldura pra ele parecer — e ser — outro site. Mesmo motor, outra cara. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBroto = pathname?.startsWith('/broto')

  if (isBroto) {
    // o BROTO traz o próprio fundo, o próprio rodapé, a própria voz
    return <>{children}</>
  }

  return (
    <>
      <BackgroundFX />
      {children}

      <footer style={{
        borderTop: '1px solid #1c2538',
        marginTop: '5rem',
        padding: '2rem 1rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icone-pequi.png" alt="Caryo Map" width={34} height={34} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(240,180,41,0.3))' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em' }}>Caryo <span style={{ color: '#f0b429' }}>Map</span></div>
                <div style={{ fontSize: 11, color: '#4d5f7a', marginTop: 1 }}>por Pequi Estúdio · Brasília, DF</div>
              </div>
            </div>
            <FooterLinks />
          </div>

          <div style={{ borderTop: '1px solid #1c2538', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: '#2d3a4f', fontSize: 12 }}>
              Não é recomendação de investimento · Ferramenta educacional ·{' '}
              <a href="/termos" style={{ color: '#4d5f7a', textDecoration: 'underline' }}>Termos & Avisos</a>
            </p>
            <p style={{ color: '#2d3a4f', fontSize: 11, fontFamily: 'var(--mono)' }}>© 2026 Caryo Map · Pequi Estúdio</p>
          </div>
        </div>
      </footer>
    </>
  )
}
