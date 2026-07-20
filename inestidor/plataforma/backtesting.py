"""
Backtesting automático das sugestões do B3 Radar.

Fluxo:
1. Ao gerar um relatório, salva os candidatos com preço de entrada, stop e alvo.
2. Nos dias seguintes, verifica se stop ou alvo foi atingido usando yfinance.
3. Atualiza o arquivo backtest_historico.json com o resultado de cada operação.
4. Calcula métricas: taxa de acerto, retorno médio, Sharpe simplificado.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

try:
    import yfinance as yf
    YFINANCE_OK = True
except ImportError:
    YFINANCE_OK = False

ROOT = Path(__file__).parent
BACKTEST_FILE = ROOT / "relatorios" / "backtest_historico.json"


def carregar_historico() -> list:
    if BACKTEST_FILE.exists():
        return json.loads(BACKTEST_FILE.read_text(encoding="utf-8"))
    return []


def _limpar_nan(obj):
    """NaN/Infinity são válidos em Python mas NÃO em JSON — o site quebra ao ler.
    Converte para None antes de gravar."""
    import math
    if isinstance(obj, dict):
        return {k: _limpar_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_limpar_nan(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def salvar_historico(historico: list):
    BACKTEST_FILE.write_text(
        json.dumps(_limpar_nan(historico), ensure_ascii=False, indent=2, allow_nan=False),
        encoding="utf-8"
    )


def registrar_sinais(candidatos: list, data_iso: str):
    """Salva novos sinais de compra no histórico para rastreamento futuro."""
    historico = carregar_historico()
    slugs_existentes = {f"{op['ticker']}_{op['data_entrada']}" for op in historico}

    novos = 0
    for c in candidatos:
        if c.get("acao") not in ("COMPRAR", "OBSERVAR"):
            continue
        chave = f"{c['ticker']}_{data_iso}"
        if chave in slugs_existentes:
            continue
        try:
            entrada = float(str(c.get("entrada") or c.get("preco") or "0").replace(",", "."))
            stop = float(str(c.get("stop") or "0").replace(",", "."))
            alvo = float(str(c.get("alvo") or "0").replace(",", "."))
        except (ValueError, TypeError):
            continue
        if entrada <= 0:
            continue

        historico.append({
            "ticker": c["ticker"],
            "data_entrada": data_iso,
            "preco_entrada": entrada,
            "stop": stop if stop > 0 else round(entrada * 0.92, 2),
            "alvo": alvo if alvo > 0 else round(entrada * 1.15, 2),
            "score": c.get("score", 0),
            "status": "aberto",
            "preco_saida": None,
            "data_saida": None,
            "resultado_pct": None,
            "motivo_saida": None,
        })
        novos += 1

    salvar_historico(historico)
    print(f"[BACKTEST] {novos} novo(s) sinal(is) registrado(s).")
    return historico


def atualizar_resultados():
    """Verifica operações abertas e fecha as que atingiram stop ou alvo."""
    if not YFINANCE_OK:
        print("[BACKTEST] yfinance não disponível — pulando atualização.")
        return []

    historico = carregar_historico()
    abertos = [op for op in historico if op["status"] == "aberto"]

    if not abertos:
        print("[BACKTEST] Nenhuma operação aberta para verificar.")
        return historico

    print(f"[BACKTEST] Verificando {len(abertos)} operação(ões) aberta(s)...")

    for op in abertos:
        try:
            ticker = op["ticker"] + ".SA"
            data_ini = op["data_entrada"]
            hoje_str = datetime.now().strftime("%Y-%m-%d")

            t = yf.Ticker(ticker)
            hist = t.history(
                start=data_ini,
                end=(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
                interval="1d"
            )

            if hist.empty:
                continue

            entrada = op["preco_entrada"]
            stop_val = op["stop"]
            alvo_val = op["alvo"]

            for data, row in hist.iterrows():
                data_str = str(data)[:10]
                if data_str <= data_ini:
                    continue

                low = row["Low"]
                high = row["High"]
                close = row["Close"]

                # Stop atingido
                if low <= stop_val:
                    op["status"] = "fechado"
                    op["preco_saida"] = stop_val
                    op["data_saida"] = data_str
                    op["resultado_pct"] = round((stop_val - entrada) / entrada * 100, 2)
                    op["motivo_saida"] = "stop"
                    break

                # Alvo atingido
                if high >= alvo_val:
                    op["status"] = "fechado"
                    op["preco_saida"] = alvo_val
                    op["data_saida"] = data_str
                    op["resultado_pct"] = round((alvo_val - entrada) / entrada * 100, 2)
                    op["motivo_saida"] = "alvo"
                    break

            # Operação ainda aberta — atualiza com preço atual
            if op["status"] == "aberto":
                preco_atual = hist["Close"].iloc[-1]
                op["preco_atual"] = round(preco_atual, 2)
                op["resultado_pct_atual"] = round((preco_atual - entrada) / entrada * 100, 2)

        except Exception as e:
            print(f"  [ERRO] {op['ticker']}: {e}")
            continue

    salvar_historico(historico)
    fechados = sum(1 for op in historico if op["status"] == "fechado")
    print(f"[BACKTEST] {fechados} operação(ões) fechada(s) no total.")
    return historico


def calcular_metricas(historico: list) -> dict:
    """Calcula métricas de desempenho do sistema."""
    fechados = [op for op in historico if op["status"] == "fechado" and op["resultado_pct"] is not None]
    abertos = [op for op in historico if op["status"] == "aberto"]

    if not fechados:
        return {
            "total_operacoes": len(historico),
            "fechadas": 0,
            "abertas": len(abertos),
            "ganhos": 0,
            "perdas": 0,
            "taxa_acerto": 0.0,
            "retorno_medio_pct": 0.0,
            "maior_ganho_pct": 0.0,
            "maior_perda_pct": 0.0,
            "retorno_total_pct": 0.0,
        }

    ganhos = [op for op in fechados if op["resultado_pct"] > 0]
    perdas = [op for op in fechados if op["resultado_pct"] <= 0]
    retornos = [op["resultado_pct"] for op in fechados]

    return {
        "total_operacoes": len(historico),
        "fechadas": len(fechados),
        "abertas": len(abertos),
        "ganhos": len(ganhos),
        "perdas": len(perdas),
        "taxa_acerto": round(len(ganhos) / len(fechados) * 100, 1) if fechados else 0,
        "retorno_medio_pct": round(sum(retornos) / len(retornos), 2),
        "maior_ganho_pct": round(max(retornos), 2),
        "maior_perda_pct": round(min(retornos), 2),
        "retorno_total_pct": round(sum(retornos), 2),
        "ultimas_operacoes": sorted(fechados, key=lambda x: x["data_saida"] or "", reverse=True)[:5],
    }


def rodar_backtest_completo(candidatos: list, data_iso: str) -> dict:
    """Ponto de entrada principal chamado pelo gerar_e_publicar.py."""
    registrar_sinais(candidatos, data_iso)
    historico = atualizar_resultados()
    metricas = calcular_metricas(historico)

    print(f"\n[BACKTEST] Taxa de acerto: {metricas['taxa_acerto']}%")
    print(f"[BACKTEST] Retorno médio : {metricas['retorno_medio_pct']:+.2f}%")
    print(f"[BACKTEST] Operações     : {metricas['fechadas']} fechadas / {metricas['abertas']} abertas")

    return metricas


if __name__ == "__main__":
    historico = atualizar_resultados()
    metricas = calcular_metricas(historico)
    import pprint
    pprint.pprint(metricas)
