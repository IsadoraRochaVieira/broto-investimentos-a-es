"""
ANALISADOR DE OPORTUNIDADES B3
================================
Cruza dados fundamentalistas + técnicos + momentum para
identificar ações com potencial assimétrico de retorno.

Instalação:
    pip install yfinance pandas numpy ta requests

Uso:
    python analisador_b3.py
"""

import yfinance as yf
import pandas as pd
import numpy as np
from ta.trend import EMAIndicator, MACD
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volatility import BollingerBands, AverageTrueRange
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────
# CONFIGURAÇÃO — edite aqui
# ─────────────────────────────────────────

# Lista de emergência caso a busca do universo completo falhe
ACOES_FALLBACK = [
    "PETR4.SA", "PETR3.SA", "PRIO3.SA", "RECV3.SA",
    "ITUB4.SA", "BBDC4.SA", "BBAS3.SA", "SANB11.SA",
    "VALE3.SA", "AGRO3.SA", "SLCE3.SA", "SMTO3.SA",
    "MELI34.SA", "TOTVS3.SA", "LWSA3.SA",
    "MGLU3.SA", "COGN3.SA", "CSAN3.SA",
    "ABEV3.SA", "B3SA3.SA", "RENT3.SA", "EQTL3.SA", "RADL3.SA",
    "SUZB3.SA", "ELET3.SA", "JBSS3.SA", "BPAC11.SA", "ENAT3.SA",
    "HYPE3.SA", "VIVT3.SA", "EGIE3.SA", "CPLE6.SA", "SBSP3.SA",
    "KLBN11.SA", "TRPL4.SA", "CMIG4.SA", "GGBR4.SA", "FLRY3.SA",
    "CSNA3.SA", "MULT3.SA", "BRFS3.SA", "CCRO3.SA", "CYRE3.SA",
    "BRAV3.SA", "AZUL4.SA", "LREN3.SA", "TOTS3.SA", "PSSA3.SA",
    "YDUQ3.SA", "QUAL3.SA", "CRFB3.SA", "TIMS3.SA", "NTCO3.SA",
    "VAMO3.SA", "TEND3.SA", "JALL3.SA", "MATD3.SA", "PORT3.SA",
    "TUPY3.SA", "ROMI3.SA", "UNIP6.SA", "RAPT4.SA", "FESA4.SA",
    "KRSA3.SA", "FRAS3.SA", "VLID3.SA", "KEPL3.SA", "AMBP3.SA",
    "VULC3.SA", "PGMN3.SA",
]

BRAPI_TOKEN     = "wWjyqivfUbeVVe9jLzP6pB"
VOLUME_PISO     = 200_000     # piso absoluto — abaixo disso é iliquidez perigosa
VOLUME_LIQUIDA  = 1_000_000   # acima disso: liquidez alta (blue chip / large cap)

# Preenchido por obter_universo_b3(): {ticker_sem_.SA: volume_diario}
LIQUIDEZ: dict[str, int] = {}


def obter_universo_b3() -> list[str]:
    """Baixa a lista completa de ações da B3 (brapi) e devolve dois grupos:
    líquidas (>= 1M/dia) + gemas de baixa liquidez (200k–1M).
    As gemas são o coração da tese Caryo Map — small caps fora do radar
    institucional —, então NÃO são descartadas: entram marcadas com aviso
    de risco de liquidez em vez de serem cortadas."""
    import requests
    try:
        r = requests.get(
            "https://brapi.dev/api/quote/list",
            params={"token": BRAPI_TOKEN, "limit": 2000},
            timeout=30,
        )
        stocks = r.json().get("stocks", [])
        universo = []
        for s in stocks:
            if s.get("type") != "stock":
                continue
            vol = s.get("volume") or 0
            if vol < VOLUME_PISO:
                continue
            tk = s["stock"]
            LIQUIDEZ[tk] = vol
            universo.append(tk + ".SA")
        if len(universo) >= 30:
            liq = sum(1 for v in LIQUIDEZ.values() if v >= VOLUME_LIQUIDA)
            gemas = len(LIQUIDEZ) - liq
            print(f"Universo B3: {len(universo)} acoes ({liq} liquidas + {gemas} gemas de baixa liquidez)")
            return universo
    except Exception as e:
        print(f"Falha ao buscar universo completo ({e}); usando lista fallback.")
    return ACOES_FALLBACK


