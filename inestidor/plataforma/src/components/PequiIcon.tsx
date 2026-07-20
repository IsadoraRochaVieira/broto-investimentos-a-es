export default function PequiIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Fruto de Pequi">
      {/* corpo do fruto - amarelo-dourado */}
      <ellipse cx="32" cy="36" rx="20" ry="18" fill="#d4a017"/>
      <ellipse cx="32" cy="35" rx="18" ry="16" fill="#e8b820"/>
      {/* reflexo */}
      <ellipse cx="26" cy="28" rx="6" ry="4" fill="#f5d060" opacity="0.5"/>
      {/* espinhos do caroço interno - característica do pequi */}
      <circle cx="32" cy="36" r="9" fill="#c8860e"/>
      <circle cx="32" cy="36" r="7" fill="#b07010"/>
      {/* espinhos */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 32 + Math.cos(rad) * 7
        const y1 = 36 + Math.sin(rad) * 7
        const x2 = 32 + Math.cos(rad) * 11
        const y2 = 36 + Math.sin(rad) * 11
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b5e0a" strokeWidth="1.2" strokeLinecap="round"/>
      })}
      {/* folhas no topo */}
      <ellipse cx="24" cy="18" rx="5" ry="9" fill="#2d7a2d" transform="rotate(-30 24 18)"/>
      <ellipse cx="32" cy="15" rx="4" ry="10" fill="#3a8c3a" transform="rotate(0 32 15)"/>
      <ellipse cx="40" cy="18" rx="5" ry="9" fill="#2d7a2d" transform="rotate(30 40 18)"/>
      {/* nervuras das folhas */}
      <line x1="24" y1="22" x2="22" y2="12" stroke="#1d5c1d" strokeWidth="0.8"/>
      <line x1="32" y1="24" x2="32" y2="10" stroke="#1d5c1d" strokeWidth="0.8"/>
      <line x1="40" y1="22" x2="42" y2="12" stroke="#1d5c1d" strokeWidth="0.8"/>
      {/* cabo */}
      <rect x="30" y="22" width="4" height="6" rx="2" fill="#6b4c11"/>
    </svg>
  )
}
