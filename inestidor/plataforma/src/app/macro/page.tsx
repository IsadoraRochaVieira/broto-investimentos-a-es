import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'

function getUltimoRelatorio() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'backtest_historico.json').sort((a, b) => b.localeCompare(a))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'))
}

function getHistoricoMacro() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f !== 'backtest_historico.json')
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14)
    .map(f => {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
      return { data: d.data, data_iso: d.data_iso, macro: d.macro }
    })
    .filter(r => r.macro)
}

const varCor = (v: number) => v >= 0 ? '#34d17e' : '#e53555'
const varSinal = (v: number) => v > 0 ? '+' : ''

export default function MacroPage() {
  const ultimo = getUltimoRelatorio()
  const historico = getHistoricoMacro()
  const m = ultimo?.macro

  const cards = m ? [
    {
      label: 'Ibovespa',
      valor: m.ibovespa,
      var: m.ibovespa_var,
      desc: 'Índice principal da B3',
      icon: '📊',
    },
    {
      label: 'Dólar / Real',
      valor: `R$ ${m.dolar}`,
      var: m.dolar_var,
      desc: 'Taxa de câmbio USD/BRL',
      icon: '💵',
    },
    {
      label: 'Brent',
      valor: `US$ ${m.brent}`,
      var: m.brent_var,
      desc: 'Petróleo referência global',
      icon: '🛢️',
    },
    {
      label: 'Selic',
      valor: `${m.selic}%`,
      var: null,
      desc: 'Taxa básica de juros',
      icon: '🏦',
    },
    {
      label: 'IPCA 12m',
      valor: `${m.ipca_12m}%`,
      var: null,
      desc: 'Inflação acumulada',
      icon: '📈',
    },
  ] : []

  // Impacto macro nos setores
  const impactos = m ? [
    {
      setor: 'Petróleo (PETR4, PRIO3)',
      status: parseFloat(String(m.brent_var ?? 0)) >= 0 ? 'positivo' : 'negativo',
      texto: parseFloat(String(m.brent_var ?? 0)) >= 0
        ? `Brent em alta (${varSinal(m.brent_var)}${m.brent_var}%) favorece margens das petrolíferas`
        : `Brent em queda (${m.brent_var}%) pressiona receita das petrolíferas`,
    },
    {
      setor: 'Bancos (ITUB4, BBAS3)',
      status: parseFloat(String(m.selic ?? 0)) > 13 ? 'neutro' : 'positivo',
      texto: parseFloat(String(m.selic ?? 0)) > 13
        ? `Selic em ${m.selic}% mantém spread bancário elevado — margens altas mas inadimplência em risco`
        : `Selic em queda favorece crescimento de crédito e melhora inadimplência`,
    },
    {
      setor: 'Agro (AGRO3, SLCE3)',
      status: parseFloat(String(m.dolar_var ?? 0)) >= 0 ? 'positivo' : 'neutro',
      texto: parseFloat(String(m.dolar_var ?? 0)) >= 0
        ? `Dólar em ${varSinal(m.dolar_var)}${m.dolar_var}% beneficia exportadores de commodities agrícolas`
        : `Dólar em queda comprime margens de exportadores em reais`,
    },
    {
      setor: 'Varejo (MGLU3, LREN3)',
      status: parseFloat(String(m.selic ?? 0)) > 13 ? 'negativo' : 'neutro',
      texto: `Selic a ${m.selic}% encarece crédito ao consumidor e pressiona margens do varejo`,
    },
  ] : []

  const corStatus: Record<string, string> = {
    positivo: '#34d17e',
    negativo: '#e53555',
    neutro: '#f0b429',
  }
  const bgStatus: Record<string, string> = {
    positivo: '#34d17e18',
    negativo: '#e5355518',
    neutro: '#f0b42918',
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="macro" />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8edf5' }}>Painel Macro ao Vivo</h1>
        <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          {m?.atualizado_em ? `Atualizado em ${m.atualizado_em}` : 'Atualizado automaticamente toda manhã'}
        </p>
      </header>

      {/* Cards macro */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: '#0f1520',
            border: '1px solid #1c2538',
            borderRadius: 12,
            padding: '1.1rem',
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{c.icon}</div>
            <div style={{ color: '#4d5f7a', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
            <div style={{ color: '#e8edf5', fontWeight: 800, fontSize: '1.3rem', margin: '0.25rem 0' }}>{c.valor}</div>
            {c.var !== null && c.var !== undefined && (
              <div style={{ color: varCor(c.var), fontSize: '0.82rem', fontWeight: 600 }}>
                {varSinal(c.var)}{c.var}% hoje
              </div>
            )}
            <div style={{ color: '#4d5f7a', fontSize: '0.72rem', marginTop: '0.4rem' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Impacto por setor */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Impacto macro por setor
          </h2>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {impactos.map(i => (
            <div key={i.setor} style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              background: '#0f1520', border: '1px solid #1c2538', borderRadius: 10,
              padding: '0.9rem 1.2rem',
            }}>
              <span style={{
                background: bgStatus[i.status],
                border: `1px solid ${corStatus[i.status]}40`,
                color: corStatus[i.status],
                borderRadius: 6, padding: '0.2rem 0.6rem',
                fontSize: '0.72rem', fontWeight: 700,
                textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: '0.1rem',
              }}>
                {i.status}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e8edf5' }}>{i.setor}</div>
                <div style={{ color: '#4d5f7a', fontSize: '0.82rem', marginTop: '0.2rem' }}>{i.texto}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico macro */}
      {historico.length > 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Histórico de 14 dias
            </h2>
            <div style={{ flex: 1, height: 1, background: '#1c2538' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ color: '#4d5f7a' }}>
                  {['Data', 'Ibovespa', 'Var %', 'Dólar', 'Brent', 'Selic'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #1c2538', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(r => (
                  <tr key={r.data_iso} style={{ borderBottom: '1px solid #1c2538' }}>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#e8edf5' }}>{r.data}</td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>{r.macro.ibovespa}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: varCor(r.macro.ibovespa_var ?? 0), fontWeight: 600 }}>
                      {varSinal(r.macro.ibovespa_var ?? 0)}{r.macro.ibovespa_var ?? '-'}%
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#f0b429' }}>R$ {r.macro.dolar}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#f0b429' }}>US$ {r.macro.brent}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#5b9bff' }}>{r.macro.selic}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!m && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#4d5f7a', border: '1px dashed #1c2538', borderRadius: 12 }}>
          Ainda sem dados macro. Rode o script <code>gerar_e_publicar.py</code> para popular.
        </div>
      )}
    </main>
  )
}
