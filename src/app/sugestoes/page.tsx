import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'
import SugestoesClient from './SugestoesClient'
import FontesDados from '@/components/FontesDados'

function getSugestoes() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('sugestoes_') && f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 10)
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')))
}

function getTickersComDebate(): string[] {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('comite_') && f.endsWith('.json'))
    .map(f => f.replace('comite_', '').replace('.json', ''))
}

export default function SugestoesPage() {
  const dias = getSugestoes()
  const comDebate = getTickersComDebate()
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="sugestoes" />
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em', margin: 0 }}>
          10 Sugestões por Dia
        </h1>
        <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: 6 }}>
          Comprar · Observar · Evitar — com o motivo de cada decisão
        </p>
      </header>
      <SugestoesClient dias={dias} comDebate={comDebate} />
      <FontesDados compacto />
    </main>
  )
}
