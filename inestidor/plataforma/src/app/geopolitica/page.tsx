import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'

function getUltimo() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'backtest_historico.json').sort((a, b) => b.localeCompare(a))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'))
}

const riscoCor: Record<string, { bg: string; border: string; text: string }> = {
  alto:   { bg: '#e5355518', border: '#b02a45', text: '#e53555' },
  medio:  { bg: '#f0b42918', border: '#d4920a', text: '#f0b429' },
  baixo:  { bg: '#34d17e18', border: '#00a63c', text: '#34d17e' },
}

const REGIOES_GLOBAIS = [
  {
    nome: 'Oriente Médio',
    risco: 'alto',
    evento: 'Negociações EUA-Irã em Doha — Brent volátil',
    setores: ['Petróleo (PETR3, PETR4, PRIO3)', 'Energia elétrica (termelétricas)'],
    impacto: 'Acordo de paz → Brent cai → petrolíferas caem no curto prazo. Sem acordo → Brent sobe.',
    emoji: '🛢️',
    x: '62%', y: '35%',
  },
  {
    nome: 'China',
    risco: 'medio',
    evento: 'Plano quinquenal 2026–30 reduz importações estratégicas',
    setores: ['Agro (AGRO3, SLCE3, SMTO3)', 'Mineração (VALE3)'],
    impacto: 'China comprando +38% do Brasil em commodities — mas 15º Plano Quinquenal quer reduzir dependência externa.',
    emoji: '🌾',
    x: '76%', y: '38%',
  },
  {
    nome: 'Estados Unidos',
    risco: 'medio',
    evento: 'Tarifas Trump afetam exportações brasileiras',
    setores: ['Agro exportador', 'Siderurgia'],
    impacto: 'Tarifas americanas ao Brasil desviaram comércio para China — efeito líquido positivo no agro, mas incerteza permanece.',
    emoji: '🏛️',
    x: '22%', y: '32%',
  },
  {
    nome: 'Rússia / Europa',
    risco: 'baixo',
    evento: 'Economia russa em mínima histórica — guerra em impasse',
    setores: ['Fertilizantes (agro BR)', 'Grãos'],
    impacto: 'Rússia enfraquecida reduz concorrência em fertilizantes e grãos — beneficia exportadores brasileiros.',
    emoji: '❄️',
    x: '54%', y: '22%',
  },
]

