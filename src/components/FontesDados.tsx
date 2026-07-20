'use client'
import { useState } from 'react'

type Fonte = { o: string; fonte: string; url: string; nota?: string }

const FONTES: Fonte[] = [
  {
    o: 'Cotações e histórico de preços',
    fonte: 'Yahoo Finance (via yfinance)',
    url: 'https://finance.yahoo.com/',
    nota: 'Fechamento do pregão. Pode refletir o dia anterior (D-1).',
  },
  {
    o: 'Preço ao vivo e universo de ações',
    fonte: 'brapi.dev',
    url: 'https://brapi.dev/',
    nota: 'Cotação intradiária e lista das ações negociadas na B3.',
  },
  {
    o: 'Indicadores técnicos (RSI, MACD, Bollinger, ATR, volume)',
    fonte: 'Cálculo próprio do Caryo Map',
    url: 'https://github.com/IsadoraRochaVieira/b3-radar',
    nota: 'Computados sobre as cotações acima com a biblioteca ta.',
  },
  {
    o: 'Fundamentos (receita, lucro, margem, patrimônio, ROE)',
    fonte: 'CVM — Demonstrações Financeiras Padronizadas (DFP)',
    url: 'https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp',
    nota: 'Dado oficial e auditado, direto do regulador. É a nossa fonte de maior confiança.',
  },
  {
    o: 'Notícias e sentimento de setor',
    fonte: 'RSS: InfoMoney, G1 Economia, Agência Brasil, Correio Braziliense',
    url: 'https://www.infomoney.com.br/',
    nota: 'Cada notícia no site leva ao link original da publicação.',
  },
  {
    o: 'Macro (Selic, IPCA, câmbio, Ibovespa)',
    fonte: 'Banco Central do Brasil e provedores de mercado',
    url: 'https://www.bcb.gov.br/',
  },
  {
    o: 'Análise e síntese do Comitê',
    fonte: 'Modelo de IA sobre os dados acima',
    url: '/comite',
    nota: 'A IA só interpreta os números do dossiê — nunca os inventa — e passa por uma segunda verificação automática.',
  },
]

export default function FontesDados({ compacto = false }: { compacto?: boolean }) {
  const [aberto, setAberto] = useState(!compacto)

  return (
    <section style={{ marginTop: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setAberto(v => !v)}
        aria-expanded={aberto}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: 'none', border: 'none', padding: '0.9rem 1.2rem', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
          De onde vêm estes dados
        </span>
        <span style={{ background: 'rgba(91,155,255,0.14)', color: '#5b9bff', border: '1px solid rgba(91,155,255,0.3)', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)' }}>
          {FONTES.length} FONTES · VERIFICÁVEIS
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {aberto && (
        <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 4px' }}>
            Nenhum número aqui é inventado. Cada dado tem origem rastreável — clique para conferir na fonte.
          </p>
          {FONTES.map(f => (
            <div key={f.o} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', paddingTop: 9, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: '#5b9bff', flexShrink: 0, fontSize: 12, lineHeight: 1.6 }}>▸</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{f.o}</div>
                <a href={f.url} target={f.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                   style={{ fontSize: 12.5, color: 'var(--gold-bright)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  {f.fonte} ↗
                </a>
                {f.nota && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{f.nota}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
