"""
COMITÊ DE INTELIGÊNCIA — Caryo Map
===================================
Sete analistas especialistas debatem UMA ação a partir do dossiê gerado pelo
analisador técnico. Cada um responde pela sua lente (postura + argumentos +
riscos); um sintetizador lê os sete votos e escreve o Sumário Executivo do
Debate — o produto que o assinante recebe.

Arquitetura fan-out / fan-in:
    dossiê ─┬─► Caçador de Small Caps ─┐
            ├─► Macroespecialista      │
            ├─► Analista Gráfico       ├─► Sintetizador ─► comite_<TICKER>.json
            ├─► Fundamentalista        │
            ├─► Cético (Risco)         │
            ├─► Espec. em Dividendos   │
            └─► Sentinela de Notícias ─┘

Provedores suportados (escolha por variável de ambiente):
  • Gemini (Google) — GEMINI_API_KEY   [padrão, tem tier gratuito]
  • Claude (Anthropic) — ANTHROPIC_API_KEY

Uso:     python comite_ia.py UGPA3
"""

import os
import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

# Provider: "gemini" (padrão) ou "anthropic"
PROVIDER = os.environ.get("COMITE_PROVIDER", "gemini").lower()
MODELO_GEMINI    = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
MODELO_ANTHROPIC = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

# ─────────────────────────────────────────────
# As sete personas do comitê
# ─────────────────────────────────────────────
PERSONAS = [
    {
        "id": "small_caps", "nome": "O Caçador de Small Caps", "emoji": "🔎",
        "sistema": (
            "Você é o Caçador de Small Caps do comitê Caryo Map. Você caça gemas de baixa "
            "liquidez (volume < R$1M/dia), assimetrias severas de preço e distorções gráficas — "
            "as pérolas fora do radar institucional. Blue chips e large caps NÃO são seu terreno; "
            "quando a ação é grande e líquida, diga isso com honestidade e abstenha-se. "
            "Fale curto, direto, com faro de quem procura o que ninguém está olhando."
        ),
    },
    {
        "id": "macro", "nome": "A Macroespecialista", "emoji": "🌍",
        "sistema": (
            "Você é a Macroespecialista do comitê Caryo Map. Você lê Copom, Fed, Selic, inflação, "
            "câmbio, Brent e fluxo estrangeiro, e conecta o cenário macro ao setor da empresa. "
            "Seu voto reflete se o vento macro sopra a favor ou contra o papel."
        ),
    },
    {
        "id": "quant", "nome": "O Analista Gráfico", "emoji": "📈",
        "sistema": (
            "Você é o Analista Gráfico (Quant) do comitê Caryo Map. Você IGNORA notícias e "
            "fundamentos: lê puramente preço, RSI, MACD, Bandas de Bollinger, médias móveis, "
            "volume e distância de máximas/mínimas. Fala em níveis e gatilhos. Se o papel está "
            "esticado, você avisa que o momento de entrada é ruim mesmo que a tendência seja boa."
        ),
    },
    {
        "id": "fundamentalista", "nome": "A Fundamentalista", "emoji": "📊",
        "sistema": (
            "Você é a Fundamentalista (value investing) do comitê Caryo Map. Você analisa P/L, "
            "P/VP, ROE, margens e múltiplos históricos. Separa qualidade do negócio de preço da "
            "ação: uma boa empresa pode ser má compra se estiver cara. Desconfie de dados de fonte "
            "que pareçam corrompidos (ex.: dividend yield absurdo) e diga isso."
        ),
    },
    {
        "id": "cetico", "nome": "O Cético", "emoji": "🛡️",
        "sistema": (
            "Você é o Cético, o gestor de risco do comitê Caryo Map, programado para DESTRUIR "
            "teses. Sua função é achar os espinhos: risco de liquidez, governança, dados "
            "inconsistentes, armadilhas técnicas, assimetria negativa de risco/retorno. Você "
            "define onde fica o stop defensivo e alerta quando comprar significa perseguir euforia."
        ),
    },
    {
        "id": "dividendos", "nome": "A Especialista em Dividendos", "emoji": "💰",
        "sistema": (
            "Você é a Especialista em Dividendos do comitê Caryo Map. Foco em fluxo de caixa "
            "previsível, geração de renda passiva e empresas maduras. Pensa em acumular em quedas, "
            "nunca perseguir no topo. Se o dividend yield informado for irreal, use ROE e o perfil "
            "do negócio para julgar a capacidade de gerar renda."
        ),
    },
    {
        "id": "sentinela", "nome": "A Sentinela de Notícias", "emoji": "📰",
        "sistema": (
            "Você é a Sentinela de Notícias do comitê Caryo Map. Você lê o sentimento do mercado a "
            "partir de volume anômalo, variações recentes e o noticiário do setor. Sinaliza se há "
            "fluxo comprador/vendedor incomum e se a notícia parece já estar precificada."
        ),
    },
]

