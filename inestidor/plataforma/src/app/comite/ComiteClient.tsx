'use client'
import { useState, useEffect } from 'react'
import TickerLink from '@/components/TickerLink'
import Bloqueio from '@/components/Bloqueio'
import { useAuth } from '@/contexts/AuthContext'

type Analista = {
  id: string; nome: string; emoji: string
  postura: 'COMPRAR' | 'OBSERVAR' | 'EVITAR' | 'ABSTENHO'
  resumo: string; argumentos: string[]; riscos: string[]
}
export type Comite = {
  ticker: string; empresa: string; setor: string; preco: number | string; data: string
  dossie: Record<string, string | number>
  analistas: Analista[]
  sintese: {
    veredito: 'COMPRAR' | 'OBSERVAR' | 'EVITAR'
    placar: Record<string, number>
    texto: string; gatilho: string
    entrada_ref: string | null; stop_ref: string | null; alvo_ref: string | null
  }
  verificacao?: { conferido: boolean; ok: boolean | null; alertas: string[]; conferido_em?: string }
  fontes?: string[]
}

const POST = {
  COMPRAR:  { cor: '#00a63c', bg: 'rgba(0,166,60,0.12)',   label: 'Comprar' },
  OBSERVAR: { cor: '#d4920a', bg: 'rgba(212,146,10,0.12)', label: 'Observar' },
  EVITAR:   { cor: '#e53555', bg: 'rgba(229,53,85,0.12)',  label: 'Evitar' },
  ABSTENHO: { cor: '#8a9bbf', bg: 'rgba(138,155,191,0.10)', label: 'Abstém-se' },
} as const

const DOSSIE_LABELS: Record<string, string> = {
  rsi: 'RSI', macd_hist: 'MACD', bb_pct: 'Bollinger %B', vol_ratio: 'Volume',
  atr_pct: 'ATR', dist_max52: 'Da máx. 52s', pl: 'P/L', pvp: 'P/VP', roe: 'ROE',
  var_20d: 'Var 20d', score: 'Score',
}

type Fund = {
  ticker: string; empresa: string; exercicio: number; fonte: string
  receita: number | null; receita_cresc: number | null
  lucro: number | null; lucro_cresc: number | null
  margem_liquida: number | null; patrimonio_liquido: number | null; roe: number | null
  leitura: string | null
}

function bi(v: number | null) {
  if (v === null || v === undefined) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `R$ ${(v / 1e9).toFixed(1)} bi`
  if (abs >= 1e6) return `R$ ${(v / 1e6).toFixed(0)} mi`
  return `R$ ${v.toFixed(0)}`
}

function RaioXCVM({ f }: { f: Fund }) {
  const financeira = f.margem_liquida === null || f.receita === null
  const cresc = (v: number | null) => {
    if (v === null) return null
    const cor = v >= 0 ? '#34d17e' : '#e5758a'
    return <span style={{ color: cor, fontSize: 11, fontFamily: 'var(--mono)', marginLeft: 6 }}>{v >= 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%</span>
  }
  const metricas = [
    { l: 'Receita líquida', v: bi(f.receita), extra: cresc(f.receita_cresc), hide: f.receita === null },
    { l: 'Lucro líquido', v: bi(f.lucro), extra: cresc(f.lucro_cresc), hide: f.lucro === null },
    { l: 'Margem líquida', v: f.margem_liquida !== null ? `${f.margem_liquida}%` : '—', hide: financeira },
    { l: 'ROE', v: f.roe !== null ? `${f.roe}%` : '—', hide: f.roe === null },
    { l: 'Patrimônio líquido', v: bi(f.patrimonio_liquido), hide: f.patrimonio_liquido === null },
  ].filter(m => !m.hide)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid #5b9bff', borderRadius: 14, padding: '1.3rem 1.5rem', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>Raio-X fundamentalista</span>
        <span style={{ background: 'rgba(91,155,255,0.14)', color: '#5b9bff', border: '1px solid rgba(91,155,255,0.35)', borderRadius: 6, padding: '2px 9px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)' }}>
          ✔ DADOS OFICIAIS CVM · {f.exercicio}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: financeira || f.leitura ? 14 : 0 }}>
        {metricas.map(m => (
          <div key={m.l} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
            <div style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.l}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.v}{m.extra}</div>
          </div>
        ))}
      </div>

      {financeira && (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: f.leitura ? 12 : 0 }}>
          ⓘ Instituição financeira — receita e margem seguem plano de contas próprio e não são comparáveis a empresas não-financeiras.
        </div>
      )}

      {f.leitura && (
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {f.leitura}
        </p>
      )}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, fontFamily: 'var(--mono)' }}>Fonte: {f.fonte}</div>
    </div>
  )
}

