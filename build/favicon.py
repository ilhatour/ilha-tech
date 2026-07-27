#!/usr/bin/env python3
"""
ILHA TECH — gerador dos ícones da marca (o 👾)

Por que existe: o favicon.svg antigo desenhava o emoji com <text>👾</text>,
o que só funciona em dispositivo que tenha fonte de emoji colorido instalada.
Como o SVG é o formato que Chrome e Firefox PREFEREM, um dispositivo sem essa
fonte mostrava quadrado vazio na aba. Aqui o bug vira vetor de verdade:
retângulos, sem depender de fonte nenhuma.

A silhueta foi traçada do próprio emoji 👾 (Apple Color Emoji), mas redesenhada
em cor da marca: Uva #9333EA no lugar do roxo acinzentado #7D5BAB do emoji,
que não existe na paleta Velvet Lima.

Rode:  python3 build/favicon.py     (precisa de Pillow)
Gera:  favicon.ico · assets/img/favicon-16.png · favicon-32.png ·
       apple-touch-icon.png (+ cópia na raiz)
O favicon.svg é escrito pelo build/generate.mjs, a partir da MESMA grade.
"""
from PIL import Image, ImageDraw
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UVA = (147, 51, 234, 255)      # #9333EA — acento da marca
VELVET = (20, 6, 47, 255)      # #14062F — âncora, fundo do apple-touch-icon

# Grade do 👾 traçada do emoji. '#' = corpo, '.' = vazado (olhos e fundo).
GRADE = """....######..######....
...#######..#######...
..##################..
..##################..
#####.##########.#####
######################
######################
#######..####..#######
#######..####..#######
#######..####..#######
.####################.
..##################..
..##################..
.....#####..#####.....
....######..######....
....######..######....
....###........###....
....###........###...."""

LINHAS = GRADE.split("\n")
GW, GH = len(LINHAS[0]), len(LINHAS)
CAIXA = 24                      # canvas quadrado em células
OFF_X, OFF_Y = (CAIXA - GW) // 2, (CAIXA - GH) // 2


def desenha(escala, fundo=None):
    """Desenha o bug num canvas quadrado de CAIXA*escala px."""
    lado = CAIXA * escala
    img = Image.new("RGBA", (lado, lado), fundo or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y, linha in enumerate(LINHAS):
        x = 0
        while x < GW:
            if linha[x] == "#":
                fim = x
                while fim + 1 < GW and linha[fim + 1] == "#":
                    fim += 1
                d.rectangle(
                    [(OFF_X + x) * escala, (OFF_Y + y) * escala,
                     (OFF_X + fim + 1) * escala - 1, (OFF_Y + y + 1) * escala - 1],
                    fill=UVA)
                x = fim
            x += 1
    return img


def salva(img, destino, tamanho):
    """Reduz com LANCZOS: em 16px pixel art crua vira serrilhado."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.resize((tamanho, tamanho), Image.LANCZOS).save(destino)
    print(f"  {destino.relative_to(RAIZ)}  {tamanho}×{tamanho}")


mestre = desenha(32)                                   # 768px, fonte de tudo
salva(mestre, RAIZ / "assets/img/favicon-16.png", 16)
salva(mestre, RAIZ / "assets/img/favicon-32.png", 32)

# .ico multi-resolução: o Windows e alguns leitores ainda pedem
mestre.resize((48, 48), Image.LANCZOS).save(
    RAIZ / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("  favicon.ico  16/32/48")

# apple-touch-icon: iOS não respeita transparência (compõe sobre preto),
# então este vai com o Velvet por baixo.
tocar = desenha(32, fundo=VELVET)
salva(tocar, RAIZ / "assets/img/apple-touch-icon.png", 180)
salva(tocar, RAIZ / "apple-touch-icon.png", 180)

print("✅ Ícones da Ilha Tech gerados a partir da grade do 👾")
