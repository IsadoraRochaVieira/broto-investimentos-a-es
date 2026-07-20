'use client'
import { useState, useEffect } from 'react'
import TickerLink from '@/components/TickerLink'
import Bloqueio from '@/components/Bloqueio'
import { useAuth } from '@/contexts/AuthContext'

type Sugestao = {
  rank: number
  ticker: string
  acao: 'COMPRAR' | 'OBSERVAR' | 'EVITAR'
  preco: string
  entrada: string | null
  stop: string | null
  alvo: string | null
  rsi: number
  score: number
  porque: string
}

type Dia = {
  data: string
  data_iso: string
  dia_semana: string
  macro_resumo: string
  semaforo: string
  sugestoes: Sugestao[]
}

type PrecoVivo = Record<string, { preco: number; var: number; loading: boolean }>

const BRAPI_TOKEN = 'wWjyqivfUbeVVe9jLzP6pB'

const COR = {
  COMPRAR: { text: '#00a63c', bg: 'rgba(0,166,60,0.10)',   border: '#00a63c', label: 'Comprar' },
  OBSERVAR: { text: '#d4920a', bg: 'rgba(212,146,10,0.10)', border: '#d4920a', label: 'Observar' },
  EVITAR:   { text: '#e53555', bg: 'rgba(229,53,85,0.10)',  border: '#e53555', label: 'Evitar'   },
} as const

const SEM = {
  verde:    { dot: '#00a63c', label: 'Verde — Operar normal'     },
  amarelo:  { dot: '#d4920a', label: 'Amarelo — Reduzir tamanho' },
  vermelho: { dot: '#e53555', label: 'Vermelho — Só caixa'       },
} as const

function rr(entrada: string | null, stop: string | null, alvo: string | null) {
  if (!entrada || !stop || !alvo) return null
  const e = parseFloat(entrada), s = parseFloat(stop), a = parseFloat(alvo)
  if (e - s <= 0) return null
  return ((a - e) / (e - s)).toFixed(1)
}

function RsiBar({ val }: { val: number }) {
  const cor = val < 30 ? '#00a63c' : val > 70 ? '#e53555' : '#5b9bff'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ height: 3, background: '#1c2538', borderRadius: 2, width: '100%' }}>
        <div style={{ height: 3, width: `${Math.min(val, 100)}%`, background: cor, borderRadius: 2 }}/>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: cor, fontWeight: 600 }}>{val}</span>
    </div>
  )
}

function ScoreBar({ val }: { val: number }) {
  const cor = val >= 60 ? '#00a63c' : val >= 40 ? '#d4920a' : '#e53555'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ height: 4, background: '#1c2538', borderRadius: 2, width: '100%' }}>
        <div style={{ height: 4, width: `${val}%`, background: cor, borderRadius: 2 }}/>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: cor, fontWeight: 600 }}>{val}</span>
    </div>
  )
}

function PrecoAtual({ ticker, dados }: { ticker: string; dados: PrecoVivo }) {
  const d = dados[ticker]
  if (!d || (!d.loading && d.preco <= 0)) return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>—</span>
  if (d.loading) return <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>…</span>

  const varCor = d.var >= 0 ? '#00a63c' : '#e53555'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
        R$ {d.preco.toFixed(2)}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: varCor }}>
        {d.var >= 0 ? '+' : ''}{d.var.toFixed(2)}%
      </span>
    </div>
  )
}

