"""
FUNDAMENTOS CVM — Caryo Map
============================
Extrai dados de balanço OFICIAIS e AUDITADOS direto da CVM (dados.cvm.gov.br,
demonstrações DFP) — receita, lucro, patrimônio, margens e evolução ano a ano —
e opcionalmente pede ao provedor de IA uma leitura em português claro.

É o fosso de dados do Caryo Map: enquanto concorrentes exibem P/L do Yahoo
(muitas vezes corrompido), aqui o número vem da fonte reguladora.

Uso:  python fundamentos_cvm.py WEGE3 VALE3 PETR4
Saída: plataforma/relatorios/fundamentos_<TICKER>.json
"""
import csv
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent
CACHE = ROOT / "cache_cvm"
CACHE.mkdir(exist_ok=True)
DEST_DIR = ROOT / "plataforma" / "relatorios"
BRAPI_TOKEN = "wWjyqivfUbeVVe9jLzP6pB"

# Overrides para nomes que o casamento automático erra (ex.: bancos "BCO")
OVERRIDE_CVM = {
    "BBAS3": "001023",  # Banco do Brasil
    "BBDC4": "000906",  # Bradesco
    "SANB11": "020532", # Santander BR
    "ITSA4": "007617",  # Itaúsa
}

# Contas padrão (plano CVM). Bancos/seguradoras variam — tratadas com fallback.
CONTA = {"receita": "3.01", "lucro": "3.11", "ativo": "1", "pl": "2.03"}


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"\b(S\.?A\.?|SA|PARTICIPACOES|PART|HOLDING|CIA|COMPANHIA|DO|DA|DE|E)\b", "", s.upper())
    return re.sub(r"[^A-Z0-9]", "", s)


def baixar(url: str, destino: Path) -> Path:
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    print(f"  baixando {url.split('/')[-1]}...")
    urllib.request.urlretrieve(url, destino)
    return destino


def carregar_registro() -> list:
    p = baixar("https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv", CACHE / "cad.csv")
    return list(csv.DictReader(open(p, encoding="latin-1"), delimiter=";"))


def carregar_dfp(ano: int) -> dict:
    """Retorna {arquivo_curto: linhas} para DRE/BPA/BPP consolidados do ano."""
    zip_path = baixar(
        f"https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_{ano}.zip",
        CACHE / f"dfp_{ano}.zip",
    )
    z = zipfile.ZipFile(zip_path)
    out = {}
    for chave in ("DRE_con", "BPA_con", "BPP_con"):
        nome = f"dfp_cia_aberta_{chave}_{ano}.csv"
        out[chave] = list(csv.DictReader(io.TextIOWrapper(z.open(nome), encoding="latin-1"), delimiter=";"))
    return out


def mapear_ticker_cvm(ticker: str, empresa_nome: str, registro: list) -> str | None:
    if ticker in OVERRIDE_CVM:
        return OVERRIDE_CVM[ticker]
    nn = _norm(empresa_nome)
    if not nn:
        return None
    for r in registro:
        if _norm(r["DENOM_SOCIAL"]) == nn:
            return r["CD_CVM"].zfill(6)
    for r in registro:  # substring
        rn = _norm(r["DENOM_SOCIAL"])
        if rn and (nn in rn or rn in nn) and len(nn) > 4:
            return r["CD_CVM"].zfill(6)
    return None


def _valor(linhas: list, cd_cvm: str, conta: str, ordem: str) -> float | None:
    alvo = cd_cvm.zfill(6)
    for r in linhas:
        if r["CD_CVM"].zfill(6) == alvo and r["CD_CONTA"] == conta and r["ORDEM_EXERC"] == ordem:
            try:
                return float(r["VL_CONTA"]) * 1000  # escala MIL -> reais
            except ValueError:
                return None
    return None


