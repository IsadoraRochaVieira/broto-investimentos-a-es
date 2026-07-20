"""
REMOVEDOR DE FUNDO XADREZ — Caryo Map
======================================
Geradores de imagem costumam PINTAR o quadriculado de "transparência" dentro do
JPEG em vez de gerar alfa de verdade. Este script remove esse fundo falso.

Estratégia: flood fill a partir das bordas, só através de pixels com cara de
xadrez (claros e dessaturados). Assim o fundo some, mas partes claras INTERNAS
(as sementes brancas do pequi) são preservadas, porque não tocam a borda.

Uso: python remover_fundo.py entrada.jpg saida.png
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def eh_xadrez(rgb: np.ndarray) -> np.ndarray:
    """Pixel claro e dessaturado = quadriculado (cinza ~235 ou branco ~255)."""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    claro = mn > 195           # bem claro
    dessat = (mx - mn) < 26    # quase sem cor
    return claro & dessat


def remover(entrada: Path, saida: Path, feather: float = 0.8) -> None:
    im = Image.open(entrada).convert("RGB")
    arr = np.array(im)
    h, w = arr.shape[:2]
    cand = eh_xadrez(arr)

    # BFS a partir de todos os pixels de borda que parecem xadrez
    fundo = np.zeros((h, w), dtype=bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not fundo[y, x]:
                fundo[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not fundo[y, x]:
                fundo[y, x] = True; dq.append((y, x))

    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not fundo[ny, nx]:
                fundo[ny, nx] = True
                dq.append((ny, nx))

    alpha = np.where(fundo, 0, 255).astype(np.uint8)
    a_img = Image.fromarray(alpha, mode="L")
    # suaviza a borda serrilhada e come 1px do halo claro do JPEG
    a_img = a_img.filter(ImageFilter.MinFilter(3))
    if feather:
        a_img = a_img.filter(ImageFilter.GaussianBlur(feather))

    out = im.convert("RGBA")
    out.putalpha(a_img)

    # recorta para o conteúdo
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    saida.parent.mkdir(parents=True, exist_ok=True)
    out.save(saida, "PNG", optimize=True)
    pct = 100 * fundo.sum() / (h * w)
    print(f"[OK] {saida.name} · {out.size[0]}x{out.size[1]} · {pct:.1f}% virou transparente")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("uso: python remover_fundo.py entrada.jpg saida.png")
    remover(Path(sys.argv[1]), Path(sys.argv[2]))
