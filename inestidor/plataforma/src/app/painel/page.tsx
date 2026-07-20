import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Nav from '@/components/Nav'
import HomeClient from '@/components/HomeClient'

/** Só relatórios de dia: 2026-07-17_manha.json, 2026-07-17.json.
 *  A pasta também guarda comite_*, fundamentos_*, mapa_*, noticias_* e
 *  sugestoes_* — que NÃO são relatórios e não podem entrar na lista. */
const ARQUIVO_RELATORIO = /^\d{4}-\d{2}-\d{2}(_(manha|tarde))?\.json$/

function getRelatorios() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => ARQUIVO_RELATORIO.test(f))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 40)
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
      return { slug: f.replace('.json', ''), ...data }
    })
}

/** Dentro do dia: manhã sempre antes da tarde. */
const ORDEM_TURNO = (t?: string) => (t === 'manha' ? 0 : t === 'tarde' ? 1 : 2)

const semCfg: Record<string, { cor: string; bg: string; label: string }> = {
  verde:    { cor: '#00a63c', bg: 'rgba(0,166,60,0.10)',    label: 'Operar normal'    },
  amarelo:  { cor: '#d4920a', bg: 'rgba(212,146,10,0.10)',  label: 'Reduzir tamanho'  },
  vermelho: { cor: '#e53555', bg: 'rgba(229,53,85,0.10)',   label: 'Só caixa'         },
}

