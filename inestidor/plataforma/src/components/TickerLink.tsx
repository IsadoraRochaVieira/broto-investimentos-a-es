'use client'

export default function TickerLink({
  ticker,
  style,
}: {
  ticker: string
  style?: React.CSSProperties
}) {
  return (
    <a
      href={`https://www.google.com/search?q=${ticker}+ação+B3+cotação`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={`Pesquisar ${ticker} no Google`}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        borderBottom: '1px dashed rgba(91,155,255,0.35)',
        cursor: 'alias',
        transition: 'color 0.12s, border-color 0.12s',
        ...style,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color = '#5b9bff'
        el.style.borderBottomColor = '#5b9bff'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color = ''
        el.style.borderBottomColor = 'rgba(91,155,255,0.35)'
      }}
    >
      {ticker}
    </a>
  )
}