const BRASIL_NACIONAL = [
  {
    tema: 'COPOM & Selic',
    risco: 'medio',
    emoji: '🏦',
    titulo: 'Selic a 14,25% com cortes previstos para 2027',
    descricao: 'O Banco Central mantém postura hawkish para ancorar inflação. Impacto direto em custo de capital para empresas alavancadas (varejo, imobiliário). Monitorar atas do COPOM toda quarta-feira após reunião.',
    setores: ['Varejo (MGLU3, AMER3)', 'Imobiliário (CYRE3, EVEN3)', 'Bancos se beneficiam no spread'],
    acoes: ['Evitar dívida alta no curto prazo', 'Bancos como hedge de Selic alta'],
  },
  {
    tema: 'Fiscal & Arcabouço',
    risco: 'alto',
    emoji: '📊',
    titulo: 'Déficit primário pressiona câmbio e prêmio de risco',
    descricao: 'O arcabouço fiscal de 2026 enfrenta pressão por gastos sociais e eleições municipais. Resultado primário abaixo da meta eleva prêmio de risco Brasil e afasta capital estrangeiro.',
    setores: ['Câmbio (impacto geral)', 'Exportadoras beneficiadas pelo dólar alto', 'Bancos expostos a títulos públicos'],
    acoes: ['Dolarizar parte da carteira via ETFs', 'Exportadoras como proteção'],
  },
  {
    tema: 'IPCA & Inflação',
    risco: 'medio',
    emoji: '📈',
    titulo: 'IPCA projetado em 5,2% para 2026 — acima do teto',
    descricao: 'Pressão de energia elétrica (bandeira tarifária) e alimentos impulsionam o IPCA acima do centro da meta (3%). Afeta consumo das famílias e margens do varejo. Dados do IBGE saem toda terça-feira.',
    setores: ['Varejo (margem pressionada)', 'Energia elétrica (CPFE3, ELET3)', 'Alimentos (BRFS3, JBSS3)'],
    acoes: ['Preferir ações com poder de repasse de preço', 'Empresas indexadas ao IPCA'],
  },
  {
    tema: 'Eleições 2026',
    risco: 'medio',
    emoji: '🗳️',
    titulo: 'Ciclo eleitoral aumenta gastos e volatilidade',
    descricao: 'Ano eleitoral historicamente eleva gastos públicos e aumenta incerteza política. Setores sensíveis à regulação (energia, telecomunicações, bancos) ficam mais voláteis. Bolsa tende a ter alta pré-eleitoral se candidato pró-mercado lidera.',
    setores: ['Estatais (PETR4, BBAS3, ELET3) — risco de interferência', 'Infraestrutura — licitações aceleradas', 'Construtoras — habitação social'],
    acoes: ['Reduzir exposição a estatais no 2º semestre 2026', 'Monitorar pesquisas eleitorais'],
  },
  {
    tema: 'Commodities & Agro',
    risco: 'baixo',
    emoji: '🌱',
    titulo: 'Safra recorde de soja e milho favorece agro',
    descricao: 'Brasil projeta safra 2026 de 330 milhões de toneladas. Demanda chinesa segue forte. Câmbio depreciado favorece receita em real das exportadoras. Risco climático (La Niña) monitorado para 2º semestre.',
    setores: ['AGRO3, SLCE3, SMTO3, SLC3', 'JBS (JBSS3), Marfrig (MRFG3)', 'Fertilizantes (FHER3)'],
    acoes: ['Agro é hedge natural contra desvalorização do real', 'Monitorar preço da soja em Chicago (CBOT)'],
  },
]

const REGIOES_BR = [
  {
    nome: 'Brasília (DF)',
    emoji: '🏛️',
    risco: 'medio',
    impacto: 'Centro decisório do país. Aprovação de PECs, votações no Congresso e decisões do STF têm impacto imediato no Ibovespa. Monitorar pauta legislativa toda semana.',
    setores: ['Bancário (regulação)', 'Energia (concessões)', 'Saúde (ANS)'],
    fonte: 'Câmara dos Deputados · Senado Federal · STF',
  },
  {
    nome: 'São Paulo (capital)',
    emoji: '🏙️',
    risco: 'baixo',
    impacto: 'Centro financeiro. Fiesp divulga índice de confiança industrial. IBGE-SP lidera dados de emprego. Impacto no consumo nacional e varejo listado na B3.',
    setores: ['Varejo (MELI, MGLU3)', 'Financeiro (ITUB4, BBDC4)', 'Imobiliário (BRPR3)'],
    fonte: 'Fiesp · IBGE-SP · B3',
  },
  {
    nome: 'Rio de Janeiro',
    emoji: '⛽',
    risco: 'medio',
    impacto: 'Sede da Petrobras, IRB e vários bancos. Questões político-regulatórias do Rio afetam diretamente o setor petrolífero e de resseguros listados na B3.',
    setores: ['PETR3, PETR4, PRIO3', 'Resseguros (IRBR3)', 'Portos e logística'],
    fonte: 'ANP · Agência Petrobras · CVM',
  },
  {
    nome: 'Mato Grosso',
    emoji: '🌾',
    risco: 'baixo',
    impacto: 'Maior produtor de soja do Brasil. Safra e logística de escoamento (ferrovias, hidrovias) determinam custo do agro nacional. Chuvas e tempo são monitorados diariamente.',
    setores: ['AGRO3, SLCE3', 'Logística (RAIL3, CCRO3)', 'Fertilizantes'],
    fonte: 'Conab · Embrapa · Aprosoja-MT',
  },
  {
    nome: 'Minas Gerais',
    emoji: '⛏️',
    risco: 'medio',
    impacto: 'Sede da Vale e do setor de mineração. Licenças ambientais, pluviosidade em barragens e preço do minério de ferro afetam diretamente VALE3 e o índice de mineração.',
    setores: ['VALE3', 'Siderurgia (CSNA3, GGBR4)', 'Energia hidrelétrica'],
    fonte: 'DNPM · Vale RI · IBAMA-MG',
  },
]

