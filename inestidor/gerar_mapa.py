"""
GERADOR DO MARKET MAP — Caryo Map
==================================
Cruza o CSV do analisador (138 ações) com o setor de cada papel (brapi) e
exporta plataforma/relatorios/mapa_<data>.json — a base da Camada de
Escaneamento Visual (matriz interativa de toda a bolsa).
"""
import csv
import json
import glob
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

BRAPI_TOKEN = "wWjyqivfUbeVVe9jLzP6pB"

# Setores da brapi (inglês) → português
SETOR_PT = {
    "Finance": "Financeiro",
    "Energy Minerals": "Petróleo e Gás",
    "Non-Energy Minerals": "Mineração",
    "Retail Trade": "Varejo",
    "Consumer Durables": "Bens de Consumo",
    "Consumer Non-Durables": "Consumo Básico",
    "Consumer Services": "Serviços ao Consumidor",
    "Health Services": "Saúde",
    "Health Technology": "Saúde",
    "Process Industries": "Indústria de Processo",
    "Producer Manufacturing": "Bens de Capital",
    "Electronic Technology": "Tecnologia",
    "Technology Services": "Tecnologia",
    "Utilities": "Energia Elétrica e Saneamento",
    "Transportation": "Transporte e Logística",
    "Industrial Services": "Serviços Industriais",
    "Commercial Services": "Serviços Comerciais",
    "Communications": "Telecom",
    "Distribution Services": "Distribuição",
    "Miscellaneous": "Diversos",
}


def _num(v: str):
    if v is None or v in ("-", ""):
        return None
    try:
        return float(str(v).replace(".", "").replace(",", ".")) if "," in str(v) else float(v)
    except ValueError:
        return None


def obter_setores() -> dict:
    """ticker -> (setor_pt, volume) via brapi list."""
    try:
        url = f"https://brapi.dev/api/quote/list?token={BRAPI_TOKEN}&limit=2000"
        with urllib.request.urlopen(url, timeout=30) as r:
            data = json.loads(r.read())
        out = {}
        for s in data.get("stocks", []):
            setor = SETOR_PT.get(s.get("sector") or "", s.get("sector") or "Outros")
            out[s["stock"]] = {"setor": setor, "volume": s.get("volume") or 0}
        return out
    except Exception as e:
        print(f"[MAPA] Falha ao buscar setores ({e}); seguindo sem setor.")
        return {}


def gerar_mapa(csv_path: str, dest_dir: Path, data_iso: str) -> Path:
    with open(csv_path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f, delimiter=";"))
    setores = obter_setores()

    acoes = []
    for r in rows:
        tk = r["ticker"]
        info = setores.get(tk, {})
        acoes.append({
            "ticker": tk,
            "preco": _num(r.get("preco")),
            "var_1d": _num(r.get("var_1d")),
            "var_20d": _num(r.get("var_20d")),
            "rsi": _num(r.get("rsi")),
            "score": int(_num(r.get("score")) or 0),
            "classificacao": r.get("classificacao", "NEUTRO"),
            "setor": info.get("setor", "Outros"),
            "volume": info.get("volume", 0),
        })

    # ordena por score desc
    acoes.sort(key=lambda a: -a["score"])
    mapa = {
        "data_iso": data_iso,
        "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "total": len(acoes),
        "acoes": acoes,
    }
    dest = dest_dir / f"mapa_{data_iso}.json"
    dest.write_text(json.dumps(mapa, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[MAPA] OK -> {dest.name} ({len(acoes)} acoes)")
    return dest


if __name__ == "__main__":
    root = Path(__file__).parent
    csvs = sorted(glob.glob(str(root / "b3_analise_*.csv")))
    if not csvs:
        raise SystemExit("Nenhum CSV do analisador encontrado.")
    dest_dir = root / "plataforma" / "relatorios"
    dest_dir.mkdir(parents=True, exist_ok=True)
    data_iso = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
    gerar_mapa(csvs[-1], dest_dir, data_iso)
