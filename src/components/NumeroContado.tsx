'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Contagem nos grandes números — proposta da Marina (motion).
 * O dado "aterrissa" em vez de aparecer parado. Aceita valores como
 * "138", "2×", "100%", "176.607" — anima só a parte numérica e mantém
 * prefixo/sufixo intactos.
 */
export default function NumeroContado({
  valor,
  duracao = 1200,
  style,
  className,
}: {
  valor: string
  duracao?: number
  style?: React.CSSProperties
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [texto, setTexto] = useState(valor)
  const jaRodou = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // separa prefixo + número + sufixo (ex.: "R$ 176.607,2" / "2×" / "100%")
    const m = valor.match(/^([^\d-]*)([-\d.,]+)(.*)$/)
    if (!m) { setTexto(valor); return }
    const [, pre, numStr, suf] = m

    // pt-BR: "." é milhar, "," é decimal
    const limpo = numStr.replace(/\./g, '').replace(',', '.')
    const alvo = parseFloat(limpo)
    if (!isFinite(alvo)) { setTexto(valor); return }

    const casas = numStr.includes(',') ? (numStr.split(',')[1]?.length ?? 0) : 0
    const temMilhar = numStr.includes('.')
    const fmt = (v: number) =>
      pre + (temMilhar || Math.abs(alvo) >= 1000
        ? v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
        : v.toFixed(casas).replace('.', ',')) + suf

    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduz) { setTexto(valor); return }

    setTexto(fmt(0))
    let raf = 0
    const anima = () => {
      const t0 = performance.now()
      const passo = (now: number) => {
        const p = Math.min((now - t0) / duracao, 1)
        const eased = 1 - Math.pow(1 - p, 3)   // easeOutCubic
        setTexto(fmt(alvo * eased))
        if (p < 1) raf = requestAnimationFrame(passo)
        else setTexto(valor)                    // trava no valor original exato
      }
      raf = requestAnimationFrame(passo)
    }

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !jaRodou.current) { jaRodou.current = true; anima(); obs.disconnect() }
    }, { threshold: 0 })
    obs.observe(el)

    return () => { cancelAnimationFrame(raf); obs.disconnect() }
  }, [valor, duracao])

  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{texto}</span>
}