ACOES = obter_universo_b3()

CAPITAL_TOTAL          = 10_000
ALOCACAO_MAX_POR_ATIVO = 0.25
PERIODO_HISTORICO      = "6mo"
INTERVALO              = "1d"


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def to_series(col) -> pd.Series:
    """Garante que o retorno do yfinance seja sempre uma Series 1D."""
    if isinstance(col, pd.DataFrame):
        return col.iloc[:, 0]
    return col


# ─────────────────────────────────────────
# MOTOR DE ANÁLISE
# ─────────────────────────────────────────

def calcular_indicadores(ticker: str) -> dict | None:
    try:
        df = yf.download(ticker, period=PERIODO_HISTORICO,
                         interval=INTERVALO, progress=False, auto_adjust=True)
        if df is None or len(df) < 30:
            return None

        close = to_series(df["Close"])
        high  = to_series(df["High"])
        low   = to_series(df["Low"])
        vol   = to_series(df["Volume"])

        # ── Médias móveis ────────────────
        ema9  = EMAIndicator(close, window=9).ema_indicator()
        ema21 = EMAIndicator(close, window=21).ema_indicator()
        ema50 = EMAIndicator(close, window=50).ema_indicator()

        # ── RSI ──────────────────────────
        rsi = RSIIndicator(close, window=14).rsi()

        # ── MACD ─────────────────────────
        macd_obj  = MACD(close)
        macd_hist = macd_obj.macd_diff()

        # ── Bandas de Bollinger ──────────
        bb      = BollingerBands(close, window=20, window_dev=2)
        bb_pct  = bb.bollinger_pband()

        # ── ATR ──────────────────────────
        atr = AverageTrueRange(high, low, close, window=14).average_true_range()

        # ── Estocástico ──────────────────
        stoch_k = StochasticOscillator(high, low, close, window=14).stoch()

        # ── Volume ───────────────────────
        vol_media = vol.rolling(20).mean()
        vol_ratio = float(vol.iloc[-1] / vol_media.iloc[-1]) if float(vol_media.iloc[-1]) > 0 else 1.0

        # ── Preço e variações ────────────
        preco_atual = float(close.iloc[-1])
        var_1d  = float((close.iloc[-1] / close.iloc[-2]  - 1) * 100) if len(close) >= 2  else 0
        var_5d  = float((close.iloc[-1] / close.iloc[-6]  - 1) * 100) if len(close) >= 6  else 0
        var_20d = float((close.iloc[-1] / close.iloc[-21] - 1) * 100) if len(close) >= 21 else 0

        # ── 52 semanas ───────────────────
        df_52  = yf.download(ticker, period="1y", interval="1d", progress=False, auto_adjust=True)
        if df_52 is not None and len(df_52) > 0:
            max52      = float(to_series(df_52["High"]).max())
            min52      = float(to_series(df_52["Low"]).min())
            dist_min52 = float((preco_atual / min52 - 1) * 100)
            dist_max52 = float((max52 / preco_atual - 1) * 100)
        else:
            max52 = min52 = preco_atual
            dist_min52 = dist_max52 = 0.0

        # ── Fundamentalistas ─────────────
        info   = yf.Ticker(ticker).info
        pl     = info.get("trailingPE", None)
        pvp    = info.get("priceToBook", None)
        dy     = info.get("dividendYield", None)
        roe    = info.get("returnOnEquity", None)
        dy_pct = round(float(dy) * 100, 2) if dy else None

        # ─────────────────────────────────
        # SISTEMA DE PONTUAÇÃO (0–100)
        # ─────────────────────────────────
        score  = 0
        sinais = []

        rsi_v    = float(rsi.iloc[-1])
        stoch_v  = float(stoch_k.iloc[-1])
        bb_pct_v = float(bb_pct.iloc[-1])
        macd_h_v = float(macd_hist.iloc[-1])
        macd_h_p = float(macd_hist.iloc[-2]) if len(macd_hist) > 1 else 0
        ema9_v   = float(ema9.iloc[-1])
        ema21_v  = float(ema21.iloc[-1])
        ema50_v  = float(ema50.iloc[-1])
        atr_pct  = float(atr.iloc[-1] / preco_atual * 100)

        if rsi_v < 35:
            score += 20
            sinais.append(f"RSI sobrevendido ({rsi_v:.0f}) — possível reversão")
        elif rsi_v < 50:
            score += 10
            sinais.append(f"RSI neutro-baixo ({rsi_v:.0f})")

        if bb_pct_v < 0.2:
            score += 15
            sinais.append("Preço tocando banda inferior de Bollinger")
        elif bb_pct_v > 0.8:
            score -= 10
            sinais.append("Preço esticado (banda superior Bollinger)")

        if macd_h_v > 0 and macd_h_p < 0:
            score += 20
            sinais.append("MACD cruzou para positivo (sinal de compra)")
        elif macd_h_v > macd_h_p and macd_h_v > 0:
            score += 10
            sinais.append("MACD positivo e acelerando")

        if ema9_v > ema21_v > ema50_v:
            score += 15
            sinais.append("Tendência de alta (EMA 9 > 21 > 50)")
        elif ema9_v < ema21_v < ema50_v:
            score -= 15
            sinais.append("Tendência de baixa")

        if vol_ratio > 1.5:
            score += 10
            sinais.append(f"Volume {vol_ratio:.1f}x acima da média")

        if dist_min52 < 15:
            score += 10
            sinais.append(f"{dist_min52:.1f}% acima da mínima de 52 sem — assimetria alta")

        if stoch_v < 20:
            score += 10
            sinais.append(f"Estocástico sobrevendido ({stoch_v:.0f})")

        if pl and 5 < float(pl) < 15:
            score += 10
            sinais.append(f"P/L atrativo ({float(pl):.1f}x)")
        elif pl and float(pl) > 40:
            score -= 5

        # Dividend yield: dados do Yahoo às vezes vêm corrompidos (ex: 2018%).
        # Acima de 30% é quase sempre erro de fonte — ignoramos para não poluir.
        dy_confiavel = dy_pct and 0 < dy_pct <= 30
        if dy_confiavel and dy_pct > 5:
            score += 5
            sinais.append(f"Dividend yield de {dy_pct:.1f}%")

        if roe and float(roe) > 0.15:
            score += 5
            sinais.append(f"ROE sólido ({float(roe)*100:.1f}%)")

        if score >= 60:
            clf = "FORTE OPORTUNIDADE"
        elif score >= 40:
            clf = "OBSERVAR"
        elif score >= 20:
            clf = "NEUTRO"
        else:
            clf = "EVITAR"

        return {
            "ticker":      ticker.replace(".SA", ""),
            "preco":       round(preco_atual, 2),
            "var_1d":      round(var_1d, 2),
            "var_5d":      round(var_5d, 2),
            "var_20d":     round(var_20d, 2),
            "rsi":         round(rsi_v, 1),
            "macd_hist":   round(macd_h_v, 3),
            "bb_pct":      round(bb_pct_v * 100, 1),
            "vol_ratio":   round(vol_ratio, 2),
            "atr_pct":     round(atr_pct, 2),
            "dist_min52":  round(dist_min52, 1),
            "dist_max52":  round(dist_max52, 1),
            "pl":          round(float(pl), 1) if pl else "-",
            "pvp":         round(float(pvp), 2) if pvp else "-",
            "dy":          f"{dy_pct:.1f}%" if dy_confiavel else "-",
            "roe":         f"{float(roe)*100:.1f}%" if roe else "-",
            "score":       score,
            "classificacao": clf,
            "sinais":      sinais,
            "liquidez":    "alta" if LIQUIDEZ.get(ticker.replace(".SA", ""), 0) >= VOLUME_LIQUIDA else "baixa",
            "gema":        0 < LIQUIDEZ.get(ticker.replace(".SA", ""), 0) < VOLUME_LIQUIDA,
            "volume_dia":  LIQUIDEZ.get(ticker.replace(".SA", ""), 0),
        }

    except Exception as e:
        print(f"  Erro em {ticker}: {e}")
        return None


