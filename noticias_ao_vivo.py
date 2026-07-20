"""
Coleta notícias financeiras e políticas do Brasil via RSS público.
Não precisa de chave de API — usa feeds abertos.
"""
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import re
import json

FEEDS = [
    {
        "nome": "Infomoney",
        "url": "https://www.infomoney.com.br/feed/",
        "categoria": "Mercado",
        "cor": "#4488ff",
    },
    {
        "nome": "G1 Economia",
        "url": "https://g1.globo.com/rss/g1/economia/",
        "categoria": "Economia",
        "cor": "#009c3b",
    },
    {
        "nome": "G1 Política",
        "url": "https://g1.globo.com/rss/g1/politica/",
        "categoria": "Política",
        "cor": "#d4a017",
    },
    {
        "nome": "Agência Brasil",
        "url": "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
        "categoria": "Política Econômica",
        "cor": "#009c3b",
    },
    {
        "nome": "UOL Economia",
        "url": "https://economia.uol.com.br/rss.xml",
        "categoria": "Negócios",
        "cor": "#ff8800",
    },
    {
        "nome": "Correio Braziliense Economia",
        "url": "https://www.correiobraziliense.com.br/economia/rss.xml",
        "categoria": "Brasília / DF",
        "cor": "#ff4466",
    },
    {
        "nome": "Metrópoles Economia",
        "url": "https://www.metropoles.com/economia/feed",
        "categoria": "Brasília / DF",
        "cor": "#d4a017",
    },
]

# Palavras-chave que indicam relevância para a B3
KEYWORDS_ALTA = [
    "bovespa", "ibovespa", "b3", "petrobras", "vale", "itaú", "bradesco",
    "selic", "copom", "ipca", "câmbio", "dólar", "juros", "inflação",
    "pib", "fiscal", "orçamento", "déficit", "superávit", "reforma",
    "commodities", "petróleo", "brent", "minério", "agronegócio", "safra",
    "exportação", "importação", "balança comercial", "reservas",
    "ações", "mercado financeiro", "bolsa", "pregão", "dividendos",
    "banco central", "fazenda", "economia", "recessão", "crescimento",
    "leilão", "concessão", "infraestrutura", "energia elétrica",
    "eleições", "congresso", "senado", "câmara", "presidente",
]

