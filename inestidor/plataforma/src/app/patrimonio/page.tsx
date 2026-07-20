'use client'
import { useEffect, useRef } from 'react'
import Nav from '@/components/Nav'

const SEMANAS = [
  { label: 'S1',  radar: 10000, cdi: 10000,  ibov: 10000  },
  { label: 'S2',  radar: 10200, cdi: 10027,  ibov: 10150  },
  { label: 'S3',  radar: 10410, cdi: 10054,  ibov: 9900   },
  { label: 'S4',  radar: 10250, cdi: 10081,  ibov: 10200  },
  { label: 'S5',  radar: 10680, cdi: 10108,  ibov: 10450  },
  { label: 'S6',  radar: 10890, cdi: 10135,  ibov: 10300  },
  { label: 'S7',  radar: 11100, cdi: 10162,  ibov: 10550  },
  { label: 'S8',  radar: 10900, cdi: 10189,  ibov: 10100  },
  { label: 'S9',  radar: 11250, cdi: 10216,  ibov: 10400  },
  { label: 'S10', radar: 11600, cdi: 10243,  ibov: 10700  },
  { label: 'S11', radar: 11850, cdi: 10270,  ibov: 10600  },
  { label: 'S12', radar: 12100, cdi: 10297,  ibov: 10900  },
]

const retorno = (arr: number[], ini: number) => (((arr[arr.length - 1] - ini) / ini) * 100).toFixed(1)

export default function PatrimonioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth * 2
    const H = canvas.height = 400
    canvas.style.height = '200px'
    ctx.scale(2, 2)
    const w = W / 2, h = H / 2

    const pad = { top: 20, right: 20, bottom: 40, left: 60 }
    const cw = w - pad.left - pad.right
    const ch = h - pad.top - pad.bottom

    const allVals = SEMANAS.flatMap(s => [s.radar, s.cdi, s.ibov])
    const minV = Math.min(...allVals) * 0.995
    const maxV = Math.max(...allVals) * 1.005

    const toX = (i: number) => pad.left + (i / (SEMANAS.length - 1)) * cw
    const toY = (v: number) => pad.top + ch - ((v - minV) / (maxV - minV)) * ch

    ctx.fillStyle = '#0f1520'
    ctx.fillRect(0, 0, w, h)

    // Grid lines
    ctx.strokeStyle = '#1c2538'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * ch
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
      const val = maxV - (i / 4) * (maxV - minV)
      ctx.fillStyle = '#4d5f7a'
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('R$' + Math.round(val / 100) * 100, pad.left - 4, y + 4)
    }

    // X labels
    SEMANAS.forEach((s, i) => {
      ctx.fillStyle = '#4d5f7a'
      ctx.font = '9px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(s.label, toX(i), h - pad.bottom + 14)
    })

    const drawLine = (key: 'radar' | 'cdi' | 'ibov', color: string, dash: number[] = []) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = key === 'radar' ? 2.5 : 1.5
      ctx.setLineDash(dash)
      SEMANAS.forEach((s, i) => {
        const x = toX(i), y = toY(s[key])
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Dots
      SEMANAS.forEach((s, i) => {
        if (key !== 'radar') return
        ctx.beginPath()
        ctx.arc(toX(i), toY(s[key]), 3, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })
    }

    drawLine('cdi', '#5b9bff', [4, 3])
    drawLine('ibov', '#4d5f7a', [2, 2])
    drawLine('radar', '#00a63c')

    // Legenda
    const leg = [
      { label: 'B3 Radar', color: '#00a63c' },
      { label: 'CDI', color: '#5b9bff' },
      { label: 'Ibovespa', color: '#4d5f7a' },
    ]
    leg.forEach((l, i) => {
      const lx = pad.left + i * 90
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx + 20, 12)
      ctx.strokeStyle = l.color; ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = l.color; ctx.font = '10px Inter'; ctx.textAlign = 'left'
      ctx.fillText(l.label, lx + 24, 16)
    })
  }, [])

  const rdArr = SEMANAS.map(s => s.radar)
  const cdiArr = SEMANAS.map(s => s.cdi)
  const ibArr = SEMANAS.map(s => s.ibov)
  const ini = 10000

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Nav ativa="patrimonio" />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5' }}>Curva de Patrimônio</h1>
        <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.25rem' }}>Desempenho acumulado das sugestões vs benchmarks</p>
      </header>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'B3 Radar (12 sem)', valor: `+${retorno(rdArr, ini)}%`, cor: '#34d17e', sub: `R$ ${rdArr[rdArr.length-1].toLocaleString('pt-BR')}` },
          { label: 'CDI (12 sem)',      valor: `+${retorno(cdiArr, ini)}%`, cor: '#5b9bff', sub: `R$ ${cdiArr[cdiArr.length-1].toLocaleString('pt-BR')}` },
          { label: 'Ibovespa (12 sem)', valor: `+${retorno(ibArr, ini)}%`,  cor: '#4d5f7a', sub: `R$ ${ibArr[ibArr.length-1].toLocaleString('pt-BR')}` },
          { label: 'Alfa vs CDI',       valor: `+${(parseFloat(retorno(rdArr,ini)) - parseFloat(retorno(cdiArr,ini))).toFixed(1)}%`, cor: '#d4920a', sub: 'excesso de retorno' },
        ].map(c => (
          <div key={c.label} style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1rem' }}>
            <div style={{ color: '#4d5f7a', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.label}</div>
            <div style={{ color: c.cor, fontWeight: 800, fontSize: '1.4rem', margin: '0.3rem 0' }}>{c.valor}</div>
            <div style={{ color: '#4d5f7a', fontSize: '0.75rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      </div>

      {/* Tabela semanal */}
      <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid #1c2538', fontSize: '0.72rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Semana a semana
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr>
                {['Semana','B3 Radar','CDI','Ibovespa','Radar vs CDI'].map(h => (
                  <th key={h} style={{ padding: '0.55rem 1rem', borderBottom: '1px solid #1c2538', textAlign: 'left', color: '#4d5f7a', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEMANAS.map((s, i) => {
                const vsIni = ((s.radar - ini) / ini * 100).toFixed(1)
                const vsCdi = (((s.radar - s.cdi) / ini) * 100).toFixed(1)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1c2538' }}>
                    <td style={{ padding: '0.55rem 1rem', color: '#e8edf5', fontWeight: 600 }}>{s.label}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#34d17e', fontWeight: 700 }}>R$ {s.radar.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#5b9bff' }}>R$ {s.cdi.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#4d5f7a' }}>R$ {s.ibov.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.55rem 1rem', color: parseFloat(vsCdi) >= 0 ? '#34d17e' : '#e53555', fontWeight: 700 }}>
                      {parseFloat(vsCdi) >= 0 ? '+' : ''}{vsCdi}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ color: '#4d5f7a', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
        Dados simulados com base nas sugestões históricas do B3 Radar · Não é garantia de retorno futuro
      </p>
    </main>
  )
}
