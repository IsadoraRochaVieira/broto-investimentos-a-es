'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { EMPRESAS, GRUPOS, type EmpresaBroto } from '@/lib/brotoEmpresas'

/* Os filtros nascem dos dados: só aparece grupo que realmente tem empresa,
   e cada um mostra quantas — assim ninguém clica num filtro vazio. */
const FILTROS: { label: string; total: number }[] = [
  { label: 'Todas', total: EMPRESAS.length },
  ...GRUPOS.map((g) => ({ label: g, total: EMPRESAS.filter((e) => e.grupo === g).length }))
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total),
]

type ConceitoBroto = {
  icon: string
  title: string
  short: string
  body: string
  example: string
  art?: string
  artAlt?: string
}

const CONCEITOS: ConceitoBroto[] = [
  { icon: '🧯', title: 'Reserva de emergência', short: 'O dinheiro que impede um imprevisto de virar dívida.', body: 'Antes de investir para crescer, você monta uma reserva para se proteger. Ela precisa estar num lugar seguro e fácil de resgatar — normalmente o equivalente a alguns meses do seu custo de vida.', example: 'Se sua vida custa R$ 2 mil por mês, a reserva é o colchão para atravessar desemprego, doença ou conserto urgente sem vender investimentos na pior hora.' },
  { icon: '🌡️', title: 'Inflação', short: 'Quando o mesmo dinheiro compra cada vez menos.', body: 'Inflação é a alta geral dos preços. Se o seu dinheiro rende menos que ela, o número pode até subir na tela, mas o seu poder de compra diminui.', example: 'R$ 100 que compravam um carrinho cheio passam a comprar meio carrinho. Investir também é tentar preservar o que o dinheiro consegue comprar.' },
  { icon: '🌱', title: 'Juros compostos', short: 'Rendimento gerando novo rendimento com o tempo.', body: 'Nos juros compostos, você passa a ganhar não só sobre o que colocou, mas também sobre o que já rendeu. No começo parece lento; depois, o tempo faz a parte pesada.', example: 'É uma muda que dá galhos, e esses galhos dão novos galhos. A constância costuma importar mais que a pressa.' },
  { icon: '⚖️', title: 'Risco e retorno', short: 'Não existe ganho maior sem alguma incerteza maior.', body: 'Todo investimento troca alguma segurança por uma possibilidade de retorno. Promessa de lucro alto, rápido e garantido é sinal de perigo — não de oportunidade.', example: 'Dinheiro do aluguel do mês que vem não deve correr o mesmo risco do dinheiro planejado para daqui a vinte anos.' },
  { icon: '🧺', title: 'Diversificação', short: 'Não depender de uma única empresa ou tipo de investimento.', body: 'Diversificar é espalhar o risco entre negócios, setores e tipos de ativo. Quando uma parte vai mal, ela não derruba tudo que você construiu.', example: 'É a diferença entre plantar uma lavoura inteira de uma coisa só e manter uma horta com cultivos diferentes.' },
  { icon: '🚪', title: 'Liquidez', short: 'A facilidade de transformar um investimento em dinheiro.', body: 'Liquidez diz quanto tempo e dificuldade existem entre pedir o resgate e ter o dinheiro disponível. Mais liquidez não significa necessariamente mais retorno.', example: 'A reserva precisa de uma porta de saída rápida. Um investimento para décadas pode aceitar uma porta mais demorada.' },
  { icon: '〽️', title: 'Volatilidade', short: 'O sobe e desce do preço no caminho.', body: 'Volatilidade é a intensidade com que um preço varia. Ela incomoda, mas uma queda de preço não significa automaticamente que a empresa deixou de ser boa.', example: 'O clima muda todo dia; o crescimento de uma árvore é observado em anos. Preço e valor também vivem em relógios diferentes.' },
  { icon: '🪙', title: 'Dividendos', short: 'Uma parte do lucro distribuída aos donos.', body: 'Quando uma empresa lucra, pode reinvestir no próprio negócio ou dividir uma parte com os acionistas. Esse pagamento é o dividendo.', example: 'Ter ação não é ganhar dinheiro mágico: é participar, na sua proporção, do resultado de uma empresa real.' },
  { icon: '💳', title: 'Dívida cara vem primeiro', short: 'Quitar juro alto rende mais que quase qualquer investimento.', body: 'Cartão rotativo e cheque especial cobram juros muito acima do que um investimento comum costuma render. Enquanto essa dívida existe, ela corre mais rápido que o seu dinheiro aplicado.', example: 'Pagar uma dívida que cobra juros altos é um retorno garantido e imediato. Investir antes de quitá-la é como encher um balde furado.' },
  { icon: '🎣', title: 'Golpe e dinheiro fácil', short: 'Retorno alto, rápido e garantido não existe junto.', body: 'Pirâmide, "robô de trade", grupo de sinais e promessa de porcentagem fixa por dia são as formas mais comuns de perder tudo. Quem paga os primeiros é o dinheiro dos últimos que entraram.', example: 'Se alguém promete lucro certo e pressa para você entrar, o produto não é investimento — é a isca. Desconfiar é a habilidade financeira mais rentável que existe.' },
  { icon: '🎚️', title: 'Selic', short: 'A taxa básica de juros que influencia todo o resto.', body: 'A Selic é a taxa definida pelo Banco Central para tentar controlar a inflação. Ela serve de referência para o rendimento da renda fixa e para o custo dos empréstimos no país inteiro.', example: 'Quando a Selic sobe, guardar dinheiro tende a render mais — e pegar emprestado fica mais caro. Ela mexe nos dois lados da sua vida financeira.' },
  { icon: '🧾', title: 'Renda fixa e renda variável', short: 'Duas formas diferentes de emprestar ou de ser sócio.', body: 'Na renda fixa você empresta dinheiro (a um banco ou ao governo) e conhece antes a regra do rendimento. Na renda variável você vira sócio de um negócio, sem retorno combinado.', example: 'Emprestar costuma ser mais previsível; ser sócio oscila mais, mas participa do crescimento da empresa. Muita gente usa os dois, com objetivos diferentes.' },
  { icon: '🏛️', title: 'Tesouro Direto', short: 'Emprestar dinheiro para o governo brasileiro.', body: 'No Tesouro Direto você compra um título público, ou seja, empresta ao governo e recebe de volta com juros no prazo combinado. É acessível e existem títulos com objetivos diferentes.', example: 'É considerado o investimento de menor risco de calote dentro do país, porque o devedor é o próprio governo. Menor risco não significa ausência de oscilação antes do vencimento.' },
  { icon: '🛟', title: 'FGC', short: 'Uma proteção para o seu dinheiro se o banco quebrar.', body: 'O Fundo Garantidor de Créditos devolve o valor aplicado, até um limite por CPF e por instituição, em alguns investimentos de renda fixa se o banco emissor quebrar.', example: 'É por isso que vale conferir se o investimento tem essa cobertura e não concentrar tudo numa instituição só. Proteção tem limite — conhecer o limite faz parte.' },
  { icon: '📊', title: 'Orçamento', short: 'Saber para onde o seu dinheiro está indo.', body: 'Orçamento é o retrato honesto do que entra e do que sai por mês. Sem ele, é difícil saber quanto realmente sobra para guardar sem se apertar depois.', example: 'A maior parte das pessoas descobre, ao anotar, que gasta bem mais do que imaginava com pequenos valores repetidos. O que não é medido não é ajustado.' },
  { icon: '🔀', title: 'Custo de oportunidade', short: 'Todo sim para uma escolha é um não para outra.', body: 'Ao usar o dinheiro numa coisa, você abre mão do que ele poderia fazer em outra. Isso vale para gastar, investir e até para deixar parado.', example: 'Deixar dinheiro parado na conta parece neutro, mas tem um custo: a inflação corrói e o rendimento que ele teria em outro lugar não acontece.' },
  { icon: '🧮', title: 'Imposto sobre investimento', short: 'Parte do ganho vai para o leão — e isso muda a conta.', body: 'Boa parte dos investimentos tem imposto sobre o lucro, com regras que mudam conforme o tipo e o prazo. Alguns têm isenção em situações específicas.', example: 'Comparar rendimentos sem considerar imposto e taxas leva a conclusões erradas. O que importa é quanto sobra no fim, não o número do anúncio.' },
  { icon: '🏢', title: 'Fundos imobiliários', short: 'Virar dono de um pedacinho de imóvel alugado.', body: 'Um fundo imobiliário junta o dinheiro de muitas pessoas para investir em imóveis ou em papéis ligados a imóveis, e costuma distribuir os aluguéis recebidos aos cotistas.', example: 'É uma forma de participar do mercado imobiliário sem comprar um imóvel inteiro — com as mesmas incertezas de vacância, inadimplência e preço.' },
  { icon: '📅', title: 'Constância', short: 'Aportar sempre costuma valer mais que acertar o momento.', body: 'Investir um valor com regularidade dilui o preço médio ao longo do tempo e reduz a chance de colocar tudo justo no pior momento. É disciplina, não adivinhação.', example: 'Tentar prever o melhor dia é onde mora a mentalidade de aposta. A rotina simples e repetida tende a resistir melhor que a tentativa de acertar o timing.' },
  { icon: '🧓', title: 'Aposentadoria', short: 'O INSS costuma ser um piso, não o plano inteiro.', body: 'A aposentadoria pública tem teto e regras próprias, e para muita gente o benefício será menor que a renda atual. Construir uma reserva de longo prazo complementa esse futuro.', example: 'Quanto mais cedo começa, menos esforço mensal é necessário, porque o tempo faz parte do trabalho. É o investimento em que a pressa não ajuda, mas o começo cedo sim.' },
  { icon: '📐', title: 'CDI', short: 'Uma referência diária muito usada na renda fixa.', body: 'O CDI acompanha de perto a Selic e nasce dos empréstimos de curtíssimo prazo entre bancos. Muitos CDBs, fundos e contas remuneradas dizem render uma porcentagem do CDI. Ele funciona como uma régua para comparar aplicações.', example: 'Um CDB que rende 100% do CDI acompanha essa referência. Um que rende 110% paga um pouco mais, mas você ainda precisa comparar prazo, imposto, liquidez e risco do banco.', art: '/broto/economia/juros-credito.webp', artAlt: 'Círculos de papel crescendo ao redor de uma moeda sobre uma mesa de madeira, atravessados por uma raiz' },
  { icon: '🏦', title: 'Spread bancário', short: 'A diferença entre o que o banco paga e o que cobra pelo dinheiro.', body: 'Bancos captam recursos pagando uma taxa e emprestam cobrando outra. A diferença ajuda a cobrir inadimplência, impostos, custos e lucro. No Brasil, esse intervalo pode ser grande e explica parte do crédito caro.', example: 'O dinheiro na aplicação pode render uma taxa bem menor que os juros cobrados no cartão ou empréstimo. Essa distância não é apenas lucro: reúne risco, custos e regras do sistema.', art: '/broto/economia/juros-credito.webp', artAlt: 'Círculos de papel crescendo ao redor de uma moeda sobre uma mesa de madeira, atravessados por uma raiz' },
  { icon: '🌍', title: 'Câmbio', short: 'O preço de uma moeda medido em outra moeda.', body: 'Quando o dólar sobe ou cai diante do real, não muda apenas o custo de viajar. O câmbio afeta combustíveis, remédios, eletrônicos, alimentos e empresas que exportam ou dependem de peças importadas.', example: 'Mesmo sem comprar dólar, você sente o câmbio no celular importado, no trigo do pão, no combustível e na receita de empresas brasileiras que vendem para fora.', art: '/broto/economia/cambio-comercio.webp', artAlt: 'Porto editorial com café, frutas, minério e componentes industriais equilibrados por uma membrana translúcida' },
  { icon: '🚢', title: 'Balança comercial', short: 'A diferença entre o que o país exporta e importa.', body: 'Exportações trazem recursos de fora; importações compram bens e serviços estrangeiros. Quando o país exporta mais, há superávit comercial. Quando importa mais, há déficit. Esse resultado influencia câmbio e setores inteiros.', example: 'Uma safra forte pode aumentar exportações. A compra de máquinas, combustíveis e componentes estrangeiros aumenta importações. A balança registra o encontro desses fluxos.', art: '/broto/economia/cambio-comercio.webp', artAlt: 'Porto editorial com café, frutas, minério e componentes industriais equilibrados por uma membrana translúcida' },
  { icon: '🏘️', title: 'PIB', short: 'Uma medida do valor produzido pela economia.', body: 'O Produto Interno Bruto soma o valor dos bens e serviços finais produzidos no país. Ajuda a entender se a atividade está crescendo, parada ou encolhendo, mas não mostra sozinho como a renda é distribuída ou se a vida melhorou.', example: 'Fábricas produzindo, lojas vendendo, serviços prestados e obras avançando entram no PIB. Ele é um termômetro importante, mas não conta toda a história de cada família.', art: '/broto/economia/pib-emprego.webp', artAlt: 'Corte surreal de bairro brasileiro com moradias, comércio, transporte e raízes luminosas subterrâneas' },
  { icon: '🧑🏽‍🔧', title: 'Emprego e renda', short: 'O trabalho conecta produção, consumo e qualidade de vida.', body: 'A taxa de desemprego mostra quantas pessoas procuram trabalho e não encontram. Também importam informalidade, salários, horas trabalhadas e poder de compra. Mais emprego costuma fortalecer o consumo; renda fraca limita escolhas.', example: 'Duas cidades podem ter desemprego parecido, mas realidades diferentes se uma oferece empregos formais e salários melhores enquanto a outra depende de renda instável.', art: '/broto/economia/pib-emprego.webp', artAlt: 'Corte surreal de bairro brasileiro com moradias, comércio, transporte e raízes luminosas subterrâneas' },
  { icon: '🏺', title: 'Política fiscal', short: 'As decisões do governo sobre arrecadação e gastos.', body: 'O governo arrecada impostos e usa recursos em serviços, investimentos, salários, benefícios e dívidas. Política fiscal é a forma como essas entradas e saídas são organizadas. Gastar pode estimular a economia, mas exige financiamento e planejamento.', example: 'Construir uma estrada pode gerar empregos hoje e melhorar a produtividade amanhã. Porém, todo gasto precisa ser financiado por receitas, impostos ou dívida.', art: '/broto/economia/fiscal-divida.webp', artAlt: 'Vaso de cerâmica recebe recursos e distribui água para escola, saúde, estrada e transporte' },
  { icon: '🧾', title: 'Dívida pública', short: 'Recursos captados pelo governo para financiar obrigações.', body: 'Quando a arrecadação não cobre todas as despesas, o governo emite títulos e toma recursos emprestados. A dívida não é automaticamente boa ou ruim: importam tamanho, custo, prazo, moeda e o destino do dinheiro.', example: 'Comprar um título do Tesouro é emprestar dinheiro ao governo. Em troca, ele promete devolver no prazo combinado seguindo a remuneração daquele título.', art: '/broto/economia/fiscal-divida.webp', artAlt: 'Vaso de cerâmica recebe recursos e distribui água para escola, saúde, estrada e transporte' },
  { icon: '🛠️', title: 'Produtividade', short: 'Produzir melhor com os recursos disponíveis.', body: 'Produtividade cresce quando pessoas e empresas geram mais valor com tempo, trabalho, máquinas e conhecimento. Educação, infraestrutura, tecnologia e boa gestão podem elevar a produção sem exigir apenas mais horas trabalhadas.', example: 'Uma padaria não melhora só fazendo o padeiro trabalhar mais. Um forno eficiente, menos desperdício e um processo melhor aumentam a produção com o mesmo esforço.', art: '/broto/economia/ciclos-produtividade.webp', artAlt: 'Campo circular no cerrado com diferentes fases de cultivo, água, ferramentas e raízes conectadas' },
  { icon: '🔄', title: 'Ciclos econômicos', short: 'Expansões e desacelerações que se alternam na economia.', body: 'A economia não cresce em linha reta. Há fases com mais produção, emprego e consumo, e fases de desaceleração ou recessão. Juros, crédito, confiança, acontecimentos externos e decisões públicas influenciam essas mudanças.', example: 'Na expansão, empresas podem vender e contratar mais. Na desaceleração, famílias adiam compras e negócios reduzem investimentos. O momento atual não dura para sempre.', art: '/broto/economia/ciclos-produtividade.webp', artAlt: 'Campo circular no cerrado com diferentes fases de cultivo, água, ferramentas e raízes conectadas' },
]