const EVENTOS_SEMANA = [
  { dia: 'Seg', titulo: 'PMI Industrial China', impacto: 'VALE3, AGRO3', nivel: 'medio' },
  { dia: 'Ter', titulo: 'CPI EUA (inflação)', impacto: 'Dólar, todos os ativos', nivel: 'alto' },
  { dia: 'Qua', titulo: 'Reunião OPEP+', impacto: 'PETR3, PETR4, PRIO3', nivel: 'alto' },
  { dia: 'Qui', titulo: 'Payroll EUA', impacto: 'Câmbio, Ibovespa', nivel: 'medio' },
  { dia: 'Sex', titulo: 'IPCA Brasil (prévia)', impacto: 'Bancos, varejo', nivel: 'medio' },
]

export default function GeopoliticaPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="geopolitica" />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5' }}>Radar Geopolítico</h1>
        <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Riscos globais e domésticos mapeados para a B3 · Atualizado diariamente
        </p>
      </header>

      {/* ===== SEÇÃO BRASIL ===== */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🇧🇷</span>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>Brasil — Cenário Doméstico</h2>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }}/>
          <span style={{ fontSize: '0.68rem', color: '#00a63c', background: '#00a63c18', border: '1px solid #00a63c40', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>ATUALIZADO HOJE</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {BRASIL_NACIONAL.map(item => {
            const c = riscoCor[item.risco]
            return (
              <div key={item.tema} style={{ background: '#0f1520', border: `1px solid #1c2538`, borderLeft: `4px solid ${c.border}`, borderRadius: 10, padding: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                  <span style={{ fontWeight: 700, color: '#e8edf5', fontSize: '0.9rem', flex: 1 }}>{item.titulo}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}40`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {item.risco}
                  </span>
                </div>
                <p style={{ color: '#8a9bbf', fontSize: '0.8rem', lineHeight: 1.55, marginBottom: 8 }}>{item.descricao}</p>
                <div style={{ borderTop: '1px solid #1c2538', paddingTop: 8 }}>
                  <div style={{ fontSize: '0.68rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Ações afetadas</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {item.setores.map(s => (
                      <span key={s} style={{ fontSize: '0.7rem', background: '#ffffff08', borderRadius: 4, padding: '2px 6px', color: '#4d5f7a' }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {item.acoes.map((a, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', color: '#34d17e', display: 'flex', gap: '0.4rem' }}>
                        <span style={{ color: '#00a63c' }}>→</span>{a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Regiões do Brasil */}
        <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
            Impacto por região — Brasil
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
            {REGIOES_BR.map(reg => {
              const c = riscoCor[reg.risco]
              return (
                <div key={reg.nome} style={{ background: '#0a0e14', border: `1px solid #1c2538`, borderRadius: 9, padding: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                    <span style={{ fontSize: '1rem' }}>{reg.emoji}</span>
                    <span style={{ fontWeight: 700, color: '#e8edf5', fontSize: '0.85rem', flex: 1 }}>{reg.nome}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.border, boxShadow: `0 0 5px ${c.border}` }}/>
                  </div>
                  <p style={{ color: '#8a9bbf', fontSize: '0.77rem', lineHeight: 1.5, marginBottom: 6 }}>{reg.impacto}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 5 }}>
                    {reg.setores.map(s => (
                      <span key={s} style={{ fontSize: '0.68rem', background: '#ffffff08', borderRadius: 3, padding: '1px 5px', color: '#4d5f7a' }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.68rem', borderTop: '1px solid #1c2538', paddingTop: 5, color: '#4d5f7a' }}>
                    Fonte: {reg.fonte}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO GLOBAL ===== */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🌍</span>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>Cenário Global</h2>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }}/>
        </div>

        {/* Mapa SVG simplificado */}
        <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '42%', background: '#0a0e14', borderRadius: 10, border: '1px solid #1c2538', overflow: 'hidden' }}>
            <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
              <ellipse cx="28" cy="55" rx="8" ry="12" fill="#00a63c"/>
              <ellipse cx="22" cy="28" rx="10" ry="10" fill="#00a63c"/>
              <ellipse cx="50" cy="22" rx="6" ry="6" fill="#00a63c"/>
              <ellipse cx="50" cy="40" rx="7" ry="10" fill="#00a63c"/>
              <ellipse cx="72" cy="28" rx="16" ry="10" fill="#00a63c"/>
              <ellipse cx="82" cy="48" rx="6" ry="4" fill="#00a63c"/>
            </svg>
            {REGIOES_GLOBAIS.map((reg) => {
              const c = riscoCor[reg.risco]
              return (
                <div key={reg.nome} style={{ position: 'absolute', left: reg.x, top: reg.y, transform: 'translate(-50%, -50%)' }}>
                  <div title={`${reg.nome}: ${reg.evento}`} style={{ width: reg.risco === 'alto' ? 22 : 16, height: reg.risco === 'alto' ? 22 : 16, borderRadius: '50%', background: c.bg, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: reg.risco === 'alto' ? 11 : 9, cursor: 'default' }}>
                    {reg.emoji}
                  </div>
                  <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: c.text, whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {reg.nome.split(' ')[0]}
                  </div>
                </div>
              )
            })}
            <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', gap: 10, fontSize: 10 }}>
              {(['alto', 'medio', 'baixo'] as const).map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, color: riscoCor[n].text }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${riscoCor[n].border}`, background: riscoCor[n].bg }}/>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {REGIOES_GLOBAIS.map(reg => {
            const c = riscoCor[reg.risco]
            return (
              <div key={reg.nome} style={{ background: '#0f1520', border: `1px solid #1c2538`, borderLeft: `4px solid ${c.border}`, borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.2rem' }}>{reg.emoji}</span>
                  <span style={{ fontWeight: 700, color: '#e8edf5', fontSize: '0.95rem' }}>{reg.nome}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}40`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>
                    {reg.risco}
                  </span>
                </div>
                <p style={{ color: '#8a9bbf', fontSize: '0.82rem', marginBottom: 8 }}>{reg.evento}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {reg.setores.map(s => (
                    <span key={s} style={{ fontSize: '0.72rem', background: '#ffffff10', borderRadius: 4, padding: '2px 6px', color: '#4d5f7a' }}>{s}</span>
                  ))}
                </div>
                <p style={{ color: '#4d5f7a', fontSize: '0.78rem', lineHeight: 1.5, borderTop: '1px solid #1c2538', paddingTop: 8 }}>{reg.impacto}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Radar de eventos da semana */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📅</span>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8edf5' }}>Calendário da Semana</h2>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }}/>
        </div>
        <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {EVENTOS_SEMANA.map((ev, i) => {
              const c = riscoCor[ev.nivel]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.9rem', background: '#ffffff05', border: '1px solid #1c2538', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}40`, borderRadius: 5, padding: '3px 8px', minWidth: 32, textAlign: 'center' }}>
                    {ev.dia}
                  </span>
                  <span style={{ fontWeight: 600, color: '#e8edf5', fontSize: '0.88rem', flex: 1 }}>{ev.titulo}</span>
                  <span style={{ fontSize: '0.75rem', color: '#4d5f7a' }}>afeta: <strong style={{ color: '#8a9bbf' }}>{ev.impacto}</strong></span>
                </div>
              )
            })}
          </div>
          <p style={{ color: '#4d5f7a', fontSize: '0.75rem', marginTop: '0.9rem', borderTop: '1px solid #1c2538', paddingTop: '0.75rem' }}>
            Eventos com risco alto: evitar abrir posições novas nas 2h antes do dado ser divulgado.
          </p>
        </div>
      </section>
    </main>
  )
}
