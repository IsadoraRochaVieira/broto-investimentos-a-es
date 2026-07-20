'use client'
import { useState, useMemo } from 'react'

type Acao = {
  ticker: string; preco: number | null; var_1d: number | null; var_20d: number | null
  rsi: number | null; score: number; classificacao: string; setor: string; volume: number
}
export type Mapa = { data_iso: string; gerado_em: string; total: number; acoes: Acao[] }

type Modo = 'score' | 'var20'

/* Cor por oportunidade (score) — dourado/verde dominante, sem neon poluído */
function corScore(s: number) {
  if (s >= 60) return { bg: 'rgba(212,146,10,0.20)', bd: 'rgba(240,180,41,0.5)', tx: '#f0b429' }
  if (s >= 40) return { bg: 'rgba(0,166,60,0.16)', bd: 'rgba(0,166,60,0.45)', tx: '#34d17e' }
  if (s >= 20) return { bg: 'rgba(45,58,79,0.35)', bd: 'rgba(45,58,79,0.7)', tx: '#8a9bbf' }
  return { bg: 'rgba(229,53,85,0.10)', bd: 'rgba(229,53,85,0.30)', tx: '#e5758a' }
}

/* Cor por variação de 20 dias — divergente verde/vermelho */
function corVar(v: number | null) {
  if (v === null) return { bg: 'rgba(45,58,79,0.30)', bd: 'rgba(45,58,79,0.6)', tx: '#8a9bbf' }
  const mag = Math.min(Math.abs(v) / 15, 1)
  if (v >= 0) return { bg: `rgba(0,166,60,${0.10 + mag * 0.32})`, bd: 'rgba(0,166,60,0.45)', tx: '#34d17e' }
  return { bg: `rgba(229,53,85,${0.08 + mag * 0.30})`, bd: 'rgba(229,53,85,0.4)', tx: '#e5758a' }
}