FORMATO = (
    "Responda SOMENTE com um JSON válido, sem markdown, no formato:\n"
    '{"postura": "COMPRAR|OBSERVAR|EVITAR|ABSTENHO", '
    '"resumo": "uma frase de veredito", '
    '"argumentos": ["2 a 4 pontos objetivos citando os números do dossiê"], '
    '"riscos": ["1 a 2 riscos que você enxerga"]}'
)

SINTETIZADOR = (
    "Você é o Sintetizador do comitê Caryo Map. Recebeu os votos de sete analistas sobre uma "
    "ação. Escreva o Sumário Executivo do Debate para o assinante: um veredito único (COMPRAR, "
    "OBSERVAR ou EVITAR), o placar dos votos, um parágrafo que concilia as divergências com "
    "honestidade (a marca protege o investidor dos espinhos — não persegue euforia), e o gatilho "
    "concreto que mudaria o veredito. Responda SOMENTE com JSON válido no formato:\n"
    '{"veredito": "COMPRAR|OBSERVAR|EVITAR", '
    '"placar": {"comprar": int, "observar": int, "evitar": int}, '
    '"texto": "parágrafo do sumário executivo", '
    '"gatilho": "o que esperar para reavaliar", '
    '"entrada_ref": "faixa de entrada sugerida ou null", '
    '"stop_ref": "nível de stop ou null", '
    '"alvo_ref": "nível de alvo ou null"}'
)


def construir_dossie(row: dict) -> str:
    """Texto humano-legível do dossiê que todos os analistas recebem."""
    def g(k): return row.get(k, "-")
    return (
        f"Ticker: {g('ticker')} | Preço: R$ {g('preco')}\n"
        f"Variação: 1d {g('var_1d')}% · 5d {g('var_5d')}% · 20d {g('var_20d')}%\n"
        f"RSI(14): {g('rsi')} | MACD hist: {g('macd_hist')} | Bollinger %B: {g('bb_pct')}%\n"
        f"Volume vs média: {g('vol_ratio')}x | ATR: {g('atr_pct')}%/dia\n"
        f"Distância da mínima 52s: {g('dist_min52')}% | da máxima 52s: {g('dist_max52')}%\n"
        f"P/L: {g('pl')} | P/VP: {g('pvp')} | ROE: {g('roe')} | DY informado: {g('dy')}\n"
        f"Score técnico: {g('score')}/100 ({g('classificacao')})"
    )


def _extrair_json(txt: str) -> dict:
    txt = txt.strip()
    if txt.startswith("```"):
        txt = txt.split("```")[1].replace("json", "", 1).strip()
    # tolera texto antes/depois do objeto
    ini, fim = txt.find("{"), txt.rfind("}")
    if ini >= 0 and fim > ini:
        txt = txt[ini:fim + 1]
    return json.loads(txt)


