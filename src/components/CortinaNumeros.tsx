'use client'
import { useEffect, useRef } from 'react'

/**
 * Cortina de Números — tickers e preços da B3 respirando no fundo.
 * O número sob o cursor acende em ouro e (opcional) emite um tick suave.
 */
const TICKERS = ['PETR4','VALE3','ITUB4','BBAS3','WEGE3','MGLU3','B3SA3','ABEV3','PRIO3','BBSE3',
  'UGPA3','RENT3','SUZB3','GGBR4','RADL3','EQTL3','CMIG4','ELET3','CSAN3','LREN3','HAPV3','RAIZ4',
  'TOTS3','EMBR3','JBSS3','VBBR3','ASAI3','NTCO3','CPLE6','CMIN3']

export default function CortinaNumeros({ som = false }: { som?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cw = 118, ch = 34
    const mouse = { x: -9999, y: -9999 }
    type Cell = { x: number; y: number; tk: string; pr: string; up: boolean; ph: number; flip: number; tl: number }
    let cells: Cell[] = []
    let raf = 0, t = 0
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const price = () => rnd(2, 120).toFixed(2).replace('.', ',')

    // som opcional
    let actx: AudioContext | null = null
    let lastBeep = 0, lastCell = -1
    const beep = (freq: number) => {
      if (!som) return
      if (!actx) { try { actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() } catch { return } }
      const now = actx.currentTime
      if (now - lastBeep < 0.05) return
      lastBeep = now
      const o = actx.createOscillator(), g = actx.createGain()
      o.type = 'sine'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.04, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13)
      o.connect(g); g.connect(actx.destination); o.start(now); o.stop(now + 0.14)
    }

    let W = 0, H = 0
    const medir = () => {
      const p = c.parentElement
      W = p ? p.clientWidth : c.getBoundingClientRect().width
      H = p ? p.clientHeight : c.getBoundingClientRect().height
    }
    const build = () => {
      medir()
      if (W < 2 || H < 2) return
      c.width = W * DPR; c.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      const cols = Math.ceil(W / cw) + 1, rows = Math.ceil(H / ch) + 1
      cells = []
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        cells.push({ x: x * cw + 10, y: y * ch + 22, tk: TICKERS[(x * 7 + y * 3) % TICKERS.length], pr: price(), up: Math.random() > 0.5, ph: Math.random() * 6.28, flip: rnd(2, 6), tl: 0 })
      }
    }

    const draw = () => {
      t += 0.016
      if (!cells.length) build()
      ctx.clearRect(0, 0, W, H)
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
      for (const cell of cells) {
        cell.tl += 0.016
        if (cell.tl > cell.flip) { cell.tl = 0; cell.pr = price(); cell.up = Math.random() > 0.45 }
        const dx = cell.x - mouse.x, dy = cell.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy)
        const near = Math.max(0, 1 - d / 150)
        const base = 0.09 + 0.05 * Math.sin(t * 0.8 + cell.ph)
        ctx.fillStyle = `rgba(138,155,191,${base + near * 0.5})`
        ctx.fillText(cell.tk, cell.x, cell.y)
        ctx.fillStyle = near > 0.02
          ? `rgba(240,180,65,${0.25 + near * 0.75})`
          : cell.up ? `rgba(0,166,60,${base + 0.10})` : `rgba(229,53,85,${base + 0.10})`
        ctx.fillText((cell.up ? '▲' : '▼') + cell.pr, cell.x + 52, cell.y)
        if (near > 0.6) {
          ctx.save(); ctx.shadowColor = 'rgba(240,180,41,0.9)'; ctx.shadowBlur = 16
          ctx.fillStyle = `rgba(240,180,41,${near})`; ctx.fillText((cell.up ? '▲' : '▼') + cell.pr, cell.x + 52, cell.y); ctx.restore()
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect()
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
      let best = 1e9, bi = -1
      for (let i = 0; i < cells.length; i++) { const dx = cells[i].x + 52 - mouse.x, dy = cells[i].y - 8 - mouse.y, dd = dx * dx + dy * dy; if (dd < best) { best = dd; bi = i } }
      if (bi !== lastCell && best < 2600) { lastCell = bi; beep(cells[bi]?.up ? 660 : 520) }
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    build(); draw()
    c.addEventListener('mousemove', onMove)
    c.addEventListener('mouseleave', onLeave)
    const ro = new ResizeObserver(() => build())
    if (c.parentElement) ro.observe(c.parentElement)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('mousemove', onMove)
      c.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
    }
  }, [som])

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
