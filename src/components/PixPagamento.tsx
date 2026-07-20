'use client'
import { useState } from 'react'
import { PIX } from '@/lib/pix'

type Plano = 'anual' | 'mensal'

const INFO = {
  anual:  { valor: 'R$ 197,00', label: 'Anual · Membro Fundador', img: '/pix-anual.png',  code: PIX.anual },
  mensal: { valor: 'R$ 29,90',  label: 'Mensal',                  img: '/pix-mensal.png', code: PIX.mensal },
} as const

export default function PixPagamento() {
  const [plano, setPlano] = useState<Plano>('anual')
  const [copiado, setCopiado] = useState(false)
  const info = INFO[plano]

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(info.code)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch { /* clipboard bloqueado */ }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid rgba(212,146,10,0.3)',
      borderRadius: 16, padding: '1.6rem', marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>
          Pagar com Pix
        </span>
        <span style={{ background: 'rgba(0,166,60,0.12)', color: '#34d17e', border: '1px solid rgba(0,166,60,0.35)', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)' }}>
          CAI DIRETO NA CONTA
        </span>

        {/* seletor de plano */}
        <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {(['anual', 'mensal'] as Plano[]).map(p => (
            <button key={p} onClick={() => { setPlano(p); setCopiado(false) }} style={{
              padding: '5px 13px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              fontWeight: plano === p ? 700 : 400,
              background: plano === p ? 'var(--gold-bg)' : 'transparent',
              color: plano === p ? 'var(--gold-bright)' : 'var(--muted)',
            }}>{p === 'anual' ? 'Anual' : 'Mensal'}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* QR */}
        <div style={{ background: '#fff', padding: 10, borderRadius: 12, flexShrink: 0, lineHeight: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={info.img} alt={`QR Code Pix ${info.label}`} width={168} height={168} style={{ display: 'block', width: 168, height: 168 }} />
        </div>

        {/* Copia e cola */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{info.valor}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{info.label}</span>
          </div>

          <div style={{
            marginTop: 12, background: 'var(--bg)', border: '1px dashed var(--border2)', borderRadius: 8,
            padding: '9px 11px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)',
            wordBreak: 'break-all', lineHeight: 1.5, maxHeight: 64, overflow: 'hidden',
          }}>{info.code}</div>

          <button onClick={copiar} style={{
            marginTop: 10, width: '100%', cursor: 'pointer',
            background: copiado ? 'rgba(0,166,60,0.15)' : 'linear-gradient(135deg, #d4920a, #f0b429)',
            color: copiado ? '#34d17e' : '#0a0e14',
            border: copiado ? '1px solid rgba(0,166,60,0.4)' : 'none',
            borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14.5,
            transition: 'background 0.15s',
          }}>
            {copiado ? '✓ Código copiado — cole no seu banco' : 'Copiar código Pix'}
          </button>

          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.55 }}>
            Escaneie o QR ou cole o código no app do seu banco. Depois,{' '}
            <a href="mailto:contato@caryomap.com.br?subject=Comprovante%20de%20assinatura%20Caryo%20Map" style={{ color: 'var(--gold-bright)' }}>
              envie o comprovante
            </a>{' '}
            que a gente libera seu acesso.
          </p>
        </div>
      </div>
    </div>
  )
}