export default function MapaClient({ mapa, comDebate = [] }: { mapa: Mapa; comDebate?: string[] }) {
  const [modo, setModo] = useState<Modo>('score')
  const [busca, setBusca] = useState('')
  const [soOportunidade, setSoOportunidade] = useState(false)

  const oportunidades = mapa.acoes.filter(a => a.score >= 40).length
  const evitar = mapa.acoes.filter(a => a.score < 20).length

  const setores = useMemo(() => {
    const q = busca.trim().toUpperCase()
    const filtradas = mapa.acoes.filter(a => {
      if (soOportunidade && a.score < 40) return false
      if (q && !a.ticker.includes(q) && !a.setor.toUpperCase().includes(q)) return false
      return true
    })
    const grupos: Record<string, Acao[]> = {}
    for (const a of filtradas) (grupos[a.setor] ??= []).push(a)
    // ordena setores pelo melhor score interno; ações já vêm por score desc
    return Object.entries(grupos).sort((a, b) => {
      const ma = Math.max(...a[1].map(x => x.score))
      const mb = Math.max(...b[1].map(x => x.score))
      return mb - ma || b[1].length - a[1].length
    })
  }, [mapa.acoes, busca, soOportunidade])

  const totalVis = setores.reduce((n, s) => n + s[1].length, 0)

  return (
    <div>
      {/* Resumo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { l: 'ações no radar', v: mapa.total, c: 'var(--text)' },
          { l: 'oportunidades (score ≥ 40)', v: oportunidades, c: '#34d17e' },
          { l: 'para evitar', v: evitar, c: '#e5758a' },
          { l: 'setores', v: new Set(mapa.acoes.map(a => a.setor)).size, c: 'var(--gold-bright)' },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {([['score', 'Oportunidade'], ['var20', 'Variação 20d']] as [Modo, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setModo(m)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              fontWeight: modo === m ? 700 : 400,
              background: modo === m ? 'var(--surface2)' : 'transparent',
              color: modo === m ? 'var(--text)' : 'var(--muted)',
            }}>{label}</button>
          ))}
        </div>

        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar ticker ou setor…"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', minWidth: 180 }}
        />

        <button onClick={() => setSoOportunidade(v => !v)} style={{
          padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
          border: `1px solid ${soOportunidade ? 'rgba(0,166,60,0.5)' : 'var(--border)'}`,
          background: soOportunidade ? 'rgba(0,166,60,0.12)' : 'var(--surface)',
          color: soOportunidade ? '#34d17e' : 'var(--muted)', fontWeight: soOportunidade ? 600 : 400,
        }}>● Só oportunidades</button>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{totalVis} exibidas · atualizado {mapa.gerado_em}</span>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 11, color: 'var(--muted)' }}>
        {modo === 'score'
          ? [['#f0b429', 'Forte (≥60)'], ['#34d17e', 'Oportunidade (≥40)'], ['#8a9bbf', 'Neutro'], ['#e5758a', 'Evitar (<20)']].map(([c, l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: c as string }} />{l}</span>
            ))
          : [['#34d17e', 'Alta em 20d'], ['#e5758a', 'Queda em 20d']].map(([c, l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: c as string }} />{l}</span>
            ))}
      </div>

      {/* Matriz por setor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {setores.map(([setor, acoes]) => (
          <div key={setor}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{setor}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{acoes.length}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {acoes.map(a => {
                const cor = modo === 'score' ? corScore(a.score) : corVar(a.var_20d)
                const temDebate = comDebate.includes(a.ticker)
                const valor = modo === 'score' ? a.score : (a.var_20d === null ? '—' : `${a.var_20d > 0 ? '+' : ''}${a.var_20d.toFixed(1)}%`)
                const href = temDebate ? `/comite?t=${a.ticker}` : `https://www.google.com/search?q=${a.ticker}+ação+B3+cotação`
                return (
                  <a
                    key={a.ticker}
                    href={href}
                    target={temDebate ? undefined : '_blank'}
                    rel={temDebate ? undefined : 'noopener noreferrer'}
                    title={`${a.ticker} · ${a.classificacao} · score ${a.score} · RSI ${a.rsi ?? '—'} · R$ ${a.preco ?? '—'}${temDebate ? ' · debate da Mesa disponível' : ''}`}
                    className="mapa-tile"
                    style={{
                      width: 82, minHeight: 50, padding: '7px 8px', borderRadius: 7,
                      background: cor.bg, border: `1px solid ${cor.bd}`,
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      textDecoration: 'none', position: 'relative',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{a.ticker}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: cor.tx }}>{valor}</span>
                    {temDebate && <span style={{ position: 'absolute', top: 5, right: 6, fontSize: 9 }}>🪙</span>}
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 26, textAlign: 'center', fontFamily: 'var(--mono)' }}>
        🪙 = debate da Mesa disponível · clique numa ação para abrir · Não é recomendação de investimento
      </p>

      <style>{`
        /* Hover magnético — proposta do Léo (microinterações):
           o quadradinho é atraído ao cursor e ganha o brilho dourado da marca. */
        .mapa-tile { transition: transform .12s cubic-bezier(.22,1,.36,1), box-shadow .12s ease, filter .12s ease, border-color .12s ease; will-change: transform; }
        .mapa-tile:hover {
          transform: translateY(-3px) scale(1.14);
          filter: brightness(1.3);
          border-color: rgba(240,180,41,.75);
          box-shadow: 0 8px 22px rgba(0,0,0,.55), 0 0 18px rgba(240,180,41,.35);
          z-index: 3;
        }
        /* vizinhos cedem espaço de leve, reforçando a sensação magnética */
        .mapa-tile:hover + .mapa-tile { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .mapa-tile, .mapa-tile:hover, .mapa-tile:hover + .mapa-tile { transform: none; transition: none; }
        }
      `}</style>
    </div>
  )
}
