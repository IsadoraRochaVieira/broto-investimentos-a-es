import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'
import MapaClient, { type Mapa } from './MapaClient'
import FontesDados from '@/components/FontesDados'

function getMapa(): Mapa | null {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('mapa_') && f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8')) as Mapa
}

function getTickersComDebate(): string[] {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('comite_') && f.endsWith('.json'))
    .map(f => f.replace('comite_', '').replace('.json', ''))
}

export default function MapaPage() {
  const mapa = getMapa()
  const comDebate = getTickersComDebate()

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="mapa" />

      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
          Camada de escaneamento visual
        </div>
        <h1 className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>Market Map</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6, maxWidth: 640, lineHeight: 1.6 }}>
          Toda a bolsa em um só olhar. Cada quadrado é uma ação, agrupada por setor e colorida
          pela oportunidade que o radar enxerga — o ouro dourado, os espinhos em vermelho.
        </p>
      </header>

      {!mapa ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
          Mapa ainda não gerado. Rode <span style={{ fontFamily: 'var(--mono)' }}>gerar_mapa.py</span>.
        </div>
      ) : (
        <MapaClient mapa={mapa} comDebate={comDebate} />
      )}
      <FontesDados compacto />
    </main>
  )
}
