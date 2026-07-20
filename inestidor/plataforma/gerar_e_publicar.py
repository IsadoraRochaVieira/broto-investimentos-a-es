"""
Roda duas vezes por dia via Task Scheduler:
  - 08:30 → turno "manha"  → salva YYYY-MM-DD_manha.json + noticias_YYYY-MM-DD.json
  - 13:00 → turno "tarde"  → salva YYYY-MM-DD_tarde.json + atualiza notícias

Uso:
  python gerar_e_publicar.py           # detecta turno pelo horário
  python gerar_e_publicar.py manha     # força turno manhã
  python gerar_e_publicar.py tarde     # força turno tarde
"""

import subprocess
import json
import os
import sys
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent
ANALISADOR = ROOT.parent / "analisador_b3_4.py"
RELATORIOS_DIR = ROOT / "relatorios"
RELATORIOS_DIR.mkdir(exist_ok=True)

agora = datetime.now()
hoje = agora.strftime("%Y-%m-%d")
hora_atual = agora.strftime("%H:%M")
hora_int = agora.hour

# Detecta turno pelo horário se não passado como argumento
if len(sys.argv) > 1 and sys.argv[1] in ("manha", "tarde"):
    TURNO = sys.argv[1]
else:
    TURNO = "manha" if hora_int < 12 else "tarde"

LABEL_TURNO = "Manhã (08:30)" if TURNO == "manha" else "Tarde (13:00)"

sys.path.insert(0, str(ROOT))
from macro_ao_vivo import coletar_macro
from backtesting import rodar_backtest_completo
from noticias_ao_vivo import coletar_noticias


# ─────────────────────────────────────────────
def rodar_analisador() -> str:
    print(f"[{hora_atual}] Rodando analisador técnico...")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(
        [sys.executable, "-X", "utf8", str(ANALISADOR)],
        capture_output=True, text=True, env=env, encoding="utf-8"
    )
    return result.stdout + result.stderr


def parse_output(output: str) -> list:
    candidatos = []
    blocos = re.split(r'\n(?=🟢|🟡|⚪|🔴)', output)

    for bloco in blocos:
        linhas = bloco.strip().splitlines()
        if not linhas:
            continue
        primeira = linhas[0]

        if '🟢' in primeira:   acao = 'COMPRAR'
        elif '🟡' in primeira: acao = 'OBSERVAR'
        elif '🔴' in primeira: acao = 'EVITAR'
        else:                  acao = 'NEUTRO'

        m_ticker = re.search(r'\b([A-Z]{4}\d{1,2})\b', primeira)
        m_score  = re.search(r'Score:\s*(\d+)', primeira)
        if not m_ticker:
            continue

        ticker = m_ticker.group(1)
        score  = int(m_score.group(1)) if m_score else 0

        preco = rsi = pl = atr = None
        pontos = []

        for l in linhas[1:]:
            if re.match(r'\s*•', l):
                pontos.append(l.strip().lstrip('•').strip())
                continue
            m = re.search(r'Preço:\s*R\$\s*([\d,.]+)', l)
            if m: preco = m.group(1).replace(',', '.')
            m = re.search(r'RSI:\s*([\d.]+)', l)
            if m: rsi = float(m.group(1))
            m = re.search(r'P/L:\s*([\d.]+)', l)
            if m: pl = float(m.group(1))
            m = re.search(r'ATR:\s*([\d.]+)%', l)
            if m: atr = float(m.group(1))

        entrada = float(preco) if preco else None
        stop    = round(entrada * (1 - (atr or 2.5) * 2 / 100), 2) if entrada and atr else None
        alvo    = round(entrada * 1.15, 2) if entrada else None

        candidatos.append({
            "ticker":  ticker,
            "nome":    ticker,
            "score":   score,
            "acao":    acao,
            "preco":   preco,
            "rsi":     rsi,
            "pl":      pl,
            "atr":     atr,
            "pontos":  pontos,
            "tese":    None,
            "risco":   None,
            "entrada": str(entrada) if entrada else None,
            "stop":    str(stop)    if stop    else None,
            "alvo":    str(alvo)    if alvo    else None,
        })

    return candidatos


def montar_plano(candidatos: list) -> list:
    """Plano com valor padrão — homepage sobrescreve com capital do usuário."""
    capital = 8500
    aprovados = [c for c in candidatos if c["score"] >= 40 and c["acao"] != "EVITAR"]
    if not aprovados:
        return []
    por_ativo = round(capital / max(len(aprovados), 1), 2)
    return [
        {
            "ativo":   c["ticker"],
            "acao":    "COMPRAR",
            "valor":   f"R$ {por_ativo:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "entrada": f"R$ {c['entrada']}" if c.get("entrada") else "-",
            "stop":    f"R$ {c['stop']}"    if c.get("stop")    else "-",
            "alvo":    f"R$ {c['alvo']}"    if c.get("alvo")    else "-",
        }
        for c in aprovados
    ]