def sugerir_alocacao(r: dict, capital: float, max_pct: float) -> float:
    score = r["score"]
    if score >= 60:   base = 0.20
    elif score >= 40: base = 0.12
    elif score >= 20: base = 0.06
    else:             return 0.0
    return round(min(base, max_pct) * capital, 2)


# ─────────────────────────────────────────
# EXECUÇÃO
# ─────────────────────────────────────────

def main():
    linha = "═" * 60
    print(f"\n{linha}")
    print("  ANALISADOR DE OPORTUNIDADES B3")
    print(f"  {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"{linha}")
    print(f"Analisando {len(ACOES)} ativos...\n")

    resultados = []
    for ticker in ACOES:
        print(f"  [{ACOES.index(ticker)+1}/{len(ACOES)}] {ticker}...        ", end="\r")
        r = calcular_indicadores(ticker)
        if r:
            resultados.append(r)

    if not resultados:
        print("Nenhum dado retornado. Verifique sua conexão com a internet.")
        return

    resultados.sort(key=lambda x: x["score"], reverse=True)

    emojis = {"FORTE OPORTUNIDADE": "🟢", "OBSERVAR": "🟡", "NEUTRO": "⚪", "EVITAR": "🔴"}

    print(f"\n{linha}")
    print("  RANKING DE OPORTUNIDADES")
    print(f"{linha}")

    for r in resultados:
        emoji = emojis.get(r["classificacao"], "")
        print(f"\n{emoji} {r['classificacao']:<22} {r['ticker']:<10}  Score: {r['score']}/100")
        print(f"   Preço: R$ {r['preco']:<8}  1d: {r['var_1d']:+.1f}%  5d: {r['var_5d']:+.1f}%  20d: {r['var_20d']:+.1f}%")
        print(f"   RSI: {r['rsi']:<6}  Bollinger: {r['bb_pct']}%  Volume: {r['vol_ratio']}x  ATR: {r['atr_pct']:.1f}%/dia")
        print(f"   P/L: {r['pl']:<6}  P/VP: {r['pvp']:<6}  DY: {r['dy']:<6}  ROE: {r['roe']}")
        print(f"   Dist. mín 52sem: {r['dist_min52']}%  |  Potencial até máx: {r['dist_max52']}%")
        for s in r["sinais"]:
            print(f"   • {s}")

    print(f"\n{linha}")
    print("  SUGESTÃO DE ALOCAÇÃO")
    print(f"{linha}")

    total = 0
    for r in resultados:
        valor = sugerir_alocacao(r, CAPITAL_TOTAL, ALOCACAO_MAX_POR_ATIVO)
        if valor > 0 and total + valor <= CAPITAL_TOTAL * 0.85:
            pct = valor / CAPITAL_TOTAL * 100
            emoji = emojis.get(r["classificacao"], "")
            print(f"  {emoji} {r['ticker']:<10}  R$ {valor:>7,.2f}  ({pct:.0f}%)  Score {r['score']}")
            total += valor

    caixa = CAPITAL_TOTAL - total
    print(f"\n  ⚪ CAIXA       R$ {caixa:>7,.2f}  ({caixa/CAPITAL_TOTAL*100:.0f}%)")
    print(f"  TOTAL ALOCADO  R$ {total:>7,.2f}  ({total/CAPITAL_TOTAL*100:.0f}%)")

    nome = f"b3_analise_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    pd.DataFrame(resultados).drop(columns=["sinais"]).to_csv(
        nome, index=False, sep=";", decimal=","
    )
    print(f"\n  Exportado → {nome}")
    print(f"\n{linha}\n")


if __name__ == "__main__":
    main()
