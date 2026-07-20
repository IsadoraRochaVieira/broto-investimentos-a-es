import type { Metadata } from 'next'
import BrotoLanding from '@/components/broto/BrotoLanding'

export const metadata: Metadata = {
  title: 'BROTO · Educação financeira para a vida real',
  description:
    'Clareza para cuidar do seu dinheiro e construir o seu futuro. O BROTO transforma educação financeira em conhecimento prático, acessível e útil para a vida real.',
  icons: { icon: [{ url: '/broto/icon', type: 'image/png' }] },
}

export default function BrotoPage() {
  return <BrotoLanding />
}