const ECONOMIA_ARTES = [
  { src: '/broto/economia/juros-credito.webp', title: 'O custo do dinheiro', topics: 'CDI · crédito · spread' },
  { src: '/broto/economia/cambio-comercio.webp', title: 'O Brasil em movimento', topics: 'câmbio · exportações · importações' },
  { src: '/broto/economia/pib-emprego.webp', title: 'O que uma economia produz', topics: 'PIB · emprego · renda' },
  { src: '/broto/economia/fiscal-divida.webp', title: 'As escolhas do Estado', topics: 'política fiscal · dívida pública' },
  { src: '/broto/economia/ciclos-produtividade.webp', title: 'Crescimento não é linha reta', topics: 'produtividade · ciclos econômicos' },
] as const

export default function BrotoLanding() {
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const sproutVideoRef = useRef<HTMLVideoElement>(null)
  const inkVideoRef = useRef<HTMLVideoElement>(null)
  const finalVideoRef = useRef<HTMLVideoElement>(null)
  const [filtro, setFiltro] = useState<string>('Todas')
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(12)
  const [navCompacta, setNavCompacta] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [conceitoAtivo, setConceitoAtivo] = useState<number | null>(0)
  const [movimentoPausado, setMovimentoPausado] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setNavCompacta(y > 70)
      document.documentElement.style.setProperty('--br-scroll', `${Math.min(y, 700)}px`)
      const max = document.documentElement.scrollHeight - window.innerHeight
      document.documentElement.style.setProperty('--br-progress', `${max > 0 ? (y / max) * 100 : 0}%`)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const videos = [heroVideoRef.current, sproutVideoRef.current, inkVideoRef.current, finalVideoRef.current].filter(Boolean) as HTMLVideoElement[]
    const playVideos = () => movimentoPausado ? videos.forEach((video) => video.pause()) : videos.forEach((video) => video.play().catch(() => undefined))
    playVideos()
    document.addEventListener('visibilitychange', playVideos)
    window.addEventListener('pointerdown', playVideos, { once: true })
    return () => {
      document.removeEventListener('visibilitychange', playVideos)
      window.removeEventListener('pointerdown', playVideos)
    }
  }, [movimentoPausado])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setMovimentoPausado(true)
  }, [])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return EMPRESAS.filter((empresa) => {
      const bateFiltro = filtro === 'Todas' || empresa.grupo === filtro
      const bateBusca = !termo || `${empresa.nome} ${empresa.ticker} ${empresa.setor} ${empresa.frase}`.toLocaleLowerCase('pt-BR').includes(termo)
      return bateFiltro && bateBusca
    })
  }, [busca, filtro])

  useEffect(() => setLimite(12), [busca, filtro])

  return (
    <div className={`broto-page ${movimentoPausado ? 'motion-paused' : ''}`}>
      <BrotoCSS />
      <div className="br-page-progress" aria-hidden="true" />
      <div className="br-growth-track" aria-hidden="true"><i /></div>
      <div className="br-grain" aria-hidden="true" />
      <button className="br-motion-toggle" onClick={() => setMovimentoPausado((v) => !v)} aria-pressed={movimentoPausado}>{movimentoPausado ? 'Retomar movimento' : 'Pausar movimento'}</button>

      <header className={`br-nav ${navCompacta ? 'is-compact' : ''}`}>
        <a href="#inicio" className="br-logo" aria-label="BROTO, início">
          <span className="br-logo-symbol" aria-hidden="true"><i /><i /></span>
          <span className="br-logo-word">broto</span>
        </a>
        <nav className={`br-nav-links ${menuAberto ? 'is-open' : ''}`} aria-label="Navegação principal">
          <a href="#ideia" onClick={() => setMenuAberto(false)}>A ideia</a>
          <a href="#aprender" onClick={() => setMenuAberto(false)}>Aprender</a>
          <a href="#tradutor" onClick={() => setMenuAberto(false)}>Tradutor</a>
          <a href="#promessa" onClick={() => setMenuAberto(false)}>Nossa promessa</a>
        </nav>
        <a href="#tradutor" className="br-nav-cta">Começar do zero <span>↘</span></a>
        <button className="br-menu" onClick={() => setMenuAberto((v) => !v)} aria-label="Abrir menu" aria-expanded={menuAberto}>
          <span /><span />
        </button>
      </header>

      <main>
        <section className="br-hero" id="inicio">
          <video ref={heroVideoRef} className="br-hero-video" autoPlay muted loop playsInline preload="auto" poster="/broto/hero-poster.jpg">
            <source src="/broto/hero.mp4" type="video/mp4" />
          </video>
          <div className="br-hero-scrim" />
          <div className="br-icon-cloud" aria-hidden="true">
            <span className="i1">🍺</span><span className="i2">💊</span><span className="i3">⚙️</span><span className="i4">💡</span><span className="i5">⛽</span>
          </div>
          <div className="br-hero-orbit" aria-hidden="true"><span>patrimônio • tempo • clareza •</span></div>

          <div className="br-hero-content">
            <div className="br-hero-copy">
              <span className="br-kicker br-hero-enter d1"><i /> Educação financeira para a vida real</span>
              <h1 className="br-hero-h1">
                <span className="br-hero-enter d2">Entender</span>
                <span className="br-hero-enter d3">o <em>dinheiro</em></span>
                <span className="br-hero-enter d4">muda o depois.</span>
              </h1>
              <div className="br-hero-bottom br-hero-enter d5">
                <p>Organize sua vida financeira, compreenda a economia e conheça investimentos com calma e clareza — para decidir o que faz sentido para a sua realidade.</p>
                <a href="#aprender" className="br-btn br-btn-primary">Começar pela base <span>↘</span></a>
              </div>
            </div>

            <aside className="br-field-note br-hero-enter d5" aria-label="Princípio do BROTO">
              <span className="br-field-label">Caderno de campo · 01</span>
              <p>“Antes de escolher onde colocar o dinheiro, vale entender o que você espera que ele faça por você.”</p>
              <div className="br-field-line"><span>mais clareza</span><i /><b>melhores escolhas</b></div>
            </aside>
          </div>

          <a className="br-scroll-cue" href="#ideia"><span>role para criar raiz</span><i /></a>
        </section>

        <div className="br-tape" aria-hidden="true">
          <div className="br-tape-track">
            {[0, 1].map((copy) => (
              <span key={copy}>ENTENDER ANTES DE ESCOLHER <i>✦</i> VIDA REAL ANTES DO JARGÃO <i>✦</i> CONHECIMENTO CRIA AUTONOMIA <i>✦</i> TEMPO TAMBÉM É PATRIMÔNIO <i>✦</i> </span>
            ))}
          </div>
        </div>

        <section className="br-sprout-scene">
          <div className="br-wrap br-sprout-grid">
            <Reveal className="br-sprout-video-wrap">
              <video ref={sproutVideoRef} autoPlay muted loop playsInline preload="auto" poster="/broto/hero-poster.jpg"><source src="/broto/hero.mp4" type="video/mp4" /></video>
              <span className="br-video-label"><i /> filme de crescimento · 00:08</span>
              <div className="br-video-corner">↘</div>
            </Reveal>
            <Reveal className="br-sprout-copy" delay={130}>
              <div className="br-section-index"><span>00</span><i /> O começo</div>
              <h2>Primeiro nasce<br />uma <em>raiz.</em></h2>
              <p>Investimento não é truque nem corrida. É dinheiro, conhecimento e tempo trabalhando juntos — um pouco de cada vez.</p>
              <div className="br-sprout-note"><b>O que cresce rápido demais</b><span>também pode não criar raiz.</span></div>
            </Reveal>
          </div>
        </section>

        <section className="br-manifesto" id="ideia">
          <div className="br-wrap">
            <Reveal>
              <div className="br-section-index"><span>01</span><i /> A ideia</div>
              <p className="br-manifesto-big">
                Quando mais gente entende o próprio dinheiro, <span className="br-hl">o futuro deixa de parecer decidido pelos outros.</span>
              </p>
              <p className="br-manifesto-support">Educação financeira não começa na bolsa. Começa no orçamento, nas dívidas, na reserva, nos juros e nas escolhas de todos os dias. Investir pode fazer parte do caminho — mas não precisa ser o primeiro passo.</p>
            </Reveal>

            <div className="br-vs">
              <Reveal className="br-vs-col br-vs-bet" delay={80}>
                <div className="br-vs-no">AGORA</div>
                <span className="br-vs-tag">Entender o presente</span>
                <h3>Seu dinheiro já<br />conta uma história.</h3>
                <ul>
                  <li>Quanto entra, quanto sai e o que fica.</li>
                  <li>O que os juros fazem com uma dívida.</li>
                  <li>Como inflação aparece no mercado e no boleto.</li>
                </ul>
                <div className="br-pulse-line bad" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              </Reveal>
              <Reveal className="br-vs-col br-vs-inv" delay={160}>
                <div className="br-vs-yes">DEPOIS</div>
                <span className="br-vs-tag">Preparar o futuro</span>
                <h3>Conhecimento vira<br />autonomia.</h3>
                <ul>
                  <li>Defina objetivos antes de escolher produtos.</li>
                  <li>Compare risco, prazo, liquidez e retorno.</li>
                  <li>Entenda empresas sem depender de dicas.</li>
                </ul>
                <div className="br-pulse-line good" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="br-film-break" aria-label="Dinheiro plantado cria raiz">
          <video ref={inkVideoRef} autoPlay muted loop playsInline preload="auto"><source src="/broto/ink.mp4" type="video/mp4" /></video>
          <div className="br-film-shade" />
          <div className="br-film-copy">
            <span>movimento 01 · plantar</span>
            <p>O dinheiro deixa de girar<br />e começa a <em>criar raiz.</em></p>
          </div>
          <div className="br-film-stamp">sem pressa<br />desde 2026</div>
        </section>

        <section className="br-people">
          <div className="br-wrap br-people-intro">
            <Reveal>
              <div className="br-section-index light"><span>02</span><i /> Pra quem é</div>
              <h2>Dinheiro de verdade.<br /><em>Gente de verdade.</em></h2>
            </Reveal>
            <Reveal delay={120}>
              <p>Educação financeira precisa caber na rotina de quem trabalha, paga boleto, sustenta uma casa e quer construir possibilidades reais.</p>
            </Reveal>
          </div>
          <div className="br-people-grid">
            <Reveal className="br-persona" delay={80}>
              <img src="/broto/retrato-motoboy.png" alt="Entregador na rua ao entardecer" />
              <div className="br-persona-number">01 / 02</div>
              <div className="br-persona-caption"><span>O entregador</span><p>“Queria um lugar onde o meu dinheiro trabalhasse enquanto eu rodo.”</p></div>
            </Reveal>
            <Reveal className="br-persona br-persona-offset" delay={180}>
              <img src="/broto/retrato-loja.png" alt="Dona de uma pequena loja de bairro" />
              <div className="br-persona-number">02 / 02</div>
              <div className="br-persona-caption"><span>A dona da lojinha</span><p>“Eu vendia produtos dessas empresas. Nunca pensei que podia ser dona delas.”</p></div>
            </Reveal>
          </div>
        </section>

        <section className="br-concepts" id="aprender">
          <div className="br-wrap">
            <Reveal>
              <div className="br-section-index"><span>03</span><i /> Caderno de base</div>
              <div className="br-concepts-head">
                <h2>O dinheiro, a economia<br /><em>e a vida real.</em></h2>
                <p>Trinta conceitos para construir critério. Os dez novos capítulos explicam crédito, câmbio, produção, trabalho e contas públicas sem economês.</p>
              </div>
            </Reveal>

            <Reveal className="br-economy-gallery" delay={70}>
              {ECONOMIA_ARTES.map((arte, index) => (
                <figure key={arte.src}>
                  <Image src={arte.src} alt="" fill sizes="(max-width: 680px) calc(100vw - 30px), (max-width: 960px) 50vw, 390px" />
                  <span>{String(index + 1).padStart(2, '0')} / 05</span>
                  <figcaption><b>{arte.title}</b><small>{arte.topics}</small></figcaption>
                </figure>
              ))}
            </Reveal>

            <div className="br-concepts-board">
              <Reveal className="br-concept-list" delay={80}>
                {CONCEITOS.map((conceito, index) => (
                  <div className="br-concept-item" key={conceito.title}>
                    {index === 20 ? <div className="br-concept-group"><span>Economia no cotidiano</span><b>10 novos conceitos</b></div> : null}
                    <button id={`concept-trigger-${index}`} className={conceitoAtivo === index ? 'is-active' : ''} onClick={() => setConceitoAtivo((atual) => atual === index ? null : index)} aria-expanded={conceitoAtivo === index} aria-controls={`concept-panel-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span><i>{conceito.icon}</i><b>{conceito.title}</b><small>↗</small>
                    </button>
                    {conceitoAtivo === index && <ConceptDetail conceito={conceito} index={index} className="br-concept-inline" id={`concept-panel-${index}`} labelledBy={`concept-trigger-${index}`} />}
                  </div>
                ))}
              </Reveal>
            </div>

            <Reveal className="br-learning-path">
              <span>Uma ordem segura para começar</span>
              <div><b>01</b> Organize as dívidas <i>→</i><b>02</b> Monte a reserva <i>→</i><b>03</b> Entenda o risco <i>→</i><b>04</b> Só então invista</div>
            </Reveal>
          </div>
        </section>

        <section className="br-tradutor" id="tradutor">
          <div className="br-wrap">
            <Reveal>
              <div className="br-section-index"><span>04</span><i /> O tradutor</div>
              <div className="br-tradutor-head">
                <h2>Bolsa, traduzida<br /><em>pra vida real.</em></h2>
                <p>Por trás de cada código estranho existe uma empresa que faz parte do seu dia. Pesquise, toque e entenda sem economês.</p>
              </div>
            </Reveal>

            <Reveal className="br-tools" delay={90}>
              <label className="br-search">
                <span>⌕</span>
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque Ambev, PETR4, banco..." aria-label="Buscar empresa" />
                {busca && <button onClick={() => setBusca('')} aria-label="Limpar busca">×</button>}
              </label>
              <div className="br-filters" role="group" aria-label="Filtrar empresas por setor">
                {FILTROS.map((item) => (
                  <button
                    key={item.label}
                    className={filtro === item.label ? 'is-active' : ''}
                    onClick={() => setFiltro(item.label)}
                    aria-pressed={filtro === item.label}
                  >
                    {item.label} <i>{item.total}</i>
                  </button>
                ))}
              </div>
            </Reveal>

            <div className="br-results-meta"><span>{filtradas.length === 1 ? '1 empresa encontrada' : `${filtradas.length} empresas encontradas`}</span><i /></div>
            <div className="br-grid">
              {filtradas.slice(0, limite).map((empresa, i) => (
                <Reveal key={empresa.ticker} delay={(i % 3) * 55}>
                  <CardEmpresa empresa={empresa} index={i + 1} />
                </Reveal>
              ))}
            </div>
            {!filtradas.length && <div className="br-empty">Nenhuma empresa por aqui. Tente outro nome ou setor.</div>}
            {limite < filtradas.length && <button className="br-load" onClick={() => setLimite((v) => v + 24)}>Mostrar mais empresas <span>+{Math.min(24, filtradas.length - limite)}</span></button>}
          </div>
        </section>

        <section className="br-ownership">
          <div className="br-wrap">
            <Reveal>
              <div className="br-section-index light"><span>05</span><i /> Mude o olhar</div>
              <h2>Empresas movem o cotidiano.<br /><em>Entenda como elas funcionam.</em></h2>
            </Reveal>
            <div className="br-own-list">
              {[
                ['01', '🍺', 'Bebeu a cerveja', 'Ambev', 'ABEV3'],
                ['02', '⛽', 'Abasteceu o carro', 'Petrobras', 'PETR4'],
                ['03', '💡', 'Acendeu a luz', 'Engie', 'EGIE3'],
                ['04', '📦', 'Recebeu a encomenda', 'Klabin', 'KLBN11'],
                ['05', '🏦', 'Usou o banco', 'Itaú', 'ITUB4'],
              ].map((item, i) => <Reveal key={item[0]} delay={i * 45}><div className="br-own-row"><span>{item[0]}</span><strong>{item[1]}</strong><p>{item[2]}</p><i /><b>{item[3]}</b><small>{item[4]}</small></div></Reveal>)}
            </div>
          </div>
        </section>

        <section className="br-promise" id="promessa">
          <div className="br-wrap">
            <Reveal>
              <div className="br-section-index"><span>06</span><i /> Nossa promessa</div>
              <div className="br-promise-head"><h2>Educação que respeita<br /><em>o seu dinheiro.</em></h2><p>O BROTO não diz o que comprar nem transforma investimento em espetáculo. Ele oferece contexto para você construir seu próprio critério.</p></div>
            </Reveal>
            <div className="br-rules">
              <Rule n="01" title="Sua vida vem primeiro" text="Dívidas, reserva, objetivos e prazo importam mais do que qualquer ativo da moda." />
              <Rule n="02" title="Nada de promessa fácil" text="Retorno envolve risco. Toda escolha financeira tem limites, custos e consequências." />
              <Rule n="03" title="Contexto antes da opinião" text="A gente explica como algo funciona antes de dizer por que aquilo importa." />
              <Rule n="04" title="Autonomia como resultado" text="O objetivo é você aprender a decidir sem depender para sempre de uma dica." />
            </div>
          </div>
        </section>

        <section className="br-final">
          <video ref={finalVideoRef} className="br-final-video" autoPlay muted loop playsInline preload="auto" poster="/broto/hero-poster.jpg"><source src="/broto/crust.mp4" type="video/mp4" /></video>
          <div className="br-final-scrim" />
          <div className="br-final-content">
            <Reveal>
              <span className="br-final-eyebrow">Uma coisa por vez</span>
              <h2>Um broto não vira<br />árvore numa noite.</h2>
              <p>E é isso que faz ele durar. Comece entendendo uma empresa hoje. Só isso.</p>
              <a href="#tradutor" className="br-btn br-btn-primary">Escolher uma empresa <span>↑</span></a>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="br-footer">
        <div className="br-wrap br-footer-grid">
          <div><div className="br-logo footer"><span className="br-logo-symbol"><i /><i /></span><span className="br-logo-word">broto</span></div><p>Educação financeira para quem quer criar raiz, não caçar adrenalina.</p></div>
          <div><span>Uma iniciativa</span><b>Pequi Estúdio · Brasília, DF</b><a href="/">Conheça o Caryo Map ↗</a></div>
          <small>O BROTO é educação financeira, não recomendação de investimento. Toda decisão financeira envolve risco. © 2026.</small>
        </div>
      </footer>
    </div>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('is-visible'); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-visible'); observer.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`br-reveal ${className}`} style={{ '--delay': `${delay}ms` } as React.CSSProperties}>{children}</div>
}

function CardEmpresa({ empresa, index }: { empresa: EmpresaBroto; index: number }) {
  const [aberto, setAberto] = useState(false)
  return (
    <article className={`br-card ${aberto ? 'is-open' : ''}`}>
      <button className="br-card-trigger" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-controls={`empresa-${empresa.ticker}`}>
        <span className="br-card-index">{String(index).padStart(2, '0')}</span>
        <span className="br-card-symbol" aria-hidden="true">{empresa.emoji}</span>
        <span className="br-card-id"><b>{empresa.nome}</b><small>{empresa.ticker} · {empresa.setor}</small><em>abrir sobre a empresa</em></span>
        <span className="br-card-plus">{aberto ? '−' : '+'}</span>
      </button>
      <p className="br-card-frase">{empresa.frase}</p>
      {aberto && <div className="br-card-detail" id={`empresa-${empresa.ticker}`}>
          <div><span>Sobre a empresa</span><p>{empresa.oQueFaz}</p></div>
        <div><span>Você usa quando</span><p>{empresa.vocesUsa}</p></div>
        <div className="br-card-owner"><span>Ser dono significa</span><p>{empresa.dono}</p></div>
        <a href={empresa.site} target="_blank" rel="noreferrer">Conhecer a empresa por ela mesma ↗</a>
      </div>}
    </article>
  )
}

function ConceptDetail({ conceito, index, className = '', id, labelledBy }: { conceito: ConceitoBroto; index: number; className?: string; id?: string; labelledBy?: string }) {
  return <div className={className} id={id} role="region" aria-labelledby={labelledBy}>
    {conceito.art ? <div className="br-concept-art">
      <Image src={conceito.art} alt={conceito.artAlt ?? ''} fill sizes="(max-width: 680px) calc(100vw - 30px), 820px" />
      <span>Economia na vida real</span>
    </div> : null}
    <div className="br-concept-icon" aria-hidden="true">{conceito.icon}</div>
    <span className="br-concept-count">conceito {String(index + 1).padStart(2, '0')} / {String(CONCEITOS.length).padStart(2, '0')}</span>
    <h3>{conceito.title}</h3>
    <strong>{conceito.short}</strong>
    <p>{conceito.body}</p>
    <div className="br-concept-example"><span>Na vida real</span><p>{conceito.example}</p></div>
  </div>
}

function Rule({ n, title, text }: { n: string; title: string; text: string }) {
  return <Reveal className="br-rule"><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div><b aria-hidden="true">×</b></Reveal>
}

function BrotoCSS() {
  return <style>{`
    body:has(.broto-page) { background:#f2eadc; }
    body:has(.broto-page)::-webkit-scrollbar-track { background:#173c25; }
    body:has(.broto-page)::-webkit-scrollbar-thumb { background:#dba027; }
    .broto-page { --paper:#f2eadc; --paper2:#e8ddca; --ink:#201c17; --muted:#6f665b; --green:#2d7141; --deep:#173c25; --lime:#b9d97c; --sun:#e0a126; --terra:#bd5f35; --line:rgba(32,28,23,.17); background:var(--paper); color:var(--ink); font-family:var(--sans); overflow:hidden; position:relative; }
    .broto-page ::selection { background:var(--lime); color:var(--deep); }
    .br-wrap { width:min(1180px, calc(100% - 48px)); margin-inline:auto; }
    .br-grain { position:fixed; inset:0; z-index:100; pointer-events:none; opacity:.055; background-image:url('/broto/textura.jpg'); background-size:420px; mix-blend-mode:multiply; }
    .br-page-progress { position:fixed; z-index:110; left:0; top:0; height:3px; width:var(--br-progress, 0%); background:var(--sun); transition:width .08s linear; }
    .br-growth-track{position:fixed;z-index:85;left:12px;top:18vh;width:2px;height:64vh;background:rgba(45,113,65,.14);pointer-events:none}.br-growth-track i{display:block;width:2px;height:var(--br-progress,0%);max-height:100%;background:var(--green);position:relative;transition:height .12s linear}.br-growth-track i:after{content:'';position:absolute;right:-7px;bottom:-2px;width:10px;height:15px;border-radius:90% 10% 90% 10%;background:var(--lime);transform:rotate(28deg);box-shadow:-7px 7px 0 -1px var(--sun)}
    .br-motion-toggle{position:fixed;z-index:105;left:24px;bottom:22px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(19,49,29,.88);backdrop-filter:blur(10px);color:#fff;padding:9px 13px;font:600 9px var(--mono);letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.br-motion-toggle:before{content:'Ⅱ';color:var(--lime);margin-right:7px}.br-motion-toggle[aria-pressed="true"]:before{content:'▶'}.motion-paused *{animation-play-state:paused!important}
    .br-nav { position:fixed; z-index:90; top:0; left:50%; transform:translateX(-50%); width:min(1180px, calc(100% - 48px)); height:88px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; color:#fff; transition:height .35s, background .35s, width .35s, border-radius .35s, padding .35s, top .35s, box-shadow .35s; }
    .br-nav.is-compact { top:12px; height:62px; width:min(1120px, calc(100% - 28px)); padding:0 18px; border:1px solid rgba(255,255,255,.15); border-radius:16px; background:rgba(23,60,37,.82); backdrop-filter:blur(18px); box-shadow:0 12px 35px rgba(15,36,23,.2); }
    .br-logo { display:flex; align-items:center; gap:10px; width:max-content; }
    .br-logo-word { font:600 29px/1 var(--display); letter-spacing:-.04em; color:#fff; }
    .br-logo-symbol { width:25px; height:28px; display:block; position:relative; }
    .br-logo-symbol:after { content:''; position:absolute; left:12px; bottom:1px; width:2px; height:22px; border-radius:2px; background:var(--lime); transform:rotate(-4deg); transform-origin:bottom; }
    .br-logo-symbol i { position:absolute; width:12px; height:8px; background:var(--lime); border-radius:90% 10% 90% 10%; top:4px; left:1px; transform:rotate(24deg); }
    .br-logo-symbol i+ i { left:13px; top:1px; transform:scaleX(-1) rotate(24deg); }
    .br-nav-links { display:flex; gap:30px; font-size:13px; letter-spacing:.04em; }
    .br-nav-links a { opacity:.78; transition:opacity .2s; } .br-nav-links a:hover { opacity:1; }
    .br-nav-cta { justify-self:end; display:flex; align-items:center; gap:12px; font-size:13px; font-weight:600; border-bottom:1px solid rgba(255,255,255,.55); padding:7px 0; }
    .br-nav-cta span { color:var(--lime); }
    .br-menu { display:none; background:none; border:0; width:36px; height:36px; padding:9px; } .br-menu span { display:block; height:1px; background:#fff; margin:5px 0; }
    .br-hero { min-height:100svh; position:relative; display:flex; align-items:flex-end; overflow:hidden; background:var(--deep); }
    .br-hero-video { position:absolute; inset:-40px 0 0; width:100%; height:calc(100% + 90px); object-fit:cover; transform:translateY(calc(var(--br-scroll, 0px) * .12)); filter:saturate(.82) contrast(1.05); }
    .br-hero-scrim { position:absolute; inset:0; background:linear-gradient(90deg,rgba(15,37,23,.9) 0%,rgba(20,34,22,.5) 51%,rgba(22,20,14,.18) 75%),linear-gradient(0deg,rgba(13,31,19,.85),transparent 52%); }
    .br-icon-cloud{position:absolute;z-index:2;inset:0;pointer-events:none}.br-icon-cloud span{position:absolute;width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);background:rgba(24,55,32,.34);backdrop-filter:blur(9px);border-radius:50%;font-size:25px;filter:drop-shadow(0 12px 18px rgba(8,25,12,.25));animation:br-float 5.5s ease-in-out infinite}.br-icon-cloud .i1{right:31%;top:17%;animation-delay:-1s}.br-icon-cloud .i2{right:8%;top:39%;animation-delay:-2.8s}.br-icon-cloud .i3{right:24%;top:58%;animation-delay:-4s}.br-icon-cloud .i4{right:6%;top:72%;animation-delay:-.4s}.br-icon-cloud .i5{right:43%;top:31%;animation-delay:-3.3s}@keyframes br-float{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-16px) rotate(5deg)}}
    .br-hero-content { width:min(1180px, calc(100% - 48px)); margin:0 auto; padding:150px 0 86px; position:relative; z-index:2; display:grid; grid-template-columns:1fr 300px; gap:70px; align-items:end; }
    .br-kicker { display:inline-flex; align-items:center; gap:10px; font:600 11px/1 var(--mono); letter-spacing:.15em; text-transform:uppercase; color:#fff; }
    .br-kicker i { width:7px; height:7px; border-radius:50%; background:var(--lime); box-shadow:0 0 0 5px rgba(185,217,124,.12); }
    .br-hero-h1 { font:500 clamp(54px,8.2vw,112px)/.82 var(--display); color:#fff; letter-spacing:-.055em; margin:32px 0 0; }
    .br-hero-h1 span { display:block; } .br-hero-h1 em { color:var(--lime); font-weight:350; }
    .br-hero-bottom { display:flex; align-items:flex-end; gap:38px; margin-top:42px; }
    .br-hero-bottom p { max-width:50ch; font-size:17px; line-height:1.55; color:rgba(255,255,255,.76); }
    .br-btn { display:inline-flex; flex:none; align-items:center; justify-content:center; gap:18px; min-height:52px; padding:0 23px; border-radius:4px; font-size:14px; font-weight:700; transition:transform .25s,background .25s,box-shadow .25s; }
    .br-btn-primary { color:var(--deep); background:var(--lime); box-shadow:7px 7px 0 rgba(224,161,38,.65); } .br-btn-primary:hover { transform:translate(-3px,-3px); box-shadow:10px 10px 0 var(--sun); background:#c8e593; }
    .br-field-note { color:#fff; border:1px solid rgba(255,255,255,.22); border-radius:4px; padding:22px; background:rgba(24,45,28,.28); backdrop-filter:blur(8px); transform:rotate(1.5deg); }
    .br-field-label { font:500 10px var(--mono); text-transform:uppercase; letter-spacing:.12em; color:var(--lime); }
    .br-field-note p { font:italic 25px/1.22 var(--display); margin:35px 0 32px; }
    .br-field-line { display:flex; align-items:center; gap:8px; font:500 9px var(--mono); text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.55); }
    .br-field-line i { flex:1; height:1px; background:rgba(255,255,255,.22); } .br-field-line b { color:#fff; }
    .br-hero-enter { opacity:0; animation:br-enter .9s cubic-bezier(.22,1,.36,1) forwards; } .br-hero-enter.d1{animation-delay:.15s}.br-hero-enter.d2{animation-delay:.25s}.br-hero-enter.d3{animation-delay:.36s}.br-hero-enter.d4{animation-delay:.47s}.br-hero-enter.d5{animation-delay:.62s}
    @keyframes br-enter { from { opacity:0; transform:translateY(34px); } to { opacity:1; transform:translateY(0); } }
    .br-hero-orbit { position:absolute; z-index:2; width:190px; height:190px; right:7vw; top:18%; border:1px solid rgba(255,255,255,.2); border-radius:50%; animation:br-spin 16s linear infinite; opacity:.65; }
    .br-hero-orbit:before,.br-hero-orbit:after{content:'';position:absolute;border-radius:50%;background:var(--sun)}.br-hero-orbit:before{width:11px;height:11px;left:15px;top:25px}.br-hero-orbit:after{width:6px;height:6px;right:12px;bottom:34px}.br-hero-orbit span{display:none}@keyframes br-spin{to{transform:rotate(360deg)}}
    .br-scroll-cue { position:absolute; z-index:3; right:28px; bottom:28px; display:flex; align-items:center; gap:14px; color:#fff; font:500 10px var(--mono); text-transform:uppercase; letter-spacing:.11em; writing-mode:vertical-rl; }
    .br-scroll-cue i { height:55px; width:1px; background:rgba(255,255,255,.38); position:relative; overflow:hidden; }.br-scroll-cue i:after{content:'';position:absolute;width:100%;height:20px;top:-20px;left:0;background:#fff;animation:br-scroll 2s infinite}@keyframes br-scroll{to{transform:translateY(80px)}}
    .br-tape { background:var(--sun); color:var(--deep); overflow:hidden; transform:rotate(-1deg) scale(1.02); position:relative; z-index:4; box-shadow:0 8px 22px rgba(53,35,8,.15); }
    .br-tape-track { display:flex; width:max-content; animation:br-marquee 26s linear infinite; padding:13px 0; font:700 12px var(--mono); letter-spacing:.14em; white-space:nowrap; }
    .br-tape-track i { margin:0 22px; font-style:normal; } @keyframes br-marquee { to { transform:translateX(-50%); } }
    .br-sprout-scene{padding:120px 0;background:#e8ddca;position:relative}.br-sprout-scene:before{content:'CRESCER';position:absolute;right:-25px;top:15px;font:600 clamp(90px,16vw,220px)/1 var(--display);letter-spacing:-.06em;color:rgba(45,113,65,.045)}.br-sprout-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:70px;align-items:center}.br-sprout-video-wrap{position:relative;height:650px;overflow:hidden;background:var(--deep);box-shadow:20px 24px 0 rgba(45,113,65,.13)}.br-sprout-video-wrap video{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.9)}.br-video-label{position:absolute;left:18px;top:18px;display:flex;align-items:center;gap:9px;background:rgba(18,49,28,.78);backdrop-filter:blur(7px);color:#fff;padding:8px 11px;font:500 9px var(--mono);letter-spacing:.08em;text-transform:uppercase}.br-video-label i{width:6px;height:6px;border-radius:50%;background:var(--sun);animation:br-record 1.5s ease-in-out infinite}@keyframes br-record{50%{opacity:.25}}.br-video-corner{position:absolute;right:18px;bottom:18px;width:44px;height:44px;display:grid;place-items:center;background:var(--lime);color:var(--deep);font-size:21px}.br-sprout-copy h2{font:450 clamp(44px,5vw,72px)/.95 var(--display);letter-spacing:-.045em}.br-sprout-copy h2 em{color:var(--green)}.br-sprout-copy>p{font-size:17px;line-height:1.65;color:var(--muted);margin:28px 0 42px}.br-sprout-note{border-left:3px solid var(--sun);padding-left:18px;display:flex;flex-direction:column}.br-sprout-note b{font:550 19px var(--display)}.br-sprout-note span{font-size:13px;color:var(--muted);margin-top:3px}
    .br-reveal { opacity:0; transform:translateY(28px); transition:opacity .75s ease var(--delay),transform .75s cubic-bezier(.22,1,.36,1) var(--delay); } .br-reveal.is-visible { opacity:1; transform:none; }
    .br-section-index { display:flex; align-items:center; gap:13px; font:600 11px var(--mono); letter-spacing:.12em; text-transform:uppercase; color:var(--green); margin-bottom:45px; }.br-section-index span{border:1px solid currentColor;padding:5px 7px}.br-section-index i{width:42px;height:1px;background:currentColor}.br-section-index.light{color:var(--lime)}
    .br-manifesto { padding:130px 0 150px; background:var(--paper); }
    .br-manifesto-big { max-width:21ch; font:450 clamp(42px,6vw,78px)/1.02 var(--display); letter-spacing:-.045em; }.br-strike{text-decoration:line-through;text-decoration-color:var(--terra);text-decoration-thickness:4px;color:var(--muted)}.br-hl{color:var(--green);font-style:italic}.br-manifesto-support{max-width:64ch;margin-top:34px;color:var(--muted);font-size:17px;line-height:1.7}
    .br-vs { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:80px; }.br-vs-col{position:relative;min-height:460px;padding:42px;border:1px solid var(--line);overflow:hidden}.br-vs-bet{background:#e8dacb}.br-vs-inv{background:var(--deep);color:#fff}.br-vs-no,.br-vs-yes{position:absolute;right:-20px;top:-48px;font:600 150px var(--display);opacity:.06;transform:rotate(7deg)}
    .br-vs-tag { font:700 10px var(--mono); letter-spacing:.14em; text-transform:uppercase; border-bottom:1px solid currentColor; padding-bottom:5px; }.br-vs-col h3{font:500 clamp(29px,3.4vw,47px)/1.03 var(--display);letter-spacing:-.03em;margin:45px 0}.br-vs-inv h3{color:var(--lime)}.br-vs-col ul{list-style:none;display:grid;gap:15px}.br-vs-col li{padding-left:20px;position:relative;color:var(--muted)}.br-vs-inv li{color:rgba(255,255,255,.68)}.br-vs-col li:before{content:'—';position:absolute;left:0;color:var(--terra)}.br-vs-inv li:before{color:var(--lime)}
    .br-pulse-line{position:absolute;left:42px;right:42px;bottom:36px;height:38px;display:flex;align-items:flex-end;gap:6px}.br-pulse-line i{display:block;flex:1;height:10px;background:var(--terra);animation:br-wave 1.4s ease-in-out infinite;transform-origin:bottom}.br-pulse-line i:nth-child(2){animation-delay:.1s}.br-pulse-line i:nth-child(3){animation-delay:.2s}.br-pulse-line i:nth-child(4){animation-delay:.3s}.br-pulse-line i:nth-child(5){animation-delay:.4s}.br-pulse-line.good i{background:var(--lime);animation-duration:2.5s}@keyframes br-wave{50%{height:32px}}
    .br-film-break{height:min(78vw,760px);min-height:580px;position:relative;overflow:hidden;background:#102e1c;color:#fff}.br-film-break video{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:saturate(.82) contrast(1.04);animation:br-film-breathe 12s ease-in-out infinite alternate}.br-film-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,31,17,.78),rgba(13,30,18,.08) 62%),linear-gradient(0deg,rgba(10,28,15,.48),transparent 55%)}.br-film-copy{position:absolute;z-index:2;left:max(24px,calc((100vw - 1180px)/2));bottom:90px}.br-film-copy>span{font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--lime)}.br-film-copy p{font:450 clamp(43px,6vw,82px)/.96 var(--display);letter-spacing:-.045em;margin-top:20px}.br-film-copy em{color:var(--lime)}.br-film-stamp{position:absolute;z-index:2;right:max(24px,calc((100vw - 1180px)/2));top:55px;width:115px;height:115px;border:1px solid rgba(255,255,255,.5);border-radius:50%;display:grid;place-items:center;text-align:center;font:600 10px/1.5 var(--mono);letter-spacing:.08em;text-transform:uppercase;transform:rotate(8deg);animation:br-spin 22s linear infinite}@keyframes br-film-breathe{from{transform:scale(1)}to{transform:scale(1.035) translate3d(-1%,1%,0)}}
    .br-people { background:var(--deep); color:#fff; padding:130px 0 150px; }.br-people-intro{display:grid;grid-template-columns:1fr 360px;gap:80px;align-items:end;margin-bottom:70px}.br-people h2,.br-tradutor h2,.br-ownership h2,.br-promise h2{font:450 clamp(44px,6vw,78px)/.98 var(--display);letter-spacing:-.045em}.br-people h2 em,.br-ownership h2 em{color:var(--lime)}.br-people-intro>div:last-child p{color:rgba(255,255,255,.62);font-size:17px}.br-people-grid{width:min(1320px,calc(100% - 48px));margin:auto;display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:start}.br-persona{position:relative;overflow:hidden;min-height:640px}.br-persona-offset{margin-top:120px;min-height:560px}.br-persona img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.8);transition:transform .9s cubic-bezier(.22,1,.36,1),filter .5s}.br-persona:hover img{transform:scale(1.035);filter:saturate(1)}.br-persona:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,24,14,.92),transparent 55%)}.br-persona-number{position:absolute;z-index:2;top:22px;right:22px;font:500 11px var(--mono);background:var(--sun);color:var(--deep);padding:6px 8px}.br-persona-caption{position:absolute;z-index:2;left:35px;right:35px;bottom:35px}.br-persona-caption span{font:500 34px var(--display);color:var(--lime)}.br-persona-caption p{max-width:36ch;margin-top:9px;color:rgba(255,255,255,.8)}
    .br-concepts{padding:140px 0 150px;background:#e9decb;position:relative}.br-concepts:after{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:var(--line)}.br-concepts-head{display:grid;grid-template-columns:1fr 390px;gap:70px;align-items:end}.br-concepts h2{font:450 clamp(44px,6vw,78px)/.98 var(--display);letter-spacing:-.045em}.br-concepts h2 em{color:var(--green)}.br-concepts-head>p{font-size:17px;line-height:1.6;color:var(--muted)}.br-economy-gallery{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:70px 0 62px}.br-economy-gallery figure{grid-column:span 2;position:relative;aspect-ratio:3/2;overflow:hidden;background:var(--deep);border:1px solid rgba(32,28,23,.16)}.br-economy-gallery figure:nth-child(4),.br-economy-gallery figure:nth-child(5){grid-column:span 3}.br-economy-gallery img{object-fit:cover;filter:saturate(.84) contrast(1.03);transition:transform .8s cubic-bezier(.22,1,.36,1),filter .4s}.br-economy-gallery figure:hover img{transform:scale(1.045);filter:saturate(1)}.br-economy-gallery figure:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(11,30,18,.88),transparent 62%)}.br-economy-gallery figure>span{position:absolute;z-index:2;right:14px;top:14px;padding:5px 7px;background:var(--sun);color:var(--deep);font:600 9px var(--mono)}.br-economy-gallery figcaption{position:absolute;z-index:2;left:20px;right:20px;bottom:18px;color:#fff;display:flex;flex-direction:column}.br-economy-gallery figcaption b{font:500 22px var(--display)}.br-economy-gallery figcaption small{margin-top:4px;color:var(--lime);font:600 9px var(--mono);letter-spacing:.06em;text-transform:uppercase}.br-concepts-board{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(0,1.15fr);gap:22px;margin-top:75px;align-items:stretch}.br-concept-list{border-top:1px solid var(--line)}.br-concept-list button{width:100%;min-height:72px;border:0;border-bottom:1px solid var(--line);background:transparent;display:grid;grid-template-columns:32px 44px 1fr 20px;gap:12px;align-items:center;text-align:left;padding:8px 14px;cursor:pointer;color:var(--ink);transition:background .25s,padding .25s,color .25s}.br-concept-list button:hover{padding-left:22px;background:rgba(255,255,255,.36)}.br-concept-list button.is-active{background:var(--deep);color:#fff;padding-left:22px}.br-concept-list button>span{font:500 9px var(--mono);color:var(--green)}.br-concept-list button.is-active>span{color:var(--lime)}.br-concept-list button>i{font-style:normal;font-size:24px}.br-concept-list button>b{font:550 18px var(--display)}.br-concept-list button>small{color:var(--green);font-size:15px}.br-concept-list button.is-active>small{color:var(--lime);transform:rotate(45deg)}.br-concept-detail{min-height:620px;padding:48px;background:#faf4e8;border:1px solid var(--line);position:relative;overflow:hidden}.br-concept-detail:before{content:'';position:absolute;width:260px;height:260px;border:1px solid rgba(45,113,65,.12);border-radius:50%;right:-90px;top:-90px}.br-concept-icon{width:80px;height:80px;display:grid;place-items:center;border-radius:50%;background:#deebcf;font-size:38px;margin-bottom:55px;animation:br-concept-pop .5s cubic-bezier(.22,1,.36,1)}@keyframes br-concept-pop{from{transform:scale(.7) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}.br-concept-count{font:600 9px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--green)}.br-concept-detail h3{font:500 clamp(34px,4vw,54px)/1 var(--display);letter-spacing:-.03em;margin:12px 0 10px}.br-concept-detail>strong{font:500 18px/1.4 var(--display);color:var(--green)}.br-concept-detail>p{max-width:58ch;color:var(--muted);font-size:15px;line-height:1.65;margin-top:25px}.br-concept-example{position:absolute;left:48px;right:48px;bottom:44px;border-top:1px solid var(--line);padding-top:20px}.br-concept-example span{font:700 9px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--terra)}.br-concept-example p{font:italic 17px/1.5 var(--display);margin-top:8px;color:#4f463b}.br-learning-path{margin-top:24px;background:var(--green);color:#fff;padding:28px 32px;display:grid;grid-template-columns:230px 1fr;gap:25px;align-items:center}.br-learning-path>span{font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--lime)}.br-learning-path>div{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px}.br-learning-path b{font:600 10px var(--mono);color:var(--lime)}.br-learning-path i{font-style:normal;color:rgba(255,255,255,.35)}
    .br-concepts-board{display:block;max-width:920px;margin-inline:auto}.br-concept-list{width:100%}.br-concept-inline{position:relative;padding:38px 48px 42px;background:#faf4e8;border:1px solid var(--green);border-top:0;overflow:hidden;animation:br-detail-in .24s ease}.br-concept-inline:before{content:'';position:absolute;left:38px;top:-1px;width:16px;height:16px;border-left:2px solid var(--lime);border-bottom:2px solid var(--lime)}.br-concept-inline .br-concept-icon{width:62px;height:62px;font-size:30px;margin-bottom:30px}.br-concept-art{position:relative;aspect-ratio:3/2;margin:-38px -48px 34px;overflow:hidden;background:var(--deep)}.br-concept-art img{object-fit:cover}.br-concept-art:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(11,30,18,.55),transparent 48%)}.br-concept-art span{position:absolute;z-index:2;left:18px;bottom:16px;color:#fff;font:600 9px var(--mono);letter-spacing:.12em;text-transform:uppercase}.br-concept-inline h3{font:500 clamp(31px,4vw,48px)/1 var(--display);letter-spacing:-.03em;margin:10px 0}.br-concept-inline>strong{font:500 18px/1.4 var(--display);color:var(--green)}.br-concept-inline>p{max-width:65ch;color:var(--muted);font-size:15px;line-height:1.65;margin-top:20px}.br-concept-inline .br-concept-example{position:static;margin-top:28px;border-top:1px solid var(--line);padding-top:18px}.br-concept-detail{display:none}.br-concept-item{width:100%;content-visibility:auto;contain-intrinsic-size:72px}.br-concept-group{display:flex;align-items:center;justify-content:space-between;padding:34px 14px 13px;border-bottom:1px solid var(--line);color:var(--green)}.br-concept-group span{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase}.br-concept-group b{font:500 16px var(--display);color:var(--terra)}
    .br-tradutor { padding:140px 0; }.br-tradutor-head,.br-promise-head{display:grid;grid-template-columns:1fr 390px;gap:70px;align-items:end}.br-tradutor h2 em,.br-promise h2 em{color:var(--green)}.br-tradutor-head p,.br-promise-head p{font-size:17px;color:var(--muted)}
    .br-tools{margin:75px 0 30px;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;gap:18px;align-items:center}.br-search{height:48px;min-width:360px;background:#fffaf1;border:1px solid var(--line);display:flex;align-items:center;padding:0 14px;gap:10px}.br-search span{font:24px var(--display);color:var(--green)}.br-search input{border:0;background:none;outline:0;font:15px var(--sans);width:100%;color:var(--ink)}.br-search button{border:0;background:none;font-size:20px;color:var(--muted);cursor:pointer}.br-filters{display:flex;gap:6px;overflow-x:auto}.br-filters button{border:1px solid transparent;background:none;color:var(--muted);height:38px;padding:0 13px;font:600 12px var(--sans);white-space:nowrap;cursor:pointer}.br-filters button:hover,.br-filters button.is-active{border-color:var(--green);color:var(--green);background:rgba(45,113,65,.06)}.br-filters button i{font-style:normal;font-family:var(--mono);font-size:10px;margin-left:6px;padding:2px 5px;border-radius:99px;background:rgba(43,33,24,.07);color:var(--muted);vertical-align:1px}.br-filters button.is-active i{background:var(--green);color:#fff}
    .br-results-meta{display:flex;align-items:center;gap:12px;font:500 10px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:34px 0 18px}.br-results-meta i{height:1px;background:var(--line);flex:1}.br-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start}.br-card{background:#faf4e8;border:1px solid var(--line);min-height:255px;padding:25px;transition:background .3s,border .3s,transform .3s}.br-card:hover{transform:translateY(-4px);border-color:rgba(45,113,65,.55);background:#fffaf1}.br-card.is-open{grid-row:span 2;background:#fffaf1;border-color:var(--green)}.br-card-trigger{width:100%;display:flex;align-items:center;gap:12px;border:0;background:none;text-align:left;cursor:pointer;font-family:inherit}.br-card-index{font:500 9px var(--mono);color:#9a8e7d;align-self:flex-start}.br-card-symbol{width:52px;height:52px;flex:none;border-radius:50% 50% 45% 55%;background:#e7efda;border:1px solid rgba(45,113,65,.2);display:grid;place-items:center;font-size:27px;transform:rotate(-4deg);transition:transform .35s cubic-bezier(.22,1,.36,1),background .3s}.br-card:hover .br-card-symbol{transform:translateY(-5px) rotate(8deg) scale(1.08);background:#dcebc8}.br-card-id{display:flex;flex-direction:column;flex:1}.br-card-id b{font:550 21px var(--display);color:var(--ink)}.br-card-id small{font:500 10px var(--mono);color:var(--muted);text-transform:uppercase;margin-top:2px}.br-card-id em{font:600 9px var(--sans);font-style:normal;color:var(--green);margin-top:5px;opacity:0;transform:translateY(3px);transition:.2s}.br-card:hover .br-card-id em,.br-card-trigger:focus-visible .br-card-id em{opacity:1;transform:none}.br-card-plus{font:300 27px var(--display);color:var(--green)}.br-card-frase{font:17px/1.5 var(--display);margin:28px 0 0;color:#453d34}.br-card-detail{margin-top:25px;border-top:1px solid var(--line);padding-top:22px;animation:br-detail-in .3s cubic-bezier(.22,1,.36,1)}@keyframes br-detail-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}.br-card-detail>div{margin-bottom:18px}.br-card-detail span{font:600 9px var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--green)}.br-card-detail p{font-size:13px;line-height:1.55;color:var(--muted);margin-top:4px}.br-card-owner{background:#e7efda;padding:13px;margin-inline:-8px}.br-card-detail>a{font-size:12px;font-weight:700;color:var(--green);border-bottom:1px solid currentColor}.br-load{display:flex;margin:45px auto 0;border:1px solid var(--green);background:none;color:var(--green);padding:14px 20px;font-weight:700;gap:20px;cursor:pointer}.br-load:hover{background:var(--green);color:#fff}.br-empty{text-align:center;padding:65px;color:var(--muted);border:1px dashed var(--line)}
    .br-ownership{padding:140px 0;background:var(--green);color:#fff}.br-own-list{margin-top:75px;border-top:1px solid rgba(255,255,255,.24)}.br-own-row{display:grid;grid-template-columns:42px 48px 1fr minmax(50px,180px) 170px 75px;gap:18px;align-items:center;min-height:90px;border-bottom:1px solid rgba(255,255,255,.2);transition:padding .25s,background .25s}.br-own-row:hover{padding:0 18px;background:rgba(255,255,255,.06)}.br-own-row>span,.br-own-row>small{font:500 10px var(--mono);color:var(--lime)}.br-own-row>strong{font-size:29px;filter:grayscale(.15);transition:transform .3s}.br-own-row:hover>strong{transform:rotate(-9deg) scale(1.2)}.br-own-row p{font:400 17px var(--sans);color:rgba(255,255,255,.65)}.br-own-row i{height:1px;background:rgba(255,255,255,.2)}.br-own-row b{font:500 28px var(--display)}
    .br-promise{padding:140px 0 160px}.br-rules{margin-top:80px;border-top:1px solid var(--line)}.br-rule{display:grid;grid-template-columns:65px 1fr 60px;gap:25px;align-items:start;padding:35px 0;border-bottom:1px solid var(--line);transition:padding .25s,background .25s}.br-rule:hover{padding-inline:20px;background:#e9dfce}.br-rule>span{font:600 11px var(--mono);color:var(--green)}.br-rule h3{font:500 30px var(--display)}.br-rule p{color:var(--muted);margin-top:5px;max-width:55ch}.br-rule>b{font:300 42px var(--display);color:var(--terra);justify-self:end}
    .br-final{min-height:760px;position:relative;display:grid;place-items:center;text-align:center;overflow:hidden}.br-final-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.75)}.br-final-scrim{position:absolute;inset:0;background:rgba(12,32,19,.72)}.br-final-content{position:relative;z-index:2;color:#fff}.br-final-eyebrow{font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--lime)}.br-final h2{font:450 clamp(50px,7.5vw,95px)/.9 var(--display);letter-spacing:-.05em;margin:28px 0;color:#fff}.br-final p{color:rgba(255,255,255,.72);font-size:18px;max-width:45ch;margin:0 auto 35px}
    .br-footer{background:#102e1c;color:#fff;padding:65px 0}.br-footer-grid{display:grid;grid-template-columns:1.1fr .8fr 1fr;gap:70px;align-items:end}.br-logo.footer .br-logo-word{font-size:34px}.br-footer-grid>div>p{color:rgba(255,255,255,.55);font-size:14px;max-width:38ch;margin-top:16px}.br-footer-grid>div:nth-child(2){display:flex;flex-direction:column;gap:6px}.br-footer-grid>div:nth-child(2) span,.br-footer-grid small{font-size:11px;color:rgba(255,255,255,.48)}.br-footer-grid>div:nth-child(2) b{font:500 18px var(--display)}.br-footer-grid>div:nth-child(2) a{font-size:12px;color:var(--lime);margin-top:10px}.br-footer-grid small{line-height:1.6}
    @media(max-width:960px){.br-nav{grid-template-columns:1fr auto}.br-nav-links{display:none}.br-hero-content{grid-template-columns:1fr}.br-field-note{display:none}.br-grid{grid-template-columns:repeat(2,1fr)}.br-people-intro,.br-tradutor-head,.br-promise-head{grid-template-columns:1fr;gap:25px}.br-footer-grid{grid-template-columns:1fr 1fr}.br-footer-grid small{grid-column:1/-1}.br-tools{align-items:stretch;flex-direction:column}.br-search{min-width:0}.br-people-grid{grid-template-columns:1fr 1fr}.br-persona,.br-persona-offset{min-height:540px;margin-top:0}}
    @media(max-width:680px){.br-wrap,.br-hero-content,.br-people-grid{width:min(100% - 30px,1180px)}.br-nav{width:calc(100% - 30px);grid-template-columns:1fr auto auto;gap:15px}.br-nav.is-compact{width:calc(100% - 20px)}.br-nav-cta{display:none}.br-menu{display:block}.br-nav-links{position:absolute;display:none;top:70px;left:0;right:0;padding:18px;background:var(--deep);border:1px solid rgba(255,255,255,.15);flex-direction:column}.br-nav-links.is-open{display:flex}.br-hero-content{padding-bottom:105px}.br-hero-h1{font-size:clamp(53px,16vw,76px);line-height:.87}.br-hero-bottom{display:block;margin-top:32px}.br-hero-bottom p{font-size:15px;margin-bottom:25px}.br-hero-orbit{width:110px;height:110px;top:15%;right:-25px}.br-icon-cloud .i1,.br-icon-cloud .i3,.br-icon-cloud .i5{display:none}.br-icon-cloud .i2{right:4%;top:19%}.br-icon-cloud .i4{right:9%;top:58%}.br-icon-cloud span{width:48px;height:48px;font-size:21px}.br-scroll-cue{display:none}.br-manifesto,.br-people,.br-tradutor,.br-ownership,.br-promise{padding:90px 0}.br-section-index{margin-bottom:32px}.br-manifesto-big{font-size:41px}.br-vs{grid-template-columns:1fr;margin-top:50px}.br-vs-col{min-height:440px;padding:28px}.br-film-break{min-height:620px}.br-film-copy{left:20px;bottom:55px}.br-film-copy p{font-size:45px}.br-film-stamp{width:88px;height:88px;right:18px;top:28px;font-size:8px}.br-people-grid{grid-template-columns:1fr}.br-persona,.br-persona-offset{min-height:480px}.br-persona-caption{left:22px;right:22px;bottom:25px}.br-grid{grid-template-columns:1fr}.br-tradutor h2,.br-people h2,.br-ownership h2,.br-promise h2{font-size:45px}.br-filters{padding-bottom:5px}.br-card{min-height:0}.br-own-row{grid-template-columns:28px 38px 1fr 90px;gap:10px;min-height:78px}.br-own-row i{display:none}.br-own-row b{text-align:right;font-size:20px}.br-own-row small{display:none}.br-own-row>strong{font-size:25px}.br-footer-grid{grid-template-columns:1fr;gap:35px}.br-footer-grid small{grid-column:auto}.br-final{min-height:650px}.br-final h2{font-size:53px}.br-grain{opacity:.035}}
    @media(max-width:960px){.br-sprout-grid{grid-template-columns:1fr;gap:55px}.br-sprout-video-wrap{height:600px}.br-concepts-head{grid-template-columns:1fr;gap:24px}.br-concepts-board{display:block}.br-concept-list{display:block}.br-concept-list button:nth-child(odd){border-right:0}.br-learning-path{grid-template-columns:1fr}.br-learning-path>div{flex-wrap:wrap;justify-content:flex-start}}
    @media(max-width:680px){.br-sprout-scene{padding:80px 0}.br-sprout-video-wrap{height:520px;box-shadow:10px 12px 0 rgba(45,113,65,.13)}.br-sprout-copy h2{font-size:48px}.br-concepts{padding:90px 0}.br-concepts h2{font-size:45px}.br-economy-gallery{grid-template-columns:1fr;margin:45px 0}.br-economy-gallery figure,.br-economy-gallery figure:nth-child(4),.br-economy-gallery figure:nth-child(5){grid-column:auto}.br-concepts-board{margin-top:50px}.br-concept-list{grid-template-columns:1fr}.br-concept-list button:nth-child(odd){border-right:0}.br-concept-detail{min-height:680px;padding:30px 24px}.br-concept-inline{padding:30px 24px 34px}.br-concept-art{margin:-30px -24px 28px}.br-concept-icon{margin-bottom:38px}.br-concept-example{left:24px;right:24px;bottom:28px}.br-learning-path{padding:24px}.br-learning-path>div{display:grid;grid-template-columns:28px 1fr}.br-learning-path i{display:none}}
    @media(prefers-reduced-motion:reduce){.br-hero-enter,.br-reveal{opacity:1;transform:none;animation:none;transition:none}.br-tape-track,.br-hero-orbit,.br-scroll-cue i:after,.br-pulse-line i,.br-icon-cloud span,.br-film-break video,.br-film-stamp,.br-video-label i,.br-concept-icon{animation:none}.br-hero-video{transform:none}.br-card,.br-persona img,.br-btn{transition:none}}
  `}</style>
}
