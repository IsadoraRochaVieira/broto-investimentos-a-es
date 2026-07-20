import fs from 'fs'
import path from 'path'
import Nav from '@/components/Nav'

function getNoticias() {
  const dir = path.join(process.cwd(), 'relatorios')
  if (!fs.existsSync(dir)) return null
  // Pega o arquivo de notícias mais recente
  const arquivos = fs.readdirSync(dir)
    .filter(f => f.startsWith('noticias_') && f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
  if (!arquivos.length) return null
  return JSON.parse(fs.readFileSync(path.join(dir, arquivos[0]), 'utf-8'))
}

// Agenda estática — atualizada manualmente ou via script
const AGENDA_SEMANA = [
  { dia: 'Seg', data: '07/07', evento: 'PMI Serviços China', hora: '02:45', impacto: 'VALE3, exportadores', nivel: 'medio' },
  { dia: 'Ter', data: '08/07', evento: 'IPCA prévia IBGE', hora: '09:00', impacto: 'Selic, varejo, bancos', nivel: 'alto' },
  { dia: 'Qua', data: '09/07', evento: 'Ata do COPOM', hora: '08:30', impacto: 'Renda fixa, câmbio, todos', nivel: 'alto' },
  { dia: 'Qui', data: '10/07', evento: 'Resultado fiscal do governo', hora: '15:00', impacto: 'Câmbio, CDS Brasil', nivel: 'alto' },
  { dia: 'Sex', data: '11/07', evento: 'Produção industrial IBGE', hora: '09:00', impacto: 'Varejo, consumo, crédito', nivel: 'medio' },
]

const corNivel: Record<string, { bg: string; border: string; text: string }> = {
  alto:  { bg: '#e5355518', border: '#b02a45', text: '#e53555' },
  medio: { bg: '#f0b42918', border: '#d4920a', text: '#f0b429' },
  baixo: { bg: '#34d17e18', border: '#00a63c', text: '#34d17e' },
}

// Fallback quando não há RSS ainda
const NOTICIAS_FIXAS = [
  { categoria: 'Política Econômica', cor: '#5b9bff', emoji: '🏦', titulo: 'COPOM mantém Selic em 14,25%', descricao: 'Banco Central mantém taxa básica. Mercado precifica cortes apenas para 2027.', setores: ['ITUB4 ↑', 'BBDC4 ↑', 'MGLU3 ↓'], urgencia: 'alta', fonte: 'Banco Central' },
  { categoria: 'Fiscal', cor: '#e53555', emoji: '📊', titulo: 'Déficit primário R$ 68bi no semestre — acima da meta', descricao: 'Gastos sociais e precatórios pressionam orçamento. Fazenda busca cortes.', setores: ['Câmbio ↑', 'PETR4 ↑', 'Varejo ↓'], urgencia: 'alta', fonte: 'Ministério da Fazenda' },
  { categoria: 'Eleições 2026', cor: '#d4920a', emoji: '🗳️', titulo: 'Pesquisas mostram empate técnico', descricao: 'Cenário eleitoral incerto aumenta volatilidade de estatais e Ibovespa.', setores: ['PETR4 (sensível)', 'BBAS3 (sensível)', 'ELET3 (sensível)'], urgencia: 'media', fonte: 'Datafolha' },
  { categoria: 'Agronegócio', cor: '#34d17e', emoji: '🌱', titulo: 'Safra 2026: recorde de 331 mi de toneladas', descricao: 'Soja e milho com área plantada recorde. Demanda chinesa segura preços.', setores: ['SLCE3 ↑', 'AGRO3 ↑', 'SMTO3 ↑'], urgencia: 'baixa', fonte: 'Conab' },
  { categoria: 'Energia', cor: '#d4920a', emoji: '⚡', titulo: 'Bandeira tarifária amarela em julho', descricao: 'Reservatórios baixos no Sudeste. Energia 1,8% mais cara pressiona IPCA.', setores: ['CPFE3 (neutro)', 'ENGI11 ↑', 'Varejo (custo ↑)'], urgencia: 'media', fonte: 'ANEEL' },
  { categoria: 'Commodities', cor: '#34d17e', emoji: '⛏️', titulo: 'Minério de ferro estável em US$ 108', descricao: 'PMI chinês em expansão sustenta demanda. VALE3 com upside técnico.', setores: ['VALE3 ↑', 'CMIN3 ↑', 'CSNA3 ↑'], urgencia: 'baixa', fonte: 'Metal Bulletin' },
]

export default function NoticiasPage() {
  const dadosRSS = getNoticias()
  const noticias: any[] = dadosRSS?.noticias ?? NOTICIAS_FIXAS
  const coletadoEm: string = dadosRSS?.coletado_em ?? 'offline'
  const totalUrgentes: number = dadosRSS?.urgentes ?? 0
  const destaque = dadosRSS?.destaque ?? null
  const aoVivo = !!dadosRSS

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="noticias" />

      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em', margin: 0 }}>Notícias & Política Brasil</h1>
            <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: 6 }}>O que acontece no Brasil e como impacta a B3 · {hoje}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {aoVivo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#00a63c18', border: '1px solid #00a63c40', borderRadius: 8, padding: '0.35rem 0.8rem', fontSize: '0.75rem', color: '#34d17e' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d17e', display: 'inline-block' }}/>
                Ao vivo · {coletadoEm}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#4d5f7a', background: '#1c2538', borderRadius: 6, padding: '0.3rem 0.7rem' }}>
                Offline · Rode o script para atualizar
              </div>
            )}
            {totalUrgentes > 0 && (
              <div style={{ background: '#e5355518', border: '1px solid #b02a4540', borderRadius: 8, padding: '0.35rem 0.8rem', fontSize: '0.75rem', color: '#e53555', fontWeight: 700 }}>
                🔴 {totalUrgentes} urgente{totalUrgentes > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Destaque */}
      {destaque && (
        <div style={{ background: 'linear-gradient(135deg, #0f1520, #0a0e14)', border: '2px solid #d4920a', borderRadius: 13, padding: '1.4rem', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#d4920a', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>★ Notícia em destaque · {destaque.fonte}</div>
          <h2 style={{ color: '#e8edf5', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px' }}>{destaque.titulo}</h2>
          <p style={{ color: '#8a9bbf', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 10px' }}>{destaque.descricao}</p>
          {destaque.setores?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {destaque.setores.map((s: string) => (
                <span key={s} style={{ fontSize: '0.75rem', background: '#ffffff10', borderRadius: 5, padding: '2px 8px', color: '#4d5f7a' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agenda */}
      <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
          <div style={{ width: 3, height: 16, background: '#00a63c', borderRadius: 2 }}/>
          <span style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Agenda econômica desta semana</span>
          <div style={{ flex: 1, height: 1, background: '#1c2538' }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {AGENDA_SEMANA.map((ev, i) => {
            const c = corNivel[ev.nivel]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.85rem', background: '#0a0e14', border: '1px solid #1c2538', borderRadius: 8 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}40`, borderRadius: 5, padding: '3px 9px', minWidth: 28, textAlign: 'center' }}>
                  {ev.dia}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#4d5f7a', minWidth: 42 }}>{ev.data} {ev.hora}</span>
                <span style={{ fontWeight: 600, color: '#e8edf5', fontSize: '0.87rem', flex: 1 }}>{ev.evento}</span>
                <span style={{ fontSize: '0.73rem', color: '#8a9bbf', textAlign: 'right', whiteSpace: 'nowrap' }}>{ev.impacto}</span>
              </div>
            )
          })}
        </div>
        <p style={{ color: '#4d5f7a', fontSize: '0.72rem', marginTop: '0.7rem' }}>
          Eventos alto risco: não abrir posições novas nas 2h antes da divulgação.
        </p>
      </div>

      {/* Grid notícias */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <div style={{ width: 3, height: 16, background: '#00a63c', borderRadius: 2 }}/>
        <span style={{ fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
          {aoVivo ? `${noticias.length} notícias coletadas — impacto na B3` : 'Análise de impacto — Brasil'}
        </span>
        <div style={{ flex: 1, height: 1, background: '#1c2538' }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.8rem' }}>
        {noticias.slice(0, 24).map((n: any, i: number) => {
          const urgCor = n.urgencia === 'alta' ? '#e53555' : n.urgencia === 'media' ? '#f0b429' : '#34d17e'
          const urgBg  = n.urgencia === 'alta' ? '#e5355515' : n.urgencia === 'media' ? '#f0b42915' : '#34d17e15'
          const cor    = n.cor ?? '#5b9bff'
          return (
            <div key={i} style={{ background: '#0f1520', border: '1px solid #1c2538', borderLeft: `3px solid ${cor}`, borderRadius: 11, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.9rem' }}>{n.emoji ?? '📰'}</span>
                <span style={{ fontSize: '0.65rem', color: cor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>{n.categoria} · {n.fonte}</span>
                <span style={{ fontSize: '0.62rem', color: urgCor, background: urgBg, border: `1px solid ${urgCor}40`, borderRadius: 4, padding: '1px 6px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {n.urgencia === 'alta' ? '🔴 urgente' : n.urgencia === 'media' ? '🟡 atenção' : '🟢 info'}
                </span>
              </div>

              <h3 style={{ color: '#e8edf5', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>{n.titulo}</h3>

              {n.descricao && (
                <p style={{ color: '#8a9bbf', fontSize: '0.78rem', lineHeight: 1.55, margin: 0 }}>
                  {n.descricao.slice(0, 220)}{n.descricao.length > 220 ? '…' : ''}
                </p>
              )}

              {n.setores?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {n.setores.map((s: string) => {
                    const up = s.includes('↑')
                    const dn = s.includes('↓')
                    return (
                      <span key={s} style={{ fontSize: '0.7rem', background: up ? '#00a63c20' : dn ? '#e5355520' : '#ffffff10', border: `1px solid ${up ? '#00a63c40' : dn ? '#b02a4540' : '#1c2538'}`, color: up ? '#34d17e' : dn ? '#e53555' : '#4d5f7a', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                        {s}
                      </span>
                    )
                  })}
                </div>
              )}

              {n.link && aoVivo && (
                <a href={n.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.68rem', color: '#4d5f7a', borderTop: '1px solid #1c2538', paddingTop: 6, textDecoration: 'none' }}>
                  Ler matéria completa →
                </a>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ color: '#4d5f7a', fontSize: '0.75rem', marginTop: '2rem', textAlign: 'center' }}>
        {aoVivo
          ? `Notícias coletadas automaticamente às ${coletadoEm} · Não constitui recomendação de investimento`
          : 'Análises de impacto elaboradas pelo B3 Radar · Rode o script para notícias ao vivo'}
      </p>
    </main>
  )
}