KEYWORDS_URGENTE = [
    "emergência", "crise", "colapso", "crash", "queda forte", "disparada",
    "aprovado", "vetado", "sancionado", "intervenção", "corte de juros",
    "alta de juros", "inadimplência", "calote", "falência", "concordata",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

NS = {
    "dc": "http://purl.org/dc/elements/1.1/",
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}


def _limpar(texto: str) -> str:
    if not texto:
        return ""
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = re.sub(r"&[a-z]+;", " ", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()[:400]


def _relevancia(titulo: str, descricao: str) -> tuple[int, str]:
    """Retorna (score, urgencia)."""
    texto = (titulo + " " + descricao).lower()
    score = sum(1 for kw in KEYWORDS_ALTA if kw in texto)
    urgencia = "alta" if any(kw in texto for kw in KEYWORDS_URGENTE) else \
               "media" if score >= 3 else "baixa"
    return score, urgencia


def _fetch_feed(feed: dict) -> list:
    noticias = []
    try:
        req = urllib.request.Request(feed["url"], headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml_bytes = resp.read()

        root = ET.fromstring(xml_bytes)
        channel = root.find("channel") or root

        items = channel.findall("item")
        if not items:
            items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

        for item in items[:15]:
            def tag(name):
                t = item.find(name)
                return t.text if t is not None else ""

            titulo = _limpar(tag("title"))
            descricao = _limpar(tag("description") or tag("summary") or "")
            link = tag("link") or tag("guid") or ""
            pub_date = tag("pubDate") or tag("updated") or ""

            if not titulo:
                continue

            score, urgencia = _relevancia(titulo, descricao)
            if score == 0:
                continue

            noticias.append({
                "titulo": titulo,
                "descricao": descricao,
                "link": link,
                "fonte": feed["nome"],
                "categoria": feed["categoria"],
                "cor": feed["cor"],
                "urgencia": urgencia,
                "score_relevancia": score,
                "pub_date": pub_date,
            })

    except Exception as e:
        print(f"  [FEED ERRO] {feed['nome']}: {e}")

    return noticias


def _detectar_setores(titulo: str, descricao: str) -> list[str]:
    texto = (titulo + " " + descricao).lower()
    mapa = {
        "Petróleo & Gás (PETR4, PRIO3, RECV3)": ["petrobras", "petróleo", "combustível", "pré-sal", "brent", "opep", "refinaria", "gasolina", "diesel"],
        "Mineração & Siderurgia (VALE3, CSNA3, GGBR4, USIM5)": ["vale", "minério", "ferro", "china", "aço", "siderúrgic", "gerdau", "csn", "usiminas"],
        "Bancos (ITUB4, BBDC4, BBAS3, SANB11, B3SA3)": ["selic", "juros", "crédito", "banco", "inadimplência", "spread", "copom", "itaú", "bradesco", "banco do brasil"],
        "Agro (SLCE3, SMTO3, AGRO3, RAIZ4)": ["agro", "safra", "soja", "milho", "etanol", "açúcar", "commodities agrícolas", "fertilizante", "plano safra"],
        "Varejo & Consumo (MGLU3, LREN3, ASAI3, ABEV3)": ["varejo", "consumo", "renda", "emprego", "confiança do consumidor", "e-commerce", "magazine", "lojas renner", "ambev"],
        "Energia Elétrica (ELET3, CPFE3, CMIG4, EQTL3)": ["energia", "elétric", "aneel", "hidrelétric", "tarifas", "eletrobras", "bandeira tarifária"],
        "Construção & Imobiliário (CYRE3, MRVE3, EZTC3)": ["construção", "imobiliário", "imóveis", "minha casa", "construtora", "fgts", "financiamento imobiliário"],
        "Saúde (HAPV3, RDOR3, FLRY3)": ["saúde", "hospital", "plano de saúde", "ans", "hapvida", "rede d'or", "farmác"],
        "Tecnologia (TOTS3, LWSA3, POSI3)": ["tecnologia", "software", "startup", "inteligência artificial", "totvs", "data center"],
        "Aviação & Logística (AZUL4, GOLL4, RAIL3)": ["aviação", "aérea", "querosene", "azul", "gol", "rumo", "ferrovia", "logística", "porto"],
        "Frigoríficos (JBSS3, MRFG3, BEEF3)": ["frigorífico", "carne", "jbs", "marfrig", "minerva", "boi", "exportação de carne", "gripe aviária"],
        "Telecom (VIVT3, TIMS3)": ["telecom", "vivo", "tim", "5g", "anatel", "fibra"],
        "Educação (COGN3, YDUQ3)": ["educação", "ensino superior", "fies", "cogna", "yduqs", "faculdade"],
        "Câmbio / Exportadores": ["câmbio", "dólar", "exportaç", "importaç", "balança comercial"],
        "Todos os ativos": ["ibovespa", "bolsa", "b3", "bovespa", "mercado financeiro"],
    }
    encontrados = []
    for setor, palavras in mapa.items():
        if any(p in texto for p in palavras):
            encontrados.append(setor)
    return encontrados[:3] if encontrados else ["Mercado geral"]


def coletar_noticias(max_por_feed: int = 8) -> dict:
    """Coleta e processa todas as notícias. Retorna dict pronto para JSON."""
    print("  [NOTÍCIAS] Coletando RSS...")
    todas = []
    for feed in FEEDS:
        items = _fetch_feed(feed)
        print(f"    {feed['nome']}: {len(items)} relevantes")
        todas.extend(items)

    # Ordena por relevância, depois urgência
    order = {"alta": 0, "media": 1, "baixa": 2}
    todas.sort(key=lambda x: (order.get(x["urgencia"], 2), -x["score_relevancia"]))

    # Remove duplicatas por título similar
    vistos = set()
    dedup = []
    for n in todas:
        chave = n["titulo"][:60].lower()
        if chave not in vistos:
            vistos.add(chave)
            # Enriquece com setores afetados
            n["setores"] = _detectar_setores(n["titulo"], n["descricao"])
            dedup.append(n)

    top = dedup[:30]
    urgentes = [n for n in top if n["urgencia"] == "alta"]
    destaque = top[:1][0] if top else None

    return {
        "coletado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "total": len(top),
        "urgentes": len(urgentes),
        "destaque": destaque,
        "noticias": top,
    }


if __name__ == "__main__":
    dados = coletar_noticias()
    print(json.dumps(dados, ensure_ascii=False, indent=2)[:2000])
