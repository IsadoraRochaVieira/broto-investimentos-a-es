"""
GERADOR DE PIX — Caryo Map
===========================
Monta o BR Code (Pix Copia e Cola) estático no padrão EMV do Banco Central,
com valor embutido, e gera o QR Code correspondente.

O dinheiro é roteado pela CHAVE — nome e cidade são campos de exibição.

Uso: python gerar_pix.py
Saída: plataforma/public/pix-*.png + plataforma/src/lib/pix.ts (payloads)
"""
from pathlib import Path

import qrcode

ROOT = Path(__file__).parent
PUB = ROOT / "plataforma" / "public"
LIB = ROOT / "plataforma" / "src" / "lib"

# ── Dados do recebedor ────────────────────────────────
CHAVE = "+5561992739117"      # celular (61) 99273-9117
NOME = "PEQUI ESTUDIO"        # até 25 chars — campo de exibição
CIDADE = "BRASILIA"           # até 15 chars — campo de exibição

PLANOS = [
    {"id": "anual",  "valor": "197.00", "txid": "CARYOANUAL"},
    {"id": "mensal", "valor": "29.90",  "txid": "CARYOMENSAL"},
]


def tlv(tag: str, valor: str) -> str:
    """Tag-Length-Value do padrão EMV."""
    return f"{tag}{len(valor):02d}{valor}"


def crc16(payload: str) -> str:
    """CRC16-CCITT (polinômio 0x1021, init 0xFFFF) — exigido pelo BACEN."""
    crc = 0xFFFF
    for ch in payload.encode("utf-8"):
        crc ^= ch << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if (crc & 0x8000) else (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def montar_brcode(chave: str, nome: str, cidade: str, valor: str, txid: str) -> str:
    merchant = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", chave)
    payload = (
        tlv("00", "01")                       # formato
        + tlv("26", merchant)                 # conta pix
        + tlv("52", "0000")                   # categoria
        + tlv("53", "986")                    # moeda BRL
        + tlv("54", valor)                    # valor
        + tlv("58", "BR")                     # país
        + tlv("59", nome[:25])
        + tlv("60", cidade[:15])
        + tlv("62", tlv("05", txid[:25]))     # txid
    )
    payload += "6304"                          # tag+len do CRC
    return payload + crc16(payload)


def main() -> None:
    PUB.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    saidas = {}

    for p in PLANOS:
        code = montar_brcode(CHAVE, NOME, CIDADE, p["valor"], p["txid"])
        saidas[p["id"]] = code

        qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=10, border=2)
        qr.add_data(code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0a0e14", back_color="white")
        dest = PUB / f"pix-{p['id']}.png"
        img.save(dest)
        print(f"[OK] {dest.name} · R$ {p['valor']}")
        print(f"     {code}\n")

    # exporta os payloads para o front
    ts = (
        "// Gerado por gerar_pix.py — Pix estático do Caryo Map\n"
        "export const PIX = {\n"
        f"  chave: '{CHAVE}',\n"
        f"  nome: '{NOME}',\n"
        f"  cidade: '{CIDADE}',\n"
        f"  anual: '{saidas['anual']}',\n"
        f"  mensal: '{saidas['mensal']}',\n"
        "} as const\n"
    )
    (LIB / "pix.ts").write_text(ts, encoding="utf-8")
    print(f"[OK] src/lib/pix.ts")


if __name__ == "__main__":
    main()
