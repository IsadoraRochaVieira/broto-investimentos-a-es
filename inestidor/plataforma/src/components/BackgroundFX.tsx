'use client'
import { useEffect, useRef } from 'react'

export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let scrollY = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', () => { scrollY = window.scrollY })

    // Orbs
    const orbs = [
      { x: 0.15, y: -0.05, r: 0.55, color: '#002776', speed: 0.00018, phase: 0    },
      { x: 0.85, y: 0.05,  r: 0.45, color: '#1052cc', speed: 0.00012, phase: 1.2  },
      { x: 0.5,  y: 0.5,   r: 0.35, color: '#0a2540', speed: 0.00022, phase: 2.4  },
      { x: 0.1,  y: 0.75,  r: 0.30, color: '#00a63c', speed: 0.00015, phase: 3.6  },
      { x: 0.9,  y: 0.85,  r: 0.25, color: '#1052cc', speed: 0.00020, phase: 0.8  },
    ]

    let t = 0
    const draw = () => {
      t += 1
      const W = canvas.width
      const H = canvas.height
      const parallaxOffset = scrollY * 0.15

      ctx.clearRect(0, 0, W, H)

      // Base background
      ctx.fillStyle = '#0a0e14'
      ctx.fillRect(0, 0, W, H)

      // Animated orbs
      for (const orb of orbs) {
        const cx = orb.x * W + Math.sin(t * orb.speed * 1.3 + orb.phase) * W * 0.08
        const cy = orb.y * H + Math.cos(t * orb.speed + orb.phase) * H * 0.06 - parallaxOffset * (orb.y + 0.3)
        const radius = orb.r * Math.max(W, H)

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        grad.addColorStop(0, orb.color + '28')
        grad.addColorStop(0.5, orb.color + '0e')
        grad.addColorStop(1, 'transparent')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Subtle dot grid
      const gridSize = 40
      const dotR = 0.8
      ctx.fillStyle = 'rgba(30,37,56,0.55)'
      for (let gx = 0; gx < W + gridSize; gx += gridSize) {
        for (let gy = -gridSize; gy < H + gridSize; gy += gridSize) {
          const gy2 = gy - (parallaxOffset % gridSize)
          ctx.beginPath()
          ctx.arc(gx, gy2, dotR, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Horizontal scan line
      const scanY = ((t * 0.3) % (H + 60)) - 30 - parallaxOffset * 0.4
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      scanGrad.addColorStop(0, 'transparent')
      scanGrad.addColorStop(0.5, 'rgba(16,82,204,0.04)')
      scanGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 20, W, 40)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
}
