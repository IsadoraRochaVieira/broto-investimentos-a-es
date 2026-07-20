'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import CortinaNumeros from '@/components/CortinaNumeros'
import Costura from '@/components/Costura'
import NumeroContado from '@/components/NumeroContado'

/* ── Radar de pequi: o núcleo dourado como tela de radar ── */
function RadarPequi() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const S = 420
    canvas.width = S * 2; canvas.height = S * 2; ctx.scale(2, 2)
    const cx = S / 2, cy = S / 2, R = S / 2 - 8
    const pts: { a: number; d: number; forte: boolean }[] = []
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < 42; i++) pts.push({ a: rnd() * Math.PI * 2, d: (0.25 + rnd() * 0.7) * R, forte: rnd() > 0.72 })
    let ang = 0, raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, S, S)
      const nuc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      nuc.addColorStop(0, 'rgba(240,180,41,0.14)'); nuc.addColorStop(0.55, 'rgba(212,146,10,0.06)'); nuc.addColorStop(1, 'rgba(212,146,10,0.02)')
      ctx.fillStyle = nuc; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(212,146,10,0.20)'; ctx.lineWidth = 1
      for (const f of [0.33, 0.66, 1]) { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.stroke() }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R)
      ctx.strokeStyle = 'rgba(212,146,10,0.10)'; ctx.stroke()
      if (ctx.createConicGradient) {
        const g = ctx.createConicGradient(ang, cx, cy)
        g.addColorStop(0, 'rgba(240,180,41,0.32)'); g.addColorStop(0.08, 'rgba(240,180,41,0)'); g.addColorStop(1, 'rgba(240,180,41,0)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, ang - 0.9, ang); ctx.closePath(); ctx.fill()
      }
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R)
      ctx.strokeStyle = 'rgba(240,180,41,0.8)'; ctx.lineWidth = 1.5; ctx.stroke()
      for (const p of pts) {
        let diff = (ang - p.a) % (Math.PI * 2); if (diff < 0) diff += Math.PI * 2
        const br = Math.max(0, 1 - diff / 1.6)
        const x = cx + Math.cos(p.a) * p.d, y = cy + Math.sin(p.a) * p.d
        const base = p.forte ? 0.5 : 0.18
        ctx.fillStyle = p.forte ? `rgba(240,180,41,${base + br * 0.5})` : `rgba(91,155,255,${base + br * 0.45})`
        ctx.beginPath(); ctx.arc(x, y, p.forte ? 3 + br * 2 : 2, 0, Math.PI * 2); ctx.fill()
        if (p.forte && br > 0.5) { ctx.strokeStyle = `rgba(240,180,41,${(br - 0.5) * 0.7})`; ctx.beginPath(); ctx.arc(x, y, 7 + br * 4, 0, Math.PI * 2); ctx.stroke() }
      }
      ang += 0.012
      if (!reduz) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: 420, height: 420, maxWidth: '90vw', maxHeight: '90vw' }} aria-label="Radar varrendo ações da B3" role="img" />
}

function Revela({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: 0.15 })
    o.observe(el); return () => o.disconnect()
  }, [])
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(24px)', transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms` }}>{children}</div>
}

