import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'
import ComiteClient, { type Comite } from './ComiteClient'

function getComites(): Comite[] {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('comite_') && f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Comite)
    .sort((a, b) => a.ticker.localeCompare(b.ticker))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFundamentos(): Record<string, any> {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {}
  for (const f of fs.readdirSync(dir).filter(f => f.startsWith('fundamentos_') && f.endsWith('.json'))) {
    const tk = f.replace('fundamentos_', '').replace('.json', '')
    out[tk] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
  }
  return out
}

export default function ComitePage() {
  const comites = getComites()
  const fundamentos = getFundamentos()

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="comite" />

      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
          O Comitê de Inteligência
        </div>
        <h1 className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>A Mesa</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6, maxWidth: 620, lineHeight: 1.6 }}>
          Sete analistas especialistas debatem uma ação pela sua lente. Você lê os argumentos de
          defesa e de ataque antes de decidir — e um veredito único concilia a mesa.
        </p>
      </header>

      {comites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
          Nenhum debate gerado ainda. Rode <span style={{ fontFamily: 'var(--mono)' }}>comite_ia.py</span>.
        </div>
      ) : (
        <ComiteClient comites={comites} fundamentos={fundamentos} />
      )}
    </main>
  )
}