export default function SugestoesClient({ dias, comDebate = [] }: { dias: Dia[]; comDebate?: string[] }) {
  const { assinante } = useAuth()
  const [diaIdx, setDiaIdx] = useState(0)
  const [filtro, setFiltro] = useState<'TODOS' | 'COMPRAR' | 'OBSERVAR' | 'EVITAR'>('TODOS')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [precos, setPrecos] = useState<PrecoVivo>({})

  // Busca preços ao vivo de todos os tickers únicos
  useEffect(() => {
    const tickers = [...new Set(dias.flatMap(d => d.sugestoes.map(s => s.ticker)))]
    if (!tickers.length) return

    // Marca como carregando
    const loading: PrecoVivo = {}
    tickers.forEach(t => { loading[t] = { preco: 0, var: 0, loading: true } })
    setPrecos(loading)

    // Busca individual: a brapi sem token libera só alguns tickers,
    // e um ticker bloqueado num lote derruba a requisição inteira.
    let ativo = true
    tickers.forEach(t => {
      fetch(`https://brapi.dev/api/quote/${t}?fundamental=false&token=${BRAPI_TOKEN}`)
        .then(r => r.json())
        .then(data => {
          if (!ativo) return
          const item = data.results?.[0]
          setPrecos(prev => ({
            ...prev,
            [t]: item?.regularMarketPrice
              ? { preco: item.regularMarketPrice, var: item.regularMarketChangePercent ?? 0, loading: false }
              : { preco: 0, var: 0, loading: false },
          }))
        })
        .catch(() => {
          if (!ativo) return
          setPrecos(prev => ({ ...prev, [t]: { preco: 0, var: 0, loading: false } }))
        })
    })
    return () => { ativo = false }
  }, [dias])

  if (!dias.length) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
      Nenhuma sugestão. Rode o script para gerar.
    </div>
  )

  const dia = dias[diaIdx]
  const sem = SEM[dia.semaforo as keyof typeof SEM] ?? SEM.verde
  const lista = filtro === 'TODOS' ? dia.sugestoes : dia.sugestoes.filter(s => s.acao === filtro)

  const contagem = {
    COMPRAR: dia.sugestoes.filter(s => s.acao === 'COMPRAR').length,
    OBSERVAR: dia.sugestoes.filter(s => s.acao === 'OBSERVAR').length,
    EVITAR: dia.sugestoes.filter(s => s.acao === 'EVITAR').length,
  }

  const temPrecos = Object.keys(precos).length > 0
  const cols = temPrecos
    ? '32px 72px 80px 82px 96px 96px 96px 56px 56px 28px'
    : '32px 72px 82px 96px 96px 96px 56px 56px 28px'
  const headers = temPrecos
    ? ['#', 'Ticker', 'Atual ↗', 'Ação', 'Entrada', 'Stop', 'Alvo', 'RSI', 'Score', '']
    : ['#', 'Ticker', 'Ação', 'Entrada', 'Stop', 'Alvo', 'RSI', 'Score', '']

  return (
    <div>
      {/* Seletor de dia */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {dias.map((d, i) => (
          <button key={d.data_iso} onClick={() => { setDiaIdx(i); setExpandido(null); setFiltro('TODOS') }} style={{
            padding: '6px 12px', borderRadius: 8,
            border: `1px solid ${i === diaIdx ? 'rgba(91,155,255,0.35)' : 'var(--border)'}`,
            background: i === diaIdx ? 'rgba(16,82,204,0.15)' : 'var(--surface)',
            color: i === diaIdx ? 'var(--blue-light)' : 'var(--muted)',
            fontSize: 12, fontWeight: i === diaIdx ? 700 : 400, cursor: 'pointer',
          }}>
            <span style={{ display: 'block', fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{d.dia_semana.split('-')[0]}</span>
            {d.data}
          </button>
        ))}
      </div>

      {/* Header do dia */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '14px 18px', marginBottom: 12,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.55, margin: 0, flex: 1 }}>{dia.macro_resumo}</p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          background: `${sem.dot}12`, border: `1px solid ${sem.dot}40`,
          borderRadius: 8, padding: '6px 12px',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: sem.dot }}/>
          <span style={{ fontSize: 12, color: sem.dot, fontWeight: 600 }}>{sem.label}</span>
        </div>
      </div>

      {/* Badge fonte de dados */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(0,166,60,0.08)', border: '1px solid rgba(0,166,60,0.25)',
          borderRadius: 6, padding: '3px 8px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00a63c', animation: 'pulse 2s infinite' }}/>
          <span style={{ fontSize: 10, color: '#00a63c', fontFamily: 'var(--mono)', fontWeight: 600 }}>
            PREÇO AO VIVO · brapi.dev
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Sugestão de entrada baseada em fechamento D-1</span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFiltro('TODOS')} style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${filtro === 'TODOS' ? 'var(--border2)' : 'var(--border)'}`,
          background: filtro === 'TODOS' ? 'var(--surface2)' : 'transparent',
          color: filtro === 'TODOS' ? 'var(--text)' : 'var(--muted)',
          fontWeight: filtro === 'TODOS' ? 600 : 400,
        }}>Todas ({dia.sugestoes.length})</button>

        {(['COMPRAR', 'OBSERVAR', 'EVITAR'] as const).map(f => {
          const c = COR[f]
          const ativo = filtro === f
          return (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${ativo ? c.border + '50' : 'var(--border)'}`,
              background: ativo ? c.bg : 'transparent',
              color: ativo ? c.text : 'var(--muted)',
              fontWeight: ativo ? 600 : 400,
            }}>
              ● {f.charAt(0) + f.slice(1).toLowerCase()} ({contagem[f]})
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{lista.length} itens</span>
      </div>

      {/* Tabela — o dia mais recente é exclusivo para assinantes */}
      <Bloqueio
        liberado={assinante || diaIdx > 0}
        titulo="As sugestões de hoje são para assinantes"
        descricao="Os dias anteriores continuam gratuitos — use as abas acima para navegar. As sugestões frescas do dia, com entrada, stop e alvo, ficam no plano Caryo Map."
      >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Cabeçalho */}
        <div className="sug-head" style={{
          display: 'grid', gridTemplateColumns: cols,
          padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: 8,
        }}>
          {headers.map(h => (
            <span key={h} style={{ fontSize: 10, color: h === 'Atual ↗' ? '#00a63c' : 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {lista.map((s) => {
          const c = COR[s.acao] ?? COR.OBSERVAR
          const ratio = rr(s.entrada, s.stop, s.alvo)
          const key = `${dia.data_iso}-${s.ticker}`
          const aberto = expandido === key
          const vivo = precos[s.ticker]

          // Destaque de linha se preço atual <= entrada (oportunidade)
          let rowHighlight = 'none'
          if (vivo && !vivo.loading && vivo.preco > 0 && s.entrada && s.acao === 'COMPRAR') {
            if (vivo.preco <= parseFloat(s.entrada)) rowHighlight = 'rgba(0,166,60,0.04)'
          }

          return (
            <div key={key} style={{ borderBottom: '1px solid var(--border)', background: rowHighlight }}>
              <button className="sug-row" onClick={() => setExpandido(aberto ? null : key)} style={{
                width: '100%', background: aberto ? 'rgba(16,82,204,0.05)' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                display: 'grid', gridTemplateColumns: cols,
                padding: '11px 14px', gap: 8, alignItems: 'center',
              }}>
                <span className="sug-rank" style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', fontWeight: 500 }}>
                  {String(s.rank).padStart(2, '0')}
                </span>

                <span className="sug-ticker" style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  <TickerLink ticker={s.ticker} style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}/>
                </span>

                {temPrecos && (
                  <span className="sug-cell" data-l="Atual"><PrecoAtual ticker={s.ticker} dados={precos} /></span>
                )}

                <span className="sug-acao">
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: c.text,
                    background: c.bg, border: `1px solid ${c.border}40`,
                    borderRadius: 4, padding: '2px 7px',
                  }}>{c.label}</span>
                </span>

                <span className="sug-cell" data-l="Entrada" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
                  {s.entrada ? `R$ ${s.entrada}` : '—'}
                </span>

                <span className="sug-cell" data-l="Stop" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: s.stop ? 'var(--red)' : 'var(--muted)' }}>
                  {s.stop ? `R$ ${s.stop}` : '—'}
                </span>

                <span className="sug-cell" data-l="Alvo" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: s.alvo ? 'var(--green)' : 'var(--muted)' }}>
                  {s.alvo ? `R$ ${s.alvo}` : '—'}
                </span>

                <span className="sug-cell" data-l="RSI"><RsiBar val={s.rsi} /></span>
                <span className="sug-cell" data-l="Score"><ScoreBar val={s.score} /></span>

                <span className="sug-chevron" style={{ fontSize: 11, color: 'var(--muted)', transform: aberto ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {/* Expandido */}
              {aberto && (
                <div style={{ padding: '12px 14px 16px', borderTop: `1px solid ${c.border}20`, background: 'rgba(8,12,18,0.5)' }}>
                  <div style={{ fontSize: 10, color: c.text, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>
                    Por que {s.acao.toLowerCase()} <TickerLink ticker={s.ticker} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}/>?
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65, margin: 0, marginBottom: ratio ? 12 : 0 }}>{s.porque}</p>

                  {ratio && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {[
                        { l: 'R:R', v: `1:${ratio}`, c: parseFloat(ratio) >= 2 ? 'var(--green)' : 'var(--muted)' },
                        { l: 'Entrada', v: `R$ ${s.entrada}`, c: 'var(--text)' },
                        { l: 'Stop', v: `R$ ${s.stop}`, c: 'var(--red)' },
                        { l: 'Alvo', v: `R$ ${s.alvo}`, c: 'var(--green)' },
                        ...(vivo && !vivo.loading && vivo.preco > 0 ? [{ l: 'Preço Agora', v: `R$ ${vivo.preco.toFixed(2)}`, c: '#5b9bff' }] : []),
                      ].map(m => (
                        <div key={m.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{m.l}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: m.c }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {comDebate.includes(s.ticker) && (
                    <a href={`/comite?t=${s.ticker}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14,
                      background: 'var(--gold-bg)', border: '1px solid rgba(212,146,10,0.35)',
                      color: 'var(--gold-bright)', borderRadius: 8, padding: '7px 13px',
                      fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
                    }}>
                      🪙 Ver o debate da Mesa sobre {s.ticker} →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </Bloqueio>

      <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: '1.5rem', textAlign: 'center', fontFamily: 'var(--mono)' }}>
        Clique no ticker para pesquisar no Google · Clique na linha para ver o motivo · Não é recomendação de investimento
      </p>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Mobile-first — proposta do Diego: no celular a tabela vira card empilhado.
           A grade de 10 colunas é ilegível em 375px. */
        @media (max-width: 760px) {
          .sug-head { display: none !important; }

          .sug-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px 10px !important;
            padding: 14px !important;
            align-items: start !important;
          }
          .sug-rank { display: none !important; }
          .sug-ticker {
            grid-column: 1 / -1;
            font-size: 19px !important;
            display: flex; align-items: center; gap: 10px;
          }
          .sug-acao { grid-column: 1 / -1; margin-top: -6px; }

          /* cada dado ganha seu rótulo, já que o cabeçalho sumiu */
          .sug-cell::before {
            content: attr(data-l);
            display: block;
            font-size: 9px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.07em;
            font-weight: 700;
            margin-bottom: 3px;
          }
          .sug-cell { font-size: 13.5px !important; }

          .sug-chevron {
            position: absolute; right: 14px; top: 16px;
          }
          .sug-row { position: relative; }
        }
      `}</style>
    </div>
  )
}
