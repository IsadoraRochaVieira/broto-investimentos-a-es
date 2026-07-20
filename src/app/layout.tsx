import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import SiteChrome from '@/components/SiteChrome'

/* Sistema tipográfico "Editorial do Cerrado":
   Fraunces (serifada quente e orgânica) = a voz da marca, o fruto.
   IBM Plex Sans + Mono (engenharia, dígitos tabulares) = o dado, o mercado. */
const display = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],   // fonte variável: peso via CSS, com o "wonk" orgânico
  variable: '--font-display',
})
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Caryo Map · Radar de análise da B3',
  description: 'Descascamos o mercado, mapeamos o ouro e blindamos o investidor contra os espinhos. Análise técnica, fundamentalista e macro das ações da B3 — Caryo Map, por Pequi Estúdio.',
  icons: { icon: '/icone-pequi.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // as variáveis de fonte precisam existir no :root, onde o globals.css as consome
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
        </AuthProvider>
      </body>
    </html>
  )
}
