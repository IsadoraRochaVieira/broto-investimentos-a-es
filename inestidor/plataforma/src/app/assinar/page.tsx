import Link from 'next/link'
import type { Metadata } from 'next'
import PixPagamento from '@/components/PixPagamento'

export const metadata: Metadata = {
  title: 'Assine o Caryo Map',
  description: 'Acesso ao radar completo da B3: as sugestões do dia, os debates da Mesa de IA e o Raio-X fundamentalista com dados oficiais da CVM.',
}

const CHECKOUT = process.env.NEXT_PUBLIC_CHECKOUT_URL || 'mailto:contato@caryomap.com.br?subject=Quero%20assinar%20o%20Caryo%20Map'

const INCLUI = [
  'As 10 sugestões do dia com entrada, stop e alvo',
  'Os debates da Mesa — o Comitê de 7 analistas de IA, com números conferidos',
  'O Raio-X Fundamentalista com dados oficiais da CVM',
  'O Market Map completo das 138 ações da B3',
  'Plano personalizado pelo seu capital',
  'Relatórios da manhã e da tarde, todo dia útil',
]

export default function AssinarPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.25rem 4rem', position: 'relative' }}>
      {/* pequi recortado — mascote flutuante do topo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pequi-corte.png" alt="" aria-hidden="true" className="pequi-flutua" style={{
        position: 'absolute', top: -10, right: -30, width: 260, opacity: 0.9,
        pointerEvents: 'none', filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))', zIndex: 0,
      }} />
      <style>{`
        @keyframes flutua { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-14px) rotate(1deg)} }
        .pequi-flutua { animation: flutua 7s ease-in-out infinite; }
        @media (max-width: 760px){ .pequi-flutua { width: 150px !important; right: -40px !important; opacity: .45 !important; } }
        @media (prefers-reduced-motion: reduce){ .pequi-flutua { animation: none; } }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>← Caryo Map</Link>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 20 }}>
          Assinatura
        </div>
        <h1 className="mono" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--text)', marginTop: 8, lineHeight: 1.15 }}>
          O pregão descascado,<br/>todo dia, na sua mão.
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 12, maxWidth: 540, margin: '12px auto 0', lineHeight: 1.6 }}>
          O mapa, o macro, as notícias e o histórico são gratuitos. A assinatura libera o que faz
          você agir <em>hoje</em> — as sugestões frescas, os debates da Mesa e os fundamentos da CVM.
        </p>
      </div>

      {/* Planos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 36 }}>
        {/* Anual — destaque */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, var(--gold-bg), transparent)', border: '2px solid var(--gold)', borderRadius: 16, padding: '1.8rem 1.6rem' }}>
          <span style={{ position: 'absolute', top: -12, left: 20, background: 'linear-gradient(135deg, #d4920a, #f0b429)', color: '#0a0e14', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 6, letterSpacing: '0.04em' }}>
            MEMBRO FUNDADOR
          </span>
          <div style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anual</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 38, fontWeight: 800, color: 'var(--text)' }}>R$ 197</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/ano</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>≈ R$ 16,42/mês · preço travado para sempre</div>
          <a href={CHECKOUT} style={{ display: 'block', textAlign: 'center', marginTop: 18, background: 'linear-gradient(135deg, #d4920a, #f0b429)', color: '#0a0e14', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 10, textDecoration: 'none', boxShadow: '0 6px 24px rgba(212,146,10,0.3)' }}>
            Quero ser fundador →
          </a>
        </div>

        {/* Mensal */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.8rem 1.6rem' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mensal</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 38, fontWeight: 800, color: 'var(--text)' }}>R$ 29,90</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/mês</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>flexível, cancele quando quiser</div>
          <a href={CHECKOUT} style={{ display: 'block', textAlign: 'center', marginTop: 18, background: 'var(--surface2)', color: 'var(--text)', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 10, textDecoration: 'none', border: '1px solid var(--border2)' }}>
            Assinar mensal
          </a>
        </div>
      </div>

      {/* Pix — pagamento direto */}
      <PixPagamento />

      {/* O que inclui */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.6rem 1.8rem', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
          A assinatura inclui
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px 20px' }}>
          {INCLUI.map(item => (
            <div key={item} style={{ display: 'flex', gap: 10, color: 'var(--text2)', fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: '#34d17e', flexShrink: 0, fontWeight: 700 }}>✓</span>{item}
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7 }}>
        Pagamento via Pix ou cartão · Ferramenta educacional, não é recomendação de investimento ·{' '}
        <Link href="/termos" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Termos &amp; Avisos</Link>
      </p>
    </main>
  )
}
