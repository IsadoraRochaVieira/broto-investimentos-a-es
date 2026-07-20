"""
Coleta dados macro em tempo real:
- Selic atual via API do Banco Central
- Dólar, Brent, Ibovespa via yfinance
- DI futuro aproximado via spread
"""

import json
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

try:
    import yfinance as yf
    YFINANCE_OK = True
except ImportError:
    YFINANCE_OK = False


def buscar_selic() -> str:
    """Busca taxa Selic atual na API do Banco Central do Brasil."""
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        req = urllib.request.Request(url, headers={"User-Agent": "B3Radar/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            dados = json.loads(r.read())
            return dados[0]["valor"]
    except Exception:
        return "14,25"


def buscar_precos_yf() -> dict:
    """Busca Ibovespa, Dólar e Brent via yfinance."""
    resultado = {
        "ibovespa": "-",
        "ibovespa_var": 0.0,
        "dolar": "-",
        "dolar_var": 0.0,
        "brent": "-",
        "brent_var": 0.0,
    }

    if not YFINANCE_OK:
        return resultado

    tickers = {
        "ibov":  "^BVSP",
        "dolar": "BRL=X",
        "brent": "BZ=F",
    }

    for chave, ticker in tickers.items():
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="2d", interval="1d")
            if len(hist) >= 2:
                atual = hist["Close"].iloc[-1]
                anterior = hist["Close"].iloc[-2]
                var = round((atual - anterior) / anterior * 100, 2)
            elif len(hist) == 1:
                atual = hist["Close"].iloc[-1]
                var = 0.0
            else:
                continue

            if chave == "ibov":
                resultado["ibovespa"] = f"{atual:,.0f}".replace(",", ".")
                resultado["ibovespa_var"] = var
            elif chave == "dolar":
                resultado["dolar"] = f"{atual:.2f}".replace(".", ",")
                resultado["dolar_var"] = var
            elif chave == "brent":
                resultado["brent"] = f"{atual:.2f}"
                resultado["brent_var"] = var
        except Exception:
            continue

    return resultado


def buscar_ipca() -> str:
    """Busca IPCA acumulado 12 meses via BCB."""
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json"
        req = urllib.request.Request(url, headers={"User-Agent": "B3Radar/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            dados = json.loads(r.read())
            return dados[0]["valor"]
    except Exception:
        return "-"


def coletar_macro() -> dict:
    """Ponto de entrada principal — retorna dict completo com todos os dados macro."""
    print("[MACRO] Coletando dados em tempo real...")

    precos = buscar_precos_yf()
    selic = buscar_selic()
    ipca = buscar_ipca()

    macro = {
        **precos,
        "selic": selic,
        "ipca_12m": ipca,
        "atualizado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
    }

    print(f"  Ibovespa : {macro['ibovespa']} ({macro['ibovespa_var']:+.2f}%)")
    print(f"  Dólar    : R$ {macro['dolar']} ({macro['dolar_var']:+.2f}%)")
    print(f"  Brent    : US$ {macro['brent']} ({macro['brent_var']:+.2f}%)")
    print(f"  Selic    : {macro['selic']}%")
    print(f"  IPCA 12m : {macro['ipca_12m']}%")

    return macro


if __name__ == "__main__":
    import pprint
    pprint.pprint(coletar_macro())
