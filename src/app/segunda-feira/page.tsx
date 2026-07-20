import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'
import TickerLink from '@/components/TickerLink'

function getUltimo() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'backtest_historico.json').sort((a, b) => b.localeCompare(a))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'))
}

const corSemaforo: Record<string, { bg: string; border: string; text: string; label: string; desc: string }> = {
  verde:    { bg: '#34d17e18', border: '#00a63c', text: '#34d17e', label: 'Operar normal',    desc: 'Ambiente favorável. Siga o plano completo.' },
  amarelo:  { bg: '#f0b42918', border: '#d4920a', text: '#f0b429', label: 'Reduzir tamanho',  desc: 'Volatilidade elevada. Use 50% do capital normal.' },
  vermelho: { bg: '#e5355518', border: '#b02a45', text: '#e53555', label: 'Só caixa',          desc: 'Mercado estressado. Aguarde clareza.' },
}

export default function SegundaFeiraPage() {
  const r = getUltimo()
  const m = r?.macro
  const semaforo = r?.semaforo ?? 'verde'
  const s = corSemaforo[semaforo] ?? corSemaforo.verde
  const picks = (r?.candidatos ?? []).filter((c: any) => c.score >= 40 && c.acao !== 'EVITAR').slice(0, 2)
  const pick_semana = r?.pick_semana ?? picks[0] ?? null
  const checklist = [
    'Stop loss definido antes de entrar?',
    'Tamanho da posição respeitando 40% máximo por ativo?',
    'Contexto macro favorável (semáforo verde ou amarelo)?',
    'Tese de investimento clara em 1 frase?',
    'Calendário de eventos da semana verificado?',
  ]

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="segunda" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em' }}>Briefing de Segunda-feira</h1>
          <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.25rem' }}>{r?.data ?? '—'} · Plano da semana em 30 segundos</p>
        </div>
        {/* Semáforo */}
        <div style={{ background: s.bg, border: `2px solid ${s.border}`, borderRadius: 12, padding: '0.9rem 1.4rem', textAlign: 'center', minWidth: 160 }}>
          <div style={{ fontSize: '0.65rem', color: s.text, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Semáforo semanal</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.text }}>{s.label}</div>
          <div style={{ fontSize: '0.72rem', color: s.text, opacity: 0.8, marginTop: 4 }}>{s.desc}</div>
        </div>
      </div>

      {/* Pick da Semana */}
      {pick_semana && (
        <div style={{ background: 'linear-gradient(135deg, #0f1520, #0a0e14)', border: '2px solid #d4920a', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: '#d4920a10' }}/>
          <div style={{ fontSize: '0.65rem', color: '#d4920a', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>
            ★ Pick da semana · Pequi Estúdio
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                <TickerLink ticker={pick_semana.ticker} style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--mono)' }} />
              </div>
              <div style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: 2 }}>{pick_semana.nome}</div>
              {pick_semana.tese && <p style={{ color: '#8a9bbf', fontSize: '0.88rem', marginTop: 8, maxWidth: 400, lineHeight: 1.6 }}>{pick_semana.tese}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', minWidth: 200 }}>
              {[
                { l: 'Score', v: `${pick_semana.score}/100`, c: '#d4920a' },
                { l: 'RSI', v: pick_semana.rsi ?? '-', c: '#e8edf5' },
                { l: 'Entrada', v: pick_semana.entrada ? `R$ ${pick_semana.entrada}` : '-', c: '#34d17e' },
                { l: 'Stop', v: pick_semana.stop ? `R$ ${pick_semana.stop}` : '-', c: '#e53555' },
                { l: 'Alvo', v: pick_semana.alvo ? `R$ ${pick_semana.alvo}` : '-', c: '#34d17e' },
                { l: 'ATR', v: pick_semana.atr ? `${pick_semana.atr}%` : '-', c: '#f0b429' },
              ].map(i => (
                <div key={i.l} style={{ background: '#ffffff08', borderRadius: 8, padding: '0.5rem 0.7rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{i.l}</div>
                  <div style={{ color: i.c, fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>{i.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2 picks da semana */}
      {picks.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            Candidatos da semana
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {picks.map((c: any) => (
              <div key={c.ticker} style={{ background: '#0f1520', border: '1px solid #1c2538', borderLeft: '4px solid #00a63c', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <TickerLink ticker={c.ticker} style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--mono)' }} />
                  <span style={{ color: '#34d17e', fontWeight: 700 }}>{c.score}pts</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#4d5f7a' }}>Entrada: <strong style={{ color: '#e8edf5' }}>R$ {c.entrada ?? c.preco}</strong></span>
                  <span style={{ color: '#4d5f7a' }}>Stop: <strong style={{ color: '#e53555' }}>R$ {c.stop ?? '-'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card ações rápidas */}
      <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
          <i className="ti ti-zap" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true"/>
          3 ações para fazer agora
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {picks[0] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#00a63c18', border: '1px solid #00a63c40', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d17e', minWidth: 24 }}>1</span>
              <span style={{ color: '#e8edf5', fontSize: '0.88rem' }}>
                <strong>Comprar {picks[0].ticker}</strong> com entrada em R$ {picks[0].entrada ?? picks[0].preco} · Stop R$ {picks[0].stop ?? '—'}
              </span>
            </div>
          )}
          {picks[1] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#d4920a15', border: '1px solid #d4920a40', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4920a', minWidth: 24 }}>2</span>
              <span style={{ color: '#e8edf5', fontSize: '0.88rem' }}>
                <strong>Monitorar {picks[1].ticker}</strong> — aguardar RSI confirmar abaixo de 35 antes de entrar
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff08', border: '1px solid #1c2538', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4d5f7a', minWidth: 24 }}>3</span>
            <span style={{ color: '#8a9bbf', fontSize: '0.88rem' }}>
              Manter <strong style={{ color: '#e8edf5' }}>R$ 1.500</strong> em caixa livre. Não alocar tudo de uma vez.
            </span>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
          <i className="ti ti-checklist" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true"/>
          Checklist pré-trade — responda antes de entrar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {checklist.map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #1c2538' }}>
              <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#00a63c', cursor: 'pointer' }} />
              <span style={{ color: '#8a9bbf', fontSize: '0.88rem' }}>{item}</span>
            </label>
          ))}
        </div>
        <p style={{ color: '#4d5f7a', fontSize: '0.75rem', marginTop: '0.9rem', borderTop: '1px solid #1c2538', paddingTop: '0.75rem' }}>
          Só entre na posição com todos os 5 itens marcados. Disciplina é o diferencial.
        </p>
      </div>
    </main>
  )
}