def calcular_semaforo(macro: dict) -> str:
    vix      = macro.get("vix", 20)
    ibov_var = macro.get("ibovespa_var", 0) or 0
    try:
        vix = float(vix)
    except (TypeError, ValueError):
        vix = 20
    if vix >= 30 or abs(ibov_var) >= 3:
        return "vermelho"
    if vix >= 22 or abs(ibov_var) >= 1.5:
        return "amarelo"
    return "verde"


def salvar_json(dados: dict, nome_arquivo: str):
    destino = RELATORIOS_DIR / nome_arquivo
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Salvo → {destino.name}")


def gerar_debates_comite(tickers: list, empresas: dict | None = None):
    """Gera o debate do Comitê de IA para as ações indicadas.
    Roda só se GEMINI_API_KEY existir; nunca derruba o pipeline diário."""
    if not os.environ.get("GEMINI_API_KEY"):
        print("[COMITÊ] GEMINI_API_KEY não definida — pulando debates da Mesa.")
        return
    try:
        import csv, glob
        sys.path.insert(0, str(ROOT.parent))
        import comite_ia
    except Exception as e:
        print(f"[COMITÊ] Não foi possível carregar comite_ia: {e}")
        return

    csvs = sorted(glob.glob(str(ROOT.parent / "b3_analise_*.csv")))
    if not csvs:
        print("[COMITÊ] Nenhum CSV do analisador encontrado.")
        return
    with open(csvs[-1], encoding="utf-8") as f:
        rows = {r["ticker"]: r for r in csv.DictReader(f, delimiter=";")}

    empresas = empresas or getattr(comite_ia, "EMPRESAS", {})
    for tk in tickers:
        row = rows.get(tk)
        if not row:
            continue
        try:
            print(f"[COMITÊ] Debatendo {tk}...")
            emp, setor = empresas.get(tk, ("", ""))
            out = comite_ia.gerar_comite(tk, row, emp, setor)
            salvar_json(out, f"comite_{tk}.json")
        except SystemExit as e:
            print(f"[COMITÊ] {tk} abortado: {e}")
        except Exception as e:
            print(f"[COMITÊ] Falha em {tk}: {str(e)[:120]}")


def git_push(mensagem: str):
    print("[GIT] Fazendo commit e push...")
    cmds = [
        ["git", "-C", str(ROOT), "add", "-A"],
        ["git", "-C", str(ROOT), "commit", "-m", mensagem],
        ["git", "-C", str(ROOT), "push"],
    ]
    for cmd in cmds:
        r = subprocess.run(cmd, capture_output=True, text=True)
        saida = r.stdout + r.stderr
        if "nothing to commit" in saida:
            print("  [INFO] Nada a commitar.")
        elif r.returncode != 0:
            print(f"  [ERRO] {saida.strip()}")
        else:
            print(f"  [OK] {' '.join(cmd[2:])}")


# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print(f"  B3 RADAR — {agora.strftime('%d/%m/%Y %H:%M')} — {LABEL_TURNO}")
    print("=" * 60)

    # 1. Analisador técnico
    output    = rodar_analisador()
    candidatos = parse_output(output)
    todos     = sorted(candidatos, key=lambda x: x["score"], reverse=True)
    aprovados = [c for c in todos if c["score"] >= 40 and c["acao"] != "EVITAR"]
    tops      = todos[:5]
    print(f"[OK] {len(todos)} ativos · {len(aprovados)} candidatos.")

    # 2. Macro ao vivo
    print("[INFO] Coletando macro...")
    macro = coletar_macro()

    # 3. Notícias ao vivo
    print("[INFO] Coletando notícias...")
    noticias = coletar_noticias()
    salvar_json(noticias, f"noticias_{hoje}.json")

    # 4. Backtesting
    metricas_bt = rodar_backtest_completo(aprovados, hoje)

    # 5. Plano + semáforo + pick
    plano    = montar_plano(aprovados)
    semaforo = calcular_semaforo(macro)
    ibov_var = macro.get("ibovespa_var", 0) or 0

    compras     = [c for c in aprovados if c.get("acao") == "COMPRAR"]
    pick_semana = sorted(compras, key=lambda x: x["score"], reverse=True)[0] if compras else None

    tickers_top = [c["ticker"] for c in aprovados[:3]]
    resumo = (
        f"[{LABEL_TURNO}] Ibovespa {macro.get('ibovespa', '-')} ({ibov_var:+.2f}%). "
        f"Destaques: {', '.join(tickers_top) if tickers_top else 'nenhum acima do limiar'}. "
        f"Semáforo: {semaforo.upper()}."
    )

    # 6. Monta sugestões do dia (top 10 com porque automático)
    PORQUE = {
        "COMPRAR": [
            lambda c: f"RSI em {c['rsi']} — zona de sobrevenda técnica. Score {c['score']}/100 indica pressão compradora se acumulando. Stop em R$ {c.get('stop','?')} limita risco.",
            lambda c: f"Análise técnica aponta reversão com RSI {c['rsi']} e score de {c['score']} pontos. Entrada em R$ {c.get('entrada','?')} com alvo R$ {c.get('alvo','?')}.",
        ],
        "OBSERVAR": [
            lambda c: f"RSI em {c['rsi']} — zona neutra. Score {c['score']}/100. Aguardar confirmação de volume antes de entrar. Pré-entrada em R$ {c.get('entrada','?')}.",
        ],
        "EVITAR": [
            lambda c: f"Score {c['score']}/100 abaixo do limiar mínimo. RSI em {c['rsi']} — sem sinal técnico claro de reversão. Manter caixa é melhor opção agora.",
        ],
        "NEUTRO": [
            lambda c: f"Score {c['score']}/100 em zona neutra. RSI {c['rsi']}. Sem gatilho técnico definido — aguardar próximo relatório para reavaliação.",
        ],
    }

    import random
    sugestoes = []
    for i, c in enumerate(todos[:10]):
        acao = c.get("acao", "NEUTRO")
        opcoes = PORQUE.get(acao, PORQUE["NEUTRO"])
        porque = random.choice(opcoes)(c)
        sugestoes.append({
            "rank": i + 1,
            "ticker": c["ticker"],
            "acao": acao,
            "preco": c.get("preco"),
            "entrada": c.get("entrada"),
            "stop": c.get("stop"),
            "alvo": c.get("alvo"),
            "rsi": c.get("rsi"),
            "score": c["score"],
            "porque": porque,
        })

    dia_semana_map = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"]
    dia_semana = dia_semana_map[agora.weekday()]

    dados_sugestoes = {
        "data": agora.strftime("%d/%m/%Y"),
        "data_iso": hoje,
        "dia_semana": dia_semana,
        "turno": TURNO,
        "macro_resumo": resumo,
        "semaforo": semaforo,
        "sugestoes": sugestoes,
    }
    salvar_json(dados_sugestoes, f"sugestoes_{hoje}.json")

    # 6b. Comitê de IA debate as 3 principais sugestões do dia
    top_tickers = [s["ticker"] for s in sugestoes[:3]]
    gerar_debates_comite(top_tickers)

    # 6b2. Fundamentos oficiais da CVM para as ações debatidas
    try:
        sys.path.insert(0, str(ROOT.parent))
        import fundamentos_cvm as fcvm
        reg = fcvm.carregar_registro()
        dfp = fcvm.carregar_dfp(int(os.environ.get("CVM_ANO", "2025")))
        nomes = fcvm.nomes_brapi(top_tickers)
        for tk in top_tickers:
            fcvm.gerar_fundamentos(tk, nomes.get(tk, tk), reg, dfp, int(os.environ.get("CVM_ANO", "2025")))
    except Exception as e:
        print(f"[CVM] Falha ao gerar fundamentos: {str(e)[:120]}")

    # 6c. Market Map — matriz visual de toda a bolsa
    try:
        import glob as _glob
        sys.path.insert(0, str(ROOT.parent))
        from gerar_mapa import gerar_mapa
        _csvs = sorted(_glob.glob(str(ROOT.parent / "b3_analise_*.csv")))
        if _csvs:
            gerar_mapa(_csvs[-1], RELATORIOS_DIR, hoje)
    except Exception as e:
        print(f"[MAPA] Falha ao gerar Market Map: {str(e)[:120]}")

    # 7. Monta e salva relatório
    relatorio = {
        "data":              agora.strftime("%d/%m/%Y"),
        "data_iso":          hoje,
        "turno":             TURNO,
        "turno_label":       LABEL_TURNO,
        "hora_geracao":      hora_atual,
        "resumo":            resumo,
        "resumo_curto":      ", ".join(tickers_top) if tickers_top else "Sem candidatos",
        "resumo_executivo":  "",
        "semaforo":          semaforo,
        "pick_semana":       pick_semana,
        "macro":             macro,
        "tops":              [{"ticker": c["ticker"], "score": c["score"]} for c in tops],
        "candidatos":        todos,          # todos os 15+ ativos
        "candidatos_top":    aprovados,      # só os aprovados (score >= 40)
        "plano":             plano,
        "backtesting":       metricas_bt,
        "output_raw":        output[:3000],
    }

    nome_arquivo = f"{hoje}_{TURNO}.json"
    salvar_json(relatorio, nome_arquivo)

    # 7. Push
    git_push(f"relatorio: {hoje} {TURNO} | {semaforo} | {', '.join(tickers_top)}")

    print(f"\n✅ Relatório {hoje} [{TURNO}] publicado!")
    print(f"   Semáforo: {semaforo.upper()} | Picks: {', '.join(tickers_top)}")
    print(f"   Taxa de acerto: {metricas_bt.get('taxa_acerto', 0)}%")