export default function ComiteClient({ comites, fundamentos = {} }: { comites: Comite[]; fundamentos?: Record<string, Fund> }) {
  const { assinante } = useAuth()
  const [idx, setIdx] = useState(0)

  // Abre direto na ação passada por ?t=TICKER (vindo das sugestões)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t')
    if (!t) return
    const i = comites.findIndex(cm => cm.ticker.toUpperCase() === t.toUpperCase())
    if (i >= 0) setIdx(i)
  }, [comites])

  const c = comites[idx]
  const v = POST[c.sintese.veredito]

  return (
    <>
      {/* Seletor de ações debatidas */}
      {comites.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {comites.map((cm, i) => {
            const vv = POST[cm.sintese.veredito]
            return (
              <button key={cm.ticker} onClick={() => setIdx(i)} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '7px 13px', borderRadius: 9,
                border: `1px solid ${i === idx ? vv.cor + '80' : 'var(--border)'}`,
                background: i === idx ? vv.bg : 'var(--surface)',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: i === idx ? 'var(--text)' : 'var(--text2)' }}>{cm.ticker}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: vv.cor }} />
              </button>
            )
          })}
        </div>
      )}

      {/* Cabeçalho da ação */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.4rem 1.6rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
            <TickerLink ticker={c.ticker} style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800 }} />
          </div>
          {c.empresa && <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{c.empresa}</div>}
          {c.setor && <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{c.setor}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>R$ {String(c.preco).replace('.', ',')}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>fechamento · {c.data}</div>
        </div>
      </div>

      {/* Dossiê */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
        {Object.entries(DOSSIE_LABELS).map(([k, label]) => {
          const val = c.dossie[k]
          if (val === undefined) return null
          return (
            <div key={k} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 11px' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{String(val)}</span>
            </div>
          )
        })}
      </div>

      <Bloqueio
        liberado={assinante}
        titulo="Debate completo da Mesa"
        descricao="O veredito, os argumentos dos 7 analistas e o Raio-X Fundamentalista da CVM ficam liberados para assinantes. O dossiê técnico acima é gratuito."
      >
      {/* Raio-X fundamentalista (CVM) */}
      {fundamentos[c.ticker] && <RaioXCVM f={fundamentos[c.ticker]} />}

      {/* Veredito */}
      <div style={{ background: `linear-gradient(135deg, ${v.bg}, transparent)`, border: `1px solid ${v.cor}40`, borderLeft: `4px solid ${v.cor}`, borderRadius: 14, padding: '1.6rem', marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>Sumário executivo do debate</span>
          {c.verificacao?.conferido && c.verificacao.ok && (
            <span title="Uma segunda IA conferiu que os números citados batem com o dossiê-fonte." style={{ background: 'rgba(0,166,60,0.12)', color: '#34d17e', border: '1px solid rgba(0,166,60,0.4)', borderRadius: 6, padding: '3px 9px', fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)' }}>
              ✓ Números conferidos
            </span>
          )}
          <span style={{ marginLeft: 'auto', background: v.bg, color: v.cor, border: `1px solid ${v.cor}60`, borderRadius: 8, padding: '5px 14px', fontWeight: 800, fontSize: 15 }}>Veredito: {v.label}</span>
        </div>
        {c.verificacao?.conferido && !c.verificacao.ok && c.verificacao.alertas.length > 0 && (
          <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(212,146,10,0.35)', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12.5, color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--gold-bright)' }}>⚠ Verificação:</strong> {c.verificacao.alertas.join(' · ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { k: 'comprar', c: '#00a63c', l: 'compram' },
            { k: 'observar', c: '#d4920a', l: 'observam' },
            { k: 'evitar', c: '#e53555', l: 'evitam' },
            { k: 'abstencao', c: '#8a9bbf', l: 'abstêm-se' },
          ].map(p => {
            const n = c.sintese.placar[p.k] ?? 0
            if (!n) return null
            return (
              <div key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 11px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800, color: p.c }}>{n}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.l}</span>
              </div>
            )
          })}
        </div>

        <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{c.sintese.texto}</p>

        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>Gatilho para reavaliar</div>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{c.sintese.gatilho}</p>
          {(c.sintese.entrada_ref || c.sintese.stop_ref || c.sintese.alvo_ref) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {[
                { l: 'Entrada', v: c.sintese.entrada_ref, cor: 'var(--text)' },
                { l: 'Stop', v: c.sintese.stop_ref, cor: 'var(--red)' },
                { l: 'Alvo', v: c.sintese.alvo_ref, cor: 'var(--green)' },
              ].filter(x => x.v).map(x => (
                <div key={x.l} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{x.l}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 700, color: x.cor, marginTop: 2 }}>{x.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analistas */}
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Os argumentos da mesa</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {c.analistas.map(a => {
          const p = POST[a.postura] ?? POST.OBSERVAR
          return (
            <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${p.cor}`, borderRadius: 12, padding: '1.1rem 1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.nome}</div></div>
                <span style={{ background: p.bg, color: p.cor, border: `1px solid ${p.cor}50`, borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{p.label}</span>
              </div>
              <p style={{ color: 'var(--text)', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 12px', fontStyle: 'italic' }}>“{a.resumo}”</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {a.argumentos.map((arg, i) => (
                  <li key={i} style={{ display: 'flex', gap: 7, color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.5 }}>
                    <span style={{ color: p.cor, flexShrink: 0 }}>▸</span>{arg}
                  </li>
                ))}
              </ul>
              {a.riscos.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 5 }}>Espinhos</div>
                  {a.riscos.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 7, color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 3 }}>
                      <span style={{ color: 'var(--red)', flexShrink: 0 }}>△</span>{r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fontes */}
      {c.fontes && c.fontes.length > 0 && (
        <div style={{ marginTop: 26, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>Fontes dos dados</span>
            {c.verificacao?.conferido && c.verificacao.ok && (
              <span style={{ fontSize: 10.5, color: '#34d17e', fontFamily: 'var(--mono)' }}>✓ conferido em {c.verificacao.conferido_em}</span>
            )}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {c.fontes.map((f, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.55 }}>
                <span style={{ color: '#5b9bff', flexShrink: 0 }}>▸</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
      </Bloqueio>

      <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 20, textAlign: 'center', fontFamily: 'var(--mono)' }}>
        Debate gerado pelo Comitê de IA do Caryo Map · Não é recomendação de investimento
      </p>
    </>
  )
}