export default function Home() {
  const relatorios = getRelatorios()
  const ultimo = relatorios[0] ?? null
  const hoje = ultimo?.data_iso
  const relatoriosHoje = relatorios.filter((r: any) => r.data_iso === hoje)

  const semaforo = ultimo?.semaforo ?? 'verde'
  const sem = semCfg[semaforo] ?? semCfg.verde
  const pick = ultimo?.pick_semana ?? (ultimo?.candidatos ?? []).find((c: any) => c.acao === 'COMPRAR')
  const m = ultimo?.macro

  const porDia: Record<string, any[]> = {}
  for (const r of relatorios) {
    // o dia vem do nome do arquivo, que é a fonte confiável (data_iso pode faltar nos antigos)
    const k = r.data_iso ?? r.slug.slice(0, 10)
    if (!porDia[k]) porDia[k] = []
    porDia[k].push(r)
  }
  for (const k of Object.keys(porDia)) {
    porDia[k].sort((a, b) => ORDEM_TURNO(a.turno) - ORDEM_TURNO(b.turno))
  }
  const diasOrdenados = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="home" />

      {/* ── HERO ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 12,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 20,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Ibovespa · {ultimo?.data ?? 'hoje'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {m?.ibovespa ?? '—'}
          </div>
          {m?.ibovespa_var !== undefined && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, marginTop: 8,
              color: (m.ibovespa_var ?? 0) >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {(m.ibovespa_var ?? 0) > 0 ? '+' : ''}{m.ibovespa_var}% hoje
            </div>
          )}
        </div>

        {/* Semáforo */}
        <Link href="/segunda-feira" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: sem.bg, border: `1px solid ${sem.cor}30`, borderRadius: 12,
            padding: '16px 24px', minWidth: 130, cursor: 'pointer',
          }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: sem.cor, boxShadow: `0 0 12px ${sem.cor}` }}/>
            <div style={{ fontSize: 13, fontWeight: 700, color: sem.cor }}>Verde</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{sem.label}</div>
          </div>
        </Link>
      </div>

      {/* ── FAIXA MACRO ── */}
      {m && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { l: 'Dólar',    v: `R$ ${m.dolar}`,    c: 'var(--gold)'  },
            { l: 'Brent',    v: `US$ ${m.brent}`,   c: 'var(--gold)'  },
            { l: 'Selic',    v: `${m.selic}% a.a.`, c: 'var(--blue-light)' },
            { l: 'VIX',      v: m.vix ?? '—',       c: 'var(--text)'  },
            { l: 'IPCA 12m', v: `${m.ipca_12m}%`,   c: (m.ipca_12m ?? 0) > 4 ? 'var(--red)' : 'var(--green)' },
          ].map(item => (
            <div key={item.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>{item.l}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: item.c }}>{item.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── RELATÓRIOS DE HOJE ── */}
      {relatoriosHoje.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle cor="var(--blue)">Relatórios de hoje — {ultimo?.data}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
            {relatoriosHoje.map((r: any) => {
              const isManha = r.turno === 'manha'
              return (
                <Link key={r.slug} href={`/relatorio/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${isManha ? 'var(--blue)' : 'var(--gold)'}`,
                    borderRadius: 10,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: isManha ? 'var(--blue-light)' : 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      {isManha ? '🌅 Manhã · 08:30' : '☀️ Tarde · 13:00'}
                      <span style={{ float: 'right', color: 'var(--muted)', fontWeight: 400 }}>{r.hora_geracao}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {(r.tops || []).slice(0, 4).map((t: any) => (
                        <span key={t.ticker} style={{
                          background: 'var(--green-bg)', border: '1px solid rgba(0,166,60,0.25)',
                          color: 'var(--green)', borderRadius: 5, padding: '2px 8px',
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
                        }}>
                          {t.ticker}
                        </span>
                      ))}
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>{r.resumo}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PICK DA SEMANA ── */}
      {pick && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle cor="var(--gold)">Pick da semana</SectionTitle>
          <Link href="/segunda-feira" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderLeft: '3px solid var(--gold)', borderRadius: 10,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 22, color: 'var(--gold)' }}>★</span>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                  {pick.ticker}
                  <span style={{ fontSize: 13, color: 'var(--green)', marginLeft: 8 }}>{pick.score}pts</span>
                </div>
                {pick.tese && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{pick.tese}</div>}
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>→</span>
            </div>
          </Link>
        </div>
      )}

      {/* ── PLANO PERSONALIZADO ── */}
      <HomeClient />

      {/* ── HISTÓRICO ── */}
      <SectionTitle cor="var(--border2)">Histórico</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {diasOrdenados.slice(1).map(dia => {
          const turnos = porDia[dia]
          const ref = turnos[0]
          const dataBR = ref.data ?? dia.split('-').reverse().join('/')
          const diaSemana = new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })
          return (
            <div key={dia} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '10px 14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            }}>
              {/* data do dia */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 132 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dataBR}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{diaSemana.replace('.', '')}</span>
              </div>

              {/* turnos: manhã sempre antes da tarde */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(['manha', 'tarde'] as const).map(tn => {
                  const t = turnos.find((x: any) => x.turno === tn)
                  const label = tn === 'manha' ? '🌅 Manhã' : '☀️ Tarde'
                  if (!t) return (
                    <span key={tn} title={`Sem relatório da ${tn === 'manha' ? 'manhã' : 'tarde'}`} style={{
                      border: '1px dashed var(--border2)', borderRadius: 5, padding: '3px 8px',
                      fontSize: 12, color: 'var(--muted)', opacity: 0.5,
                    }}>{label}</span>
                  )
                  return (
                    <Link key={tn} href={`/relatorio/${t.slug}`}>
                      <span style={{
                        background: 'var(--blue-bg)', border: '1px solid rgba(91,155,255,0.25)',
                        borderRadius: 5, padding: '3px 8px', fontSize: 12, color: 'var(--blue-light)', fontWeight: 500, cursor: 'pointer',
                      }}>{label}</span>
                    </Link>
                  )
                })}
                {/* formato antigo, sem turno */}
                {turnos.filter((t: any) => !t.turno).map((t: any) => (
                  <Link key={t.slug} href={`/relatorio/${t.slug}`}>
                    <span style={{
                      background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderRadius: 5, padding: '3px 8px', fontSize: 12, color: 'var(--text2)', fontWeight: 500, cursor: 'pointer',
                    }}>📄 Dia todo</span>
                  </Link>
                ))}
              </div>

              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>{ref.resumo_curto}</span>
            </div>
          )
        })}
        {relatorios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 10 }}>
            Nenhum relatório. Rode <code style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>python gerar_e_publicar.py</code>
          </div>
        )}
      </div>
    </main>
  )
}

function SectionTitle({ children, cor = 'var(--muted)' }: { children: React.ReactNode; cor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 14, background: cor, borderRadius: 2, flexShrink: 0 }}/>
      <h2 style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, margin: 0 }}>{children}</h2>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
    </div>
  )
}