def _chamar_gemini(sistema: str, conteudo: str, tentativas: int = 5) -> dict:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("Defina GEMINI_API_KEY no ambiente.")
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{MODELO_GEMINI}:generateContent?key={key}")
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": sistema}]},
        "contents": [{"parts": [{"text": conteudo}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1200,
                             "responseMimeType": "application/json"},
    }).encode("utf-8")
    ultimo = ""
    for t in range(tentativas):
        req = urllib.request.Request(url, data=payload,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            return _extrair_json(data["candidates"][0]["content"]["parts"][0]["text"])
        except urllib.error.HTTPError as e:
            code = e.code
            ultimo = e.read().decode("utf-8", "ignore")[:160]
            if code in (503, 429, 500) and t < tentativas - 1:
                time.sleep(2 * (t + 1))  # backoff: modelo ocupado
                continue
            raise RuntimeError(f"HTTP {code}: {ultimo}")
    raise RuntimeError(f"Falhou após {tentativas} tentativas: {ultimo}")


def _chamar_anthropic(client, sistema: str, conteudo: str) -> dict:
    msg = client.messages.create(
        model=MODELO_ANTHROPIC, max_tokens=900, system=sistema,
        messages=[{"role": "user", "content": conteudo}],
    )
    return _extrair_json(msg.content[0].text)


def _chamar(client, sistema: str, conteudo: str) -> dict:
    if PROVIDER == "anthropic":
        return _chamar_anthropic(client, sistema, conteudo)
    return _chamar_gemini(sistema, conteudo)


VERIFICADOR = (
    "Você é o Auditor de Dados do Caryo Map. Recebe o DOSSIÊ-FONTE (números verdadeiros) e os "
    "TEXTOS dos analistas. Sua ÚNICA tarefa é conferir se algum número citado pelos analistas "
    "contradiz o dossiê (valor inventado, trocado ou fora de contexto). Pequenas paráfrases e "
    "arredondamentos coerentes são aceitáveis. Não avalie opinião, só fatos numéricos. "
    "Responda SOMENTE JSON: "
    '{"ok": true|false, "alertas": ["descreva cada número divergente, ou vazio se tudo confere"]}'
)


def verificar_numeros(client, dossie: str, analistas: list, sintese: dict) -> dict:
    """Segunda passada: relê o debate contra o dossiê e sinaliza números divergentes."""
    textos = []
    for a in analistas:
        textos.append(f"{a['nome']} ({a['postura']}): {a.get('resumo','')} " +
                      " ".join(a.get("argumentos", [])) + " " + " ".join(a.get("riscos", [])))
    textos.append("Síntese: " + sintese.get("texto", ""))
    conteudo = f"DOSSIÊ-FONTE:\n{dossie}\n\nTEXTOS DOS ANALISTAS:\n" + "\n".join(textos)
    try:
        r = _chamar(client, VERIFICADOR, conteudo)
        return {
            "conferido": True,
            "ok": bool(r.get("ok", False)),
            "alertas": r.get("alertas", []) or [],
            "conferido_em": datetime.now().strftime("%d/%m/%Y"),
        }
    except Exception as e:
        return {"conferido": False, "ok": None, "alertas": [], "erro": str(e)[:100]}


def gerar_comite(ticker: str, row: dict, empresa: str = "", setor: str = "") -> dict:
    client = None
    if PROVIDER == "anthropic":
        try:
            import anthropic
        except ImportError:
            raise SystemExit("Instale: pip install anthropic")
        client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY

    print(f"Provider: {PROVIDER} | modelo: {MODELO_GEMINI if PROVIDER=='gemini' else MODELO_ANTHROPIC}")
    dossie = construir_dossie(row)
    analistas = []
    falhas = 0
    for p in PERSONAS:
        prompt = f"Dossiê da ação:\n{dossie}\n\nDê seu parecer.\n{FORMATO}"
        try:
            r = _chamar(client, p["sistema"], prompt)
            print(f"  [OK] {p['nome']}: {r.get('postura')}")
        except Exception as e:
            falhas += 1
            r = {"postura": "OBSERVAR", "resumo": f"(indisponível)", "argumentos": [], "riscos": []}
            print(f"  [FALHA] {p['nome']}: {str(e)[:120]}")
        analistas.append({"id": p["id"], "nome": p["nome"], "emoji": p["emoji"], **r})

    # Se todos falharam, não escreve JSON quebrado.
    if falhas == len(PERSONAS):
        raise SystemExit(
            "\nTodas as chamadas à API falharam. Verifique a chave "
            f"({'GEMINI_API_KEY' if PROVIDER=='gemini' else 'ANTHROPIC_API_KEY'}) e a quota do provider."
        )

    votos = "\n".join(f"- {a['nome']}: {a['postura']} — {a['resumo']}" for a in analistas)
    try:
        sintese = _chamar(client, SINTETIZADOR, f"Dossiê:\n{dossie}\n\nVotos:\n{votos}")
    except Exception as e:
        raise SystemExit(f"\nSintese falhou: {str(e)[:160]}")

    # 2ª verificação: confere os números citados contra o dossiê-fonte
    verificacao = verificar_numeros(client, dossie, analistas, sintese)

    return {
        "ticker": ticker, "empresa": empresa, "setor": setor,
        "preco": row.get("preco"), "data": row.get("data", ""),
        "dossie": row, "analistas": analistas, "sintese": sintese,
        "verificacao": verificacao,
        "fontes": [
            "Preço e indicadores técnicos (RSI, MACD, Bollinger, volume): cálculo próprio sobre cotações do Yahoo Finance / brapi.dev.",
            "Múltiplos (P/L, P/VP, ROE, DY): provedor de mercado — quando disponível, priorizamos os dados oficiais da CVM no Raio-X Fundamentalista.",
            "Análise e síntese: geradas por IA a partir exclusivamente dos números acima, e conferidas por uma segunda verificação automática.",
        ],
    }


# Nome/setor de empresas conhecidas (enriquece o cabeçalho da Mesa)
EMPRESAS = {
    "BBAS3": ("Banco do Brasil S.A.", "Bancos — banco público de varejo e crédito"),
    "PETR4": ("Petróleo Brasileiro S.A. — Petrobras", "Petróleo, gás e energia"),
    "VALE3": ("Vale S.A.", "Mineração e siderurgia"),
    "ITUB4": ("Itaú Unibanco Holding S.A.", "Bancos — maior banco privado da AL"),
    "MGLU3": ("Magazine Luiza S.A.", "Varejo e e-commerce"),
    "SLCE3": ("SLC Agrícola S.A.", "Agronegócio — grãos e algodão"),
    "PRIO3": ("PRIO S.A.", "Petróleo — exploração e produção"),
    "CVCB3": ("CVC Brasil Operadora e Agência de Viagens", "Turismo e viagens"),
    "GFSA3": ("Gafisa S.A.", "Construção civil e incorporação"),
    "UGPA3": ("Ultrapar Participações S.A.", "Distribuição de combustíveis e gás (Ipiranga, Ultragaz)"),
    "WEGE3": ("WEG S.A.", "Bens de capital — motores e equipamentos elétricos"),
    "BBSE3": ("BB Seguridade Participações S.A.", "Seguros e previdência"),
    "MTRE3": ("Mitre Realty Empreendimentos", "Construção civil e incorporação"),
    "BBDC4": ("Banco Bradesco S.A.", "Bancos — banco privado de varejo"),
    "RAIZ4": ("Raízen S.A.", "Energia — etanol, açúcar e distribuição"),
    "CMIN3": ("CSN Mineração S.A.", "Mineração — minério de ferro"),
    "DIRR3": ("Direcional Engenharia S.A.", "Construção civil — baixa renda"),
    "ONCO3": ("Oncoclínicas do Brasil", "Saúde — oncologia"),
    "ABEV3": ("Ambev S.A.", "Bebidas — cervejaria e refrigerantes"),
    "B3SA3": ("B3 S.A.", "Serviços financeiros — bolsa de valores"),
    "RENT3": ("Localiza Rent a Car S.A.", "Aluguel de carros e gestão de frotas"),
    "EQTL3": ("Equatorial Energia S.A.", "Energia — distribuição e transmissão"),
    "RADL3": ("Raia Drogasil S.A.", "Varejo farmacêutico"),
    "SUZB3": ("Suzano S.A.", "Papel e celulose"),
    "ELET3": ("Eletrobras", "Energia — geração e transmissão"),
    "JBSS3": ("JBS S.A.", "Alimentos — processamento de carnes"),
    "BPAC11": ("Banco BTG Pactual S.A.", "Bancos — banco de investimento"),
    "ENAT3": ("Enauta Participações S.A.", "Petróleo — exploração e produção (Small Cap)"),
    "HYPE3": ("Hypera S.A.", "Saúde — indústria farmacêutica"),
    "VIVT3": ("Telefônica Brasil S.A.", "Telecomunicações"),
    "EGIE3": ("Engie Brasil Energia S.A.", "Energia — geração elétrica"),
    "CPLE6": ("Companhia Paranaense de Energia", "Energia — geração e distribuição"),
    "SBSP3": ("Sabesp", "Saneamento básico"),
    "KLBN11": ("Klabin S.A.", "Papel e celulose"),
    "TRPL4": ("ISA CTEEP", "Energia — transmissão elétrica"),
    "CMIG4": ("CEMIG", "Energia — geração e distribuição"),
    "GGBR4": ("Gerdau S.A.", "Siderurgia"),
    "FLRY3": ("Fleury S.A.", "Saúde — medicina diagnóstica"),
    "CSNA3": ("Companhia Siderúrgica Nacional", "Siderurgia e mineração"),
    "MULT3": ("Multiplan", "Imóveis — shopping centers"),
    "BRFS3": ("BRF S.A.", "Alimentos — aves e suínos"),
    "CCRO3": ("CCR S.A.", "Infraestrutura — concessões rodoviárias"),
    "CYRE3": ("Cyrela Brazil Realty", "Construção civil e incorporação"),
    "BRAV3": ("Brava Energia", "Petróleo e gás (Fusão 3R e Enauta)"),
    "AZUL4": ("Azul S.A.", "Aviação civil"),
    "LREN3": ("Lojas Renner S.A.", "Varejo de moda"),
    "TOTS3": ("TOTVS S.A.", "Tecnologia — softwares de gestão"),
    "PSSA3": ("Porto Seguro S.A.", "Seguros"),
    "YDUQ3": ("YDUQS Participações S.A.", "Educação superior"),
    "QUAL3": ("Qualicorp", "Saúde — corretora de seguros (Small Cap)"),
    "CRFB3": ("Carrefour Brasil", "Varejo — supermercados e atacarejo"),
    "TIMS3": ("TIM S.A.", "Telecomunicações"),
    "NTCO3": ("Natura &Co", "Cosméticos e higiene"),
    "VAMO3": ("Grupo Vamos", "Logística — locação de caminhões e máquinas"),
    "TEND3": ("Construtora Tenda", "Construção civil — baixa renda (Small Cap)"),
    "JALL3": ("Jalles Machado", "Agronegócio — setor sucroenergético (Small Cap)"),
    "MATD3": ("Mater Dei", "Saúde — rede hospitalar (Small Cap)"),
    "PORT3": ("Wilson Sons", "Logística — operações portuárias (Small Cap)"),
    "TUPY3": ("Tupy S.A.", "Metalurgia — componentes estruturais (Small Cap)"),
    "ROMI3": ("Indústrias Romi S.A.", "Bens de capital — máquinas e equipamentos (Small Cap)"),
    "UNIP6": ("Unipar Carbocloro", "Química — cloro e soda (Mid Cap)"),
    "RAPT4": ("Randon S.A.", "Bens de capital — implementos rodoviários (Small Cap)"),
    "FESA4": ("Ferbasa", "Siderurgia — ferroligas (Small Cap)"),
    "KRSA3": ("Kora Saúde", "Saúde — rede hospitalar (Small Cap)"),
    "FRAS3": ("Fras-le", "Autopeças (Small Cap)"),
    "VLID3": ("Valid Soluções", "Serviços — identificação e segurança (Small Cap)"),
    "KEPL3": ("Kepler Weber", "Agronegócio — armazenagem e silos (Small Cap)"),
    "AMBP3": ("Ambipar", "Meio Ambiente — gestão ambiental (Mid Cap)"),
    "VULC3": ("Vulcabras", "Varejo — calçados esportivos (Small Cap)"),
    "PGMN3": ("Pague Menos", "Varejo farmacêutico (Small Cap)"),
}

if __name__ == "__main__":
    import csv, glob
    tk = (sys.argv[1] if len(sys.argv) > 1 else "UGPA3").upper()
    csvs = sorted(glob.glob("b3_analise_*.csv"))
    if not csvs:
        raise SystemExit("Nenhum CSV do analisador encontrado.")
    with open(csvs[-1], encoding="utf-8") as f:
        rows = list(csv.DictReader(f, delimiter=";"))
    row = next((r for r in rows if r["ticker"] == tk), None)
    if not row:
        raise SystemExit(f"{tk} não está no CSV.")
    empresa, setor = EMPRESAS.get(tk, ("", ""))
    out = gerar_comite(tk, row, empresa, setor)
    dest = f"plataforma/relatorios/comite_{tk}.json"
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"OK → {dest} | veredito: {out['sintese'].get('veredito')}")
