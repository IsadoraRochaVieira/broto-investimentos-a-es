import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos & Avisos Legais · Caryo Map',
  description: 'Natureza educacional do serviço, avisos de risco, uso de dados e limitação de responsabilidade do Caryo Map.',
}

const ATUALIZADO = '14 de julho de 2026'

function Secao({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', fontSize: 13 }}>{n}</span>
        {titulo}
      </h2>
      <div style={{ color: 'var(--text2)', fontSize: 14.5, lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  )
}

export default function TermosPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      {/* topo */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>← Caryo Map</Link>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 18 }}>
          Transparência
        </div>
        <h1 className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>Termos & Avisos Legais</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 6, fontFamily: 'var(--mono)' }}>Atualizado em {ATUALIZADO}</p>
      </div>

      {/* Destaque principal */}
      <div style={{
        background: 'var(--gold-bg)', border: '1px solid rgba(212,146,10,0.35)', borderLeft: '4px solid var(--gold)',
        borderRadius: 12, padding: '1.2rem 1.4rem', marginBottom: 34,
      }}>
        <p style={{ color: 'var(--text)', fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
          O Caryo Map é uma <strong>ferramenta educacional de análise e triagem técnica</strong> de
          ações. <strong>Não é recomendação de investimento</strong>, não constitui consultoria ou
          gestão de valores mobiliários, e não substitui a decisão de um profissional certificado.
          Toda decisão de investir é sua e por sua conta e risco.
        </p>
      </div>

      <Secao n="01" titulo="Natureza do serviço">
        <p>
          O Caryo Map, operado pela Pequi Estúdio (Brasília/DF), oferece análises técnicas,
          fundamentalistas e macroeconômicas de caráter <strong>informativo e educacional</strong>,
          geradas de forma automatizada a partir de dados públicos de mercado.
        </p>
        <p>
          Os conteúdos — relatórios, sugestões, o Comitê de IA (“A Mesa”), o Market Map e o
          backtesting — são <strong>ferramentas de estudo e triagem</strong>. Termos como “comprar”,
          “observar”, “evitar”, “entrada”, “stop” e “alvo” descrevem cenários técnicos hipotéticos
          para fins didáticos, e <strong>não</strong> devem ser interpretados como ordem, aconselhamento
          ou recomendação personalizada.
        </p>
      </Secao>

      <Secao n="02" titulo="Ausência de certificação e de recomendação personalizada">
        <p>
          A Pequi Estúdio e o Caryo Map <strong>não são analistas de valores mobiliários
          credenciados</strong> (CNPI), consultores ou administradores de carteira registrados na
          CVM, e não exercem qualquer atividade regulada por essa autarquia.
        </p>
        <p>
          Nenhum conteúdo aqui leva em conta a situação financeira, os objetivos ou o perfil de risco
          específicos de um usuário individual. O campo “capital para investir” serve apenas para
          contextualizar exemplos educacionais e <strong>não</strong> configura recomendação
          personalizada nos termos da Resolução CVM nº 20/2021.
        </p>
      </Secao>

      <Secao n="03" titulo="Riscos de investimento">
        <p>
          Investir em renda variável envolve <strong>risco de perda, inclusive do capital
          investido</strong>. Rentabilidade passada não representa garantia de resultados futuros.
          Os números de backtesting refletem simulações sobre dados históricos e não asseguram
          desempenho real.
        </p>
        <p>
          Antes de qualquer decisão, avalie seus objetivos e, se necessário, consulte um profissional
          certificado. Você é o único responsável pelas suas operações.
        </p>
      </Secao>

      <Secao n="04" titulo="Sobre os dados e a inteligência artificial">
        <p>
          Os dados provêm de fontes públicas de terceiros (por exemplo, Yahoo Finance e brapi.dev).
          Preços podem refletir o <strong>fechamento do dia anterior (D-1)</strong>, sofrer atraso ou
          conter imprecisões da fonte. Não garantimos exatidão, completude ou atualidade.
        </p>
        <p>
          Os debates do Comitê de IA são <strong>gerados por modelos de linguagem</strong> e podem
          conter erros, omissões ou vieses. São material de apoio ao estudo, não parecer profissional.
        </p>
      </Secao>

      <Secao n="05" titulo="Conta, privacidade e dados pessoais (LGPD)">
        <p>
          Para acessar áreas restritas, coletamos um <strong>nome de usuário</strong>, uma senha
          (armazenada de forma criptografada pelo provedor de autenticação) e, opcionalmente, um valor
          de capital para fins de exemplo. Não solicitamos CPF, dados bancários ou de cartão.
        </p>
        <p>
          Os dados de conta são tratados conforme a Lei nº 13.709/2018 (LGPD), usados apenas para
          operar o serviço e guardados junto ao nosso provedor de infraestrutura (Supabase). Você pode
          solicitar a exclusão da sua conta e dos seus dados a qualquer momento pelo contato abaixo.
        </p>
      </Secao>

      <Secao n="06" titulo="Limitação de responsabilidade">
        <p>
          O serviço é fornecido “no estado em que se encontra”, sem garantias de qualquer natureza. Na
          máxima extensão permitida pela lei, a Pequi Estúdio não se responsabiliza por perdas, danos
          ou prejuízos decorrentes do uso das informações aqui apresentadas, de decisões de
          investimento tomadas pelo usuário, ou de indisponibilidade e falhas de dados de terceiros.
        </p>
      </Secao>

      <Secao n="07" titulo="Propriedade intelectual e contato">
        <p>
          A marca Caryo Map, os textos, o design e o código são de titularidade da Pequi Estúdio. O uso
          da plataforma implica concordância com estes termos, que podem ser atualizados a qualquer
          tempo — a data no topo indica a última revisão.
        </p>
        <p>
          Dúvidas, pedidos de exclusão de dados ou contato:{' '}
          <a href="mailto:contato@caryomap.com.br" style={{ color: 'var(--blue-light)' }}>contato@caryomap.com.br</a>.
        </p>
      </Secao>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7 }}>
          Ao usar o Caryo Map você declara ter lido e compreendido estes avisos, e reconhece que todas
          as decisões de investimento são de sua exclusiva responsabilidade.
        </p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 14, color: 'var(--gold-bright)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          ← Voltar ao início
        </Link>
      </div>
    </main>
  )
}