export default function Landing() {
  return (
    <main style={{ overflow: 'hidden' }}>
      <style>{`
        .cm-display { font-family: var(--display); font-optical-sizing: auto; letter-spacing: -0.02em; }
        .cm-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .cm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; }
        .cm-ouro { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        @media (max-width: 860px) {
          .cm-3col { grid-template-columns: 1fr; }
          .cm-stats { grid-template-columns: repeat(2, 1fr); }
          .cm-ouro { grid-template-columns: 1fr; }
        }
        .cm-cta { display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #d4920a, #f0b429);
          color: #0a0e14; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none;
          box-shadow: 0 8px 32px rgba(212,146,10,0.35); transition: transform 0.15s, box-shadow 0.15s; }
        .cm-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(212,146,10,0.5); }
        .cm-ghost { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.22);
          color: #e8edf5; padding: 13px 24px; border-radius: 10px; text-decoration: none; font-size: 14px;
          background: rgba(10,14,20,0.4); backdrop-filter: blur(6px); transition: border-color 0.15s, color 0.15s; }
        .cm-ghost:hover { border-color: #f0b429; color: #f0b429; }
        /* no celular o pequi vira atmosfera atrás do texto, não concorrente */
        @media (max-width: 860px) {
          .hero-pequi { width: 90% !important; right: -22% !important; bottom: 2% !important; opacity: .3 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .cm-cta:hover { transform: none; } }
      `}</style>

      {/* ── HERO — a cortina de números é o fundo; o pequi, a presença ── */}
      <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CortinaNumeros />
        {/* pequi recortado: o ouro emergindo do fluxo de dados */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pequi-corte.png" alt="" aria-hidden="true" className="hero-pequi" style={{
          position: 'absolute', right: '-4%', bottom: '6%', width: '46%', maxWidth: 620,
          zIndex: 1, pointerEvents: 'none', opacity: 0.92,
          filter: 'drop-shadow(0 30px 70px rgba(0,0,0,0.75))',
        }} />
        {/* overlay para legibilidade */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'radial-gradient(120% 90% at 15% 40%, rgba(10,14,20,0.94) 0%, rgba(10,14,20,0.72) 45%, rgba(10,14,20,0.55) 100%), linear-gradient(180deg, rgba(10,14,20,0.55) 0%, transparent 35%, rgba(10,14,20,0.95) 100%)' }} />

        {/* header */}
        <header style={{ position: 'relative', zIndex: 3, maxWidth: 1100, width: '100%', margin: '0 auto',
          padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icone-pequi.png" alt="" width={34} height={34} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(240,180,41,0.4))' }} />
            <span className="cm-display" style={{ fontWeight: 800, fontSize: 19, color: '#fff' }}>Caryo <span style={{ color: '#f0b429' }}>Map</span></span>
          </div>
          <Link href="/painel" className="cm-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>Entrar</Link>
        </header>

        {/* conteúdo do hero */}
        <div style={{ position: 'relative', zIndex: 3, flex: 1, display: 'flex', alignItems: 'center',
          maxWidth: 1100, width: '100%', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 11, color: '#f0b429', letterSpacing: '0.2em', fontWeight: 700,
              fontFamily: 'var(--mono)', marginBottom: 22, textTransform: 'uppercase' }}>
              Caryocar brasiliense · a joia bruta do cerrado
            </div>
            <h1 className="cm-display" style={{ fontSize: 'clamp(40px, 7vw, 74px)', fontWeight: 900, lineHeight: 1.02, color: '#fff', margin: 0 }}>
              Descascamos<br/>o mercado.<br/>
              <span style={{ background: 'linear-gradient(135deg, #f0b429, #d4920a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                Mapeamos o ouro.
              </span>
            </h1>
            <p style={{ color: 'rgba(232,237,245,0.86)', fontSize: 18, lineHeight: 1.6, marginTop: 26, maxWidth: 500 }}>
              O Caryo Map é o comitê de inteligência que varre 138 ações da B3 duas vezes por dia —
              cruzando técnica, fundamentos, macro e notícias — para achar as assimetrias
              e blindar você contra os espinhos do risco.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 34, flexWrap: 'wrap' }}>
              <Link href="/painel" className="cm-cta">Ver o mapa de hoje →</Link>
              <Link href="/backtesting" className="cm-ghost">Conferir o histórico</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── NÚMEROS (com a Cortina de Números viva ao fundo) ── */}
      <section style={{ position: 'relative', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
        <CortinaNumeros />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,21,32,0.70), rgba(15,21,32,0.88))', pointerEvents: 'none' }} />
        <div className="cm-stats" style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', pointerEvents: 'none' }}>
          {[
            { n: '138', l: 'ações varridas por análise' },
            { n: '2×', l: 'mapas por dia útil' },
            { n: '15', l: 'setores lidos nas notícias' },
            { n: '100%', l: 'do histórico aberto no backtest' },
          ].map(s => (
            <div key={s.l} style={{ padding: '1.75rem 1.5rem', borderLeft: '1px solid var(--border)' }}>
              <NumeroContado valor={s.n} className="cm-display" style={{ display: 'block', fontSize: 34, fontWeight: 900, color: '#f0b429', fontFamily: 'var(--mono)' }} />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem' }}><Costura /></div>

      {/* ── O OURO OCULTO (foto real do pequi) ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '5.5rem 1rem' }}>
        <Revela>
          <div className="cm-ouro">
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pequi-aberto.jpg" alt="Pequi cortado revelando a polpa dourada, com cotações ao fundo"
                style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 0 80px rgba(240,180,41,0.12)', pointerEvents: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.18em', fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 16 }}>
                Por fora, cerrado · por dentro, ouro
              </div>
              <h2 className="cm-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.1 }}>
                O pequi não aceita passividade.
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.75, marginTop: 20 }}>
                Casca rústica e impenetrável por fora — como o mercado antes da análise: um bloco denso
                de dados macro, notícias e balanços indecifráveis. Por dentro, a polpa dourada: as
                small caps fora do radar institucional, as distorções que geram riqueza real.
              </p>
              <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.75, marginTop: 14 }}>
                E os espinhos no centro — quem morde sem cuidado se machuca. Por isso todo mapa sai
                com <strong style={{ color: 'var(--text)' }}>stop definido antes da entrada</strong>, e
                todo acerto <em>e todo erro</em> fica registrado em público.
              </p>
            </div>
          </div>
        </Revela>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto 3rem', padding: '0 1rem' }}><Costura /></div>

      {/* ── OS TRÊS PILARES ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem 5rem' }}>
        <div className="cm-3col">
          {[
            { emoji: '🪨', cor: '#8a9bbf', titulo: 'A casca', texto: 'Dados brutos da B3 — técnica, fundamentos, macro e milhares de notícias — descascados em leitura clara.' },
            { emoji: '✨', cor: '#f0b429', titulo: 'O ouro', texto: 'As assimetrias e as gemas fora do radar institucional, ranqueadas por um comitê que debate cada tese.' },
            { emoji: '🌵', cor: '#e53555', titulo: 'Os espinhos', texto: 'Risco de liquidez, governança duvidosa e armadilhas técnicas — sinalizados antes de você entrar.' },
          ].map((c, i) => (
            <Revela key={c.titulo} delay={i * 120}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${c.cor}`, borderRadius: 12, padding: '1.6rem', height: '100%' }}>
                <div style={{ fontSize: 26 }}>{c.emoji}</div>
                <div className="cm-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '10px 0 10px' }}>{c.titulo}</div>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{c.texto}</p>
              </div>
            </Revela>
          ))}
        </div>
      </section>

      {/* ── O RADAR NUNCA PARA (canvas) ── */}
      <section style={{ borderTop: '1px solid var(--border)', background: 'radial-gradient(ellipse at 50% 0%, rgba(212,146,10,0.06), transparent 60%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Revela>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)' }}>
              O ciclo de um dia de pregão
            </div>
            <h2 className="cm-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text)', margin: '0 0 32px' }}>
              O radar gira. As gemas acendem.
            </h2>
          </Revela>
          <RadarPequi />
          <div className="cm-3col" style={{ marginTop: 40, width: '100%' }}>
            {[
              { hora: '08:30', cor: '#5b9bff', titulo: 'Antes da abertura', texto: 'Varremos as 138 ações mais líquidas: RSI, médias, MACD, Bollinger, volume — com o macro e as notícias da madrugada na conta.' },
              { hora: '13:00', cor: '#f0b429', titulo: 'Segunda passada', texto: 'Com o pregão andando, o radar gira de novo. O que rompeu, o que confirmou e o que falhou aparece — semáforo do dia atualizado.' },
              { hora: 'Sempre', cor: '#00a63c', titulo: 'Tudo registrado', texto: 'Cada sugestão vira operação rastreada até bater stop ou alvo. A taxa de acerto do backtest inclui todas — sem esconder perdas.' },
            ].map((c, i) => (
              <Revela key={c.hora} delay={i * 120}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${c.cor}`, borderRadius: 12, padding: '1.4rem', height: '100%', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: c.cor, fontWeight: 700 }}>{c.hora}</div>
                  <div className="cm-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '8px 0 10px' }}>{c.titulo}</div>
                  <p style={{ color: 'var(--text2)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{c.texto}</p>
                </div>
              </Revela>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL — galho recortado emoldurando ── */}
      <section style={{ position: 'relative', borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* galho sem fundo: emoldura o canto superior, com parallax lento */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/galho-pequi.png" alt="" aria-hidden="true" className="galho-esq" style={{
          position: 'absolute', top: -30, left: -70, width: 460, opacity: 0.5,
          transform: 'scaleX(-1)', pointerEvents: 'none',
          filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.6))',
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/galho-pequi.png" alt="" aria-hidden="true" className="galho-dir" style={{
          position: 'absolute', top: -50, right: -90, width: 380, opacity: 0.32,
          pointerEvents: 'none', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.6))',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.92) 70%)' }} />
        <style>{`
          @media (max-width: 760px){
            .galho-esq { width: 240px !important; opacity: .3 !important; left: -80px !important; }
            .galho-dir { display: none; }
          }
        `}</style>
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '6rem 1rem', textAlign: 'center' }}>
          <Revela>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icone-pequi.png" alt="" width={64} height={64} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(240,180,41,0.5))', marginBottom: 20 }} />
            <h2 className="cm-display" style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 900, color: 'var(--text)', margin: 0, lineHeight: 1.05 }}>
              O pregão de hoje<br/>já foi descascado.
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginTop: 16 }}>
              Mapa da manhã e da tarde, 10 sugestões ranqueadas e o semáforo do dia.
            </p>
            <div style={{ marginTop: 30 }}>
              <Link href="/painel" className="cm-cta">Entrar no Caryo Map →</Link>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 26 }}>
              Ferramenta educacional de análise · Não é recomendação de investimento
            </p>
          </Revela>
        </div>
      </section>
    </main>
  )
}
