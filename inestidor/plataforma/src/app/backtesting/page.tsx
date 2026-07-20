import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'
import TickerLink from '@/components/TickerLink'

function getBacktest() {
  const f = path.join(process.cwd(), 'relatorios', 'backtest_historico.json')
  if (!fs.existsSync(f)) return []
  return JSON.parse(fs.readFileSync(f, 'utf-8'))
}

function getMetricasDoUltimoRelatorio() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f !== 'backtest_historico.json')
    .sort((a, b) => b.localeCompare(a))
  if (!files.length) return null
  const d = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'))
  return d.backtesting ?? null
}

const corRes = (v: number | null) => {
  if (v === null) return '#4d5f7a'
  return v > 0 ? '#34d17e' : v < 0 ? '#e53555' : '#4d5f7a'
}

export default function BacktestingPage() {
  const historico: any[] = getBacktest()
  const metricas = getMetricasDoUltimoRelatorio()

  const fechados = historico.filter(op => op.status === 'fechado')
  const abertos = historico.filter(op => op.status === 'aberto')
  const ganhos = fechados.filter(op => (op.resultado_pct ?? 0) > 0)
  const perdas = fechados.filter(op => (op.resultado_pct ?? 0) <= 0)
  const taxaAcerto = fechados.length > 0 ? Math.round(ganhos.length / fechados.length * 100) : 0
  const retornoMedio = fechados.length > 0
    ? (fechados.reduce((s, op) => s + (op.resultado_pct ?? 0), 0) / fechados.length).toFixed(2)
    : '0.00'

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="backtest" />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8edf5' }}>Backtesting</h1>
        <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Resultado histórico de todas as sugestões geradas pelo sistema
        </p>
      </header>

      {/* Métricas resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {[
          { label: 'Taxa de acerto', valor: `${taxaAcerto}%`, cor: taxaAcerto >= 60 ? '#34d17e' : taxaAcerto >= 40 ? '#f0b429' : '#e53555' },
          { label: 'Retorno médio', valor: `${Number(retornoMedio) > 0 ? '+' : ''}${retornoMedio}%`, cor: Number(retornoMedio) >= 0 ? '#34d17e' : '#e53555' },
          { label: 'Operações', valor: String(historico.length), cor: '#e8edf5' },
          { label: 'Ganhos', valor: String(ganhos.length), cor: '#34d17e' },
          { label: 'Perdas', valor: String(perdas.length), cor: '#e53555' },
          { label: 'Em aberto', valor: String(abertos.length), cor: '#f0b429' },
        ].map(c => (
          <div key={c.label} style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1rem' }}>
            <div style={{ color: '#4d5f7a', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
            <div style={{ color: c.cor, fontWeight: 800, fontSize: '1.5rem', marginTop: '0.3rem' }}>{c.valor}</div>
          </div>
        ))}
      </div>

      {/* Barra visual de acerto */}
      {fechados.length > 0 && (
        <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
            <span style={{ color: '#34d17e', fontWeight: 600 }}>Ganhos: {ganhos.length}</span>
            <span style={{ color: '#e53555', fontWeight: 600 }}>Perdas: {perdas.length}</span>
          </div>
          <div style={{ height: 10, background: '#e5355540', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${taxaAcerto}%`, background: '#00a63c', borderRadius: 5, transition: 'width 0.5s' }} />
          </div>
          <div style={{ color: '#4d5f7a', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
            {taxaAcerto}% de acerto em {fechados.length} operações encerradas
          </div>
        </div>
      )}

      {/* Operações em aberto */}
      {abertos.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.72rem', color: '#f0b429', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Em aberto ({abertos.length})
            </h2>
            <div style={{ flex: 1, height: 1, background: '#1c2538' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {abertos.map((op, i) => {
              const parcial = op.resultado_pct_atual ?? null
              return (
                <div key={i} style={{ background: '#0f1520', border: '1px solid #f0b42930', borderLeft: '4px solid #f0b429', borderRadius: 10, padding: '0.9rem 1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <TickerLink ticker={op.ticker} style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--mono)' }} />
                      <span style={{ color: '#4d5f7a', fontSize: '0.8rem', marginLeft: '0.75rem' }}>Entrada: R$ {op.preco_entrada} em {op.data_entrada}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.82rem' }}>
                      <span style={{ color: '#e53555' }}>Stop: R$ {op.stop}</span>
                      <span style={{ color: '#34d17e' }}>Alvo: R$ {op.alvo}</span>
                      {parcial !== null && (
                        <span style={{ color: corRes(parcial), fontWeight: 700 }}>
                          Agora: {parcial > 0 ? '+' : ''}{parcial}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico de operações fechadas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Operações encerradas
          </h2>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }} />
        </div>

        {fechados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#4d5f7a', border: '1px dashed #1c2538', borderRadius: 12 }}>
            Nenhuma operação encerrada ainda. O sistema registra automaticamente quando stop ou alvo é atingido.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...fechados].sort((a, b) => (b.data_saida ?? '').localeCompare(a.data_saida ?? '')).map((op, i) => {
              const res = op.resultado_pct ?? 0
              const ganhou = res > 0
              return (
                <div key={i} style={{
                  background: '#0f1520',
                  border: '1px solid #1c2538',
                  borderLeft: `4px solid ${ganhou ? '#00a63c' : '#e53555'}`,
                  borderRadius: 10,
                  padding: '0.9rem 1.2rem',
                  display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                }}>
                  <div>
                    <TickerLink ticker={op.ticker} style={{ fontWeight: 700, fontFamily: 'var(--mono)' }} />
                    <span style={{ color: '#4d5f7a', fontSize: '0.78rem', marginLeft: '0.75rem' }}>
                      {op.data_entrada} → {op.data_saida}
                    </span>
                    <span style={{ color: '#4d5f7a', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                      ({op.motivo_saida === 'alvo' ? 'alvo atingido' : 'stop atingido'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', alignItems: 'center' }}>
                    <span style={{ color: '#4d5f7a' }}>R$ {op.preco_entrada} → R$ {op.preco_saida}</span>
                    <span style={{ color: corRes(res), fontWeight: 800, fontSize: '1rem' }}>
                      {res > 0 ? '+' : ''}{res}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