def extrair(cd_cvm: str, dfp: dict) -> dict:
    def par(chave, conta):
        return (_valor(dfp[chave], cd_cvm, conta, "ÚLTIMO"),
                _valor(dfp[chave], cd_cvm, conta, "PENÚLTIMO"))

    receita_u, receita_p = par("DRE_con", CONTA["receita"])
    lucro_u, lucro_p = par("DRE_con", CONTA["lucro"])
    ativo_u, _ = par("BPA_con", CONTA["ativo"])
    pl_u, _ = par("BPP_con", CONTA["pl"])

    def cresc(u, p):
        if u is None or p is None or p == 0:
            return None
        return round((u - p) / abs(p) * 100, 1)

    def marg(l, r):
        if l is None or r is None or r == 0:
            return None
        return round(l / r * 100, 1)

    return {
        "receita": receita_u, "receita_ant": receita_p, "receita_cresc": cresc(receita_u, receita_p),
        "lucro": lucro_u, "lucro_ant": lucro_p, "lucro_cresc": cresc(lucro_u, lucro_p),
        "margem_liquida": marg(lucro_u, receita_u),
        "ativo_total": ativo_u, "patrimonio_liquido": pl_u,
        "roe": round(lucro_u / pl_u * 100, 1) if (lucro_u and pl_u) else None,
    }


def leitura_ia(ticker: str, empresa: str, f: dict) -> str | None:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return None
    def bi(v): return f"R$ {v/1e9:.1f} bi" if v else "n/d"
    resumo = (
        f"Empresa: {empresa} ({ticker}). Dados do último exercício (CVM/DFP):\n"
        f"Receita: {bi(f['receita'])} (var {f['receita_cresc']}% a/a)\n"
        f"Lucro líquido: {bi(f['lucro'])} (var {f['lucro_cresc']}% a/a)\n"
        f"Margem líquida: {f['margem_liquida']}%\n"
        f"Patrimônio líquido: {bi(f['patrimonio_liquido'])} | ROE: {f['roe']}%\n"
        f"Ativo total: {bi(f['ativo_total'])}"
    )
    sistema = ("Você é analista fundamentalista do Caryo Map. Em 2-3 frases objetivas e em português, "
               "leia a saúde financeira da empresa a partir dos números oficiais da CVM. Aponte a "
               "tendência (receita/lucro crescendo ou não), a qualidade da margem e do ROE, e um alerta "
               "se houver. Não recomende compra/venda. Responda só o texto, sem markdown.")
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": sistema}]},
        "contents": [{"parts": [{"text": resumo}]}],
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 400},
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={key}"
    for _ in range(4):
        try:
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                d = json.loads(r.read())
            return d["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            import time; time.sleep(2)
    return None


def gerar_fundamentos(ticker: str, empresa: str, registro: list, dfp: dict, ano: int) -> dict | None:
    cd = mapear_ticker_cvm(ticker, empresa, registro)
    if not cd:
        print(f"  [{ticker}] CD_CVM não encontrado.")
        return None
    f = extrair(cd, dfp)
    if f["lucro"] is None and f["receita"] is None:
        print(f"  [{ticker}] sem dados na DFP (banco/seguradora usa plano diferente).")
        return None
    out = {
        "ticker": ticker, "empresa": empresa, "cd_cvm": cd,
        "exercicio": ano, "fonte": "CVM · Demonstrações Financeiras Padronizadas (DFP)",
        "gerado_em": datetime.now().strftime("%d/%m/%Y"),
        **f,
        "leitura": leitura_ia(ticker, empresa, f),
    }
    dest = DEST_DIR / f"fundamentos_{ticker}.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    lu = f"{f['lucro']/1e9:.1f}bi" if f["lucro"] else "n/d"
    print(f"  [OK] {ticker} -> lucro {lu} | margem {f['margem_liquida']}% | ROE {f['roe']}%")
    return out


def nomes_brapi(tickers: list) -> dict:
    try:
        d = json.loads(urllib.request.urlopen(
            f"https://brapi.dev/api/quote/list?token={BRAPI_TOKEN}&limit=2000", timeout=30).read())
        return {s["stock"]: s.get("name", "") for s in d.get("stocks", [])}
    except Exception:
        return {}


if __name__ == "__main__":
    tickers = [t.upper() for t in sys.argv[1:]] or ["WEGE3", "VALE3", "PETR4"]
    ano = int(os.environ.get("CVM_ANO", "2025"))
    print(f"CVM DFP {ano} · {len(tickers)} ações")
    registro = carregar_registro()
    dfp = carregar_dfp(ano)
    nomes = nomes_brapi(tickers)
    for tk in tickers:
        gerar_fundamentos(tk, nomes.get(tk, tk), registro, dfp, ano)
