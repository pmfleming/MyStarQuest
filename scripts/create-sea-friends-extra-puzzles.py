"""Build the seven-page Sea friends number quests and chapter word hunts.

Difficulty follows MyStarQuest's actual generators: two-step arithmetic with
operands 1-10, three-crown numbers up to 9,999, four-place positional notation,
and fraction recognition/simplification with four equal parts.
"""

from pathlib import Path
from fractions import Fraction
import random

from PIL import Image
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
TMP = ROOT / 'tmp/pdfs/extra-puzzles'
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
rl_config.useA85 = False
for name, file in [('Body', 'trebuc.ttf'), ('Bold', 'trebucbd.ttf'), ('Title', 'georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/' + file))

W, H = A4
M = 48
CW = W - 2 * M
INK = colors.HexColor('#302C46')
TEAL = colors.HexColor('#247B83')
PLUM = colors.HexColor('#76518E')
GOLD = colors.HexColor('#A46B13')
RULE = colors.HexColor('#C5C7CB')
TRACE = colors.HexColor('#B3B5BA')
LILAC = colors.HexColor('#F7F2FB')
MINT = colors.HexColor('#F0FAF8')
CREAM = colors.HexColor('#FFF9E9')
CROWN = 'src/assets/themes/teenie/royal-symbol.webp'
PDF = OUT / 'sea-friends-extra-puzzles.pdf'
c = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
c.setTitle('Sea friends - Number quests and chapter word adventures')
c.setAuthor('MyStarQuest')
c.setSubject('Seven pages: place value, two-step arithmetic, four-digit sums, fractions and five chapter word hunts')
cache = {}
page_number = 0
answers = ['SEA FRIENDS - NUMBER QUESTS & CHAPTER WORD ADVENTURES', 'Answers for grown-ups', '']


def text(s, x, y, size=16, font='Body', colour=INK):
    c.setFillColor(colour)
    c.setFont(font, size)
    c.drawString(x, y, s)


def centred(s, x, y, size=16, font='Body', colour=INK):
    c.setFillColor(colour)
    c.setFont(font, size)
    c.drawCentredString(x, y, s)


def para(s, x, y, width=CW, size=16, leading=24, font='Body', colour=INK):
    row = ''
    for word in s.split():
        trial = (row + ' ' + word).strip()
        if row and pdfmetrics.stringWidth(trial, font, size) > width:
            text(row, x, y, size, font, colour)
            y -= leading
            row = word
        else:
            row = trial
    if row:
        text(row, x, y, size, font, colour)
        y -= leading
    return y


def rule(y, x=M, width=CW, colour=RULE):
    c.setStrokeColor(colour)
    c.setLineWidth(.7)
    c.line(x, y, x + width, y)


def box(x, y, width=48, height=40, fill=None, stroke=RULE, radius=6):
    c.setStrokeColor(stroke)
    c.setLineWidth(.9)
    if fill is not None:
        c.setFillColor(fill)
    c.roundRect(x, y, width, height, radius, stroke=1, fill=fill is not None)


def picture(asset, x, y, width, height):
    if asset not in cache:
        im = Image.open(ROOT / asset)
        iw, ih = im.size
        if im.mode == 'RGBA':
            opaque = Image.new('RGB', im.size, 'white')
            opaque.paste(im, mask=im.getchannel('A'))
            im = opaque
        else:
            im = im.convert('RGB')
        embedded = TMP / f'image-{len(cache)}.jpg'
        im.save(embedded, 'JPEG', quality=90, subsampling=2)
        cache[asset] = (embedded, iw, ih)
    embedded, iw, ih = cache[asset]
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(str(embedded), x + (width - dw) / 2, y + (height - dh) / 2, dw, dh)


def crowns(x, y, count, size=17):
    for i in range(count):
        picture(CROWN, x + i * (size + 3), y, size, size)


def start(title, kind, subtitle, trail):
    global page_number
    page_number += 1
    text('MYSTARQUEST  /  SEA FRIENDS', M, H - 42, 10, 'Bold', GOLD)
    c.setFillColor(GOLD)
    c.setFont('Bold', 9)
    c.drawRightString(W - M, H - 42, kind)
    rule(H - 54, colour=GOLD)
    size = 28
    while pdfmetrics.stringWidth(title, 'Title', size) > CW - 44:
        size -= 1
    text(title, M, H - 96, size, 'Title')
    picture(CROWN, W - M - 30, H - 101, 30, 30)
    para(subtitle, M, 710, size=15, leading=22)
    rule(47)
    text(trail, M, 30, 9, colour=colors.HexColor('#6D6A77'))
    c.setFont('Bold', 10)
    c.setFillColor(INK)
    c.drawRightString(W - M, 30, str(page_number))
    c.bookmarkPage(f'page-{page_number}')
    c.addOutlineEntry(title, f'page-{page_number}', level=0)


def royal_vault():
    start('The royal number vault', 'MATHS',
          'Unlock the gems with place value and two-step number spells.',
          'Number quest  /  Place value & arithmetic')
    box(M, 627, CW, 62, fill=CREAM, stroke=colors.HexColor('#E8D9AE'))
    picture('src/assets/teenie/odette.webp', M + 9, 632, 63, 53)
    text('Every digit has its own throne!', M + 88, 665, 16, 'Bold', PLUM)
    text('Give each digit its place to open the vault.', M + 88, 642, 13)

    text('1. Write the digits in their places.', M, 599, 16, 'Bold')
    crowns(W - M - 61, 593, 3)
    column_width = CW / 5
    for col, label in enumerate(['Number', 'Thousands', 'Hundreds', 'Tens', 'Ones']):
        x = M + col * column_width
        box(x, 557, column_width, 29, fill=LILAC, radius=0)
        centred(label, x + column_width / 2, 567, 11, 'Bold', PLUM)
    for row, number in enumerate([4307, 6050]):
        y = 508 - row * 49
        for col in range(5):
            x = M + col * column_width
            box(x, y, column_width, 49, radius=0)
            if col == 0:
                centred(f'{number:,}', x + column_width / 2, y + 16, 20, 'Bold')

    text('2. Build the secret number.', M, 428, 16, 'Bold')
    text('5,000 + 80 + 4 =', M + 15, 387, 22, 'Bold')
    box(M + 278, 375, 145, 40, stroke=PLUM)
    text('3. Circle the larger number:', M, 339, 15, 'Bold')
    text('4,307', M + 300, 338, 20)
    text('4,370', M + 400, 338, 20)

    text('4. Two-step spells', M, 294, 17, 'Bold')
    crowns(M + 187, 290, 2)
    text('Work from left to right.', M + 259, 294, 13)
    sums = [('8 + 7 - 6', 9), ('9 - 4 + 8', 13),
            ('6 + 9 + 7', 22), ('10 - 7 + 9', 12)]
    for i, (spell, answer) in enumerate(sums):
        x, y = M + i % 2 * 262, 192 - i // 2 * 100
        box(x, y, 237, 77, fill=LILAC)
        text(spell + ' =', x + 12, y + 42, 20, 'Bold')
        box(x + 174, y + 29, 49, 37, fill=colors.white, stroke=PLUM)
        rule(y + 13, x + 13, 211)
        assert eval(spell) == answer
    answers.extend([
        'PAGE 1 - THE ROYAL NUMBER VAULT',
        '1. 4,307: 4 thousands, 3 hundreds, 0 tens, 7 ones.',
        '   6,050: 6 thousands, 0 hundreds, 5 tens, 0 ones.',
        '2. 5,084. 3. Circle 4,370.',
        '4. Top left: 9. Top right: 13. Bottom left: 22. Bottom right: 12.', '',
    ])
    c.showPage()


def column_sum(x, y, a, b, operation):
    box(x, y, 237, 207, fill=MINT)
    centres = [x + 60 + 42 * i for i in range(4)]
    for cx, label in zip(centres, ['Th', 'H', 'T', 'O']):
        centred(label, cx, y + 185, 11, 'Bold', TEAL)
        box(cx - 8, y + 157, 16, 16, fill=colors.white, radius=3)
    for cx, digit in zip(centres, f'{a:04}'):
        centred(digit, cx, y + 126, 26, 'Bold')
    for cx, digit in zip(centres, f'{b:04}'):
        centred(digit, cx, y + 89, 26, 'Bold')
    text(operation, x + 17, y + 89, 25, 'Bold', TEAL)
    rule(y + 75, x + 18, 200, colour=TEAL)
    for cx in centres:
        box(cx - 17, y + 24, 34, 39, fill=colors.white, stroke=TEAL)
    return a + b if operation == '+' else a - b


def pie(cx, cy, radius=35, denominator=4, selected=0):
    c.setStrokeColor(PLUM)
    c.setLineWidth(1)
    for i in range(denominator):
        c.setFillColor(colors.HexColor('#C8A5E3') if i < selected else colors.white)
        c.wedge(cx - radius, cy - radius, cx + radius, cy + radius,
                90 - (i + 1) * 360 / denominator, 360 / denominator,
                stroke=1, fill=1)


def fraction(cx, y, numerator=None, denominator=None, size=17):
    if numerator is None:
        box(cx - 17, y + 10, 34, 25, fill=colors.white, stroke=PLUM, radius=3)
    else:
        centred(str(numerator), cx, y + 12, size, 'Bold')
    rule(y + 2, cx - 19, 38, colour=PLUM)
    if denominator is None:
        box(cx - 17, y - 34, 34, 25, fill=colors.white, stroke=PLUM, radius=3)
    else:
        centred(str(denominator), cx, y - 23, size, 'Bold')


def star_sums():
    start('Pop Star sums & slices', 'MATHS',
          'Bring your place-value powers to Pop Star and share a royal feast.',
          'Number quest  /  Large numbers & fractions')
    text('1. Add or subtract in columns.', M, 659, 17, 'Bold')
    crowns(M + 266, 654, 3)
    text('Use the little boxes for trading.', M, 638, 12)
    result_a = column_sum(M, 422, 2468, 1357, '+')
    result_b = column_sum(M + 262, 422, 6204, 2786, '-')
    assert result_a == 3825 and result_b == 3418
    text('Th = thousands     H = hundreds     T = tens     O = ones', M, 403, 11)

    text("2. Sweet's fraction feast", M, 364, 19, 'Title', PLUM)
    picture('src/assets/themes/teenie/fractions/cake.webp', W - M - 66, 333, 66, 70)
    text('Each circle is one whole, cut into four equal slices.', M, 338, 13)
    width = (CW - 24) / 3
    for i in range(3):
        x = M + i * (width + 12)
        box(x, 88, width, 232, fill=LILAC)
        if i == 0:
            para('Name the shaded part.', x + 12, 295, width - 24, 13, 18, 'Bold')
            pie(x + width / 2, 235, selected=2)
            fraction(x + width / 2, 139)
        elif i == 1:
            para('Shade 3 out of 4.', x + 12, 295, width - 24, 13, 18, 'Bold')
            pie(x + width / 2, 235)
            text('Write the fraction.', x + 13, 184, 12)
            fraction(x + width / 2, 139)
        else:
            para('Make 2/4 simpler.', x + 12, 295, width - 24, 13, 18, 'Bold')
            pie(x + width / 2, 235, selected=2)
            text('Circle one:', x + 13, 184, 13, 'Bold')
            for offset, n, d in [(30, 1, 2), (79, 1, 4), (128, 3, 4)]:
                fraction(x + offset, 134, n, d)
    assert Fraction(2, 4) == Fraction(1, 2)
    answers.extend([
        'PAGE 2 - POP STAR SUMS & SLICES',
        '1. 2,468 + 1,357 = 3,825. 6,204 - 2,786 = 3,418.',
        '2. Left: 2/4 (accept 1/2). Middle: shade any 3 of the 4 equal parts and write 3/4.',
        '   Right: circle 1/2.', '',
    ])
    c.showPage()


CHAPTERS = [
    {
        'chapter': 'Land', 'title': 'Land: seaside secrets',
        'art': '01-poffertjes.webp',
        'words': ['SEA', 'SHORE', 'SAND', 'ROCK', 'WALK', 'SUGAR'],
        'scramble': 'H E S R O', 'solution': 'SHORE',
        'sentence': 'odette walks beside the sea',
        'example': 'Odette walks beside the sparkling sea.',
    },
    {
        'chapter': 'Sea', 'title': 'Sea: the pearl palace',
        'art': '12-castle-close.webp',
        'words': ['CORAL', 'SHELL', 'TAIL', 'PEARL', 'CASTLE', 'DIAMOND'],
        'scramble': 'T S A L E C', 'solution': 'CASTLE',
        'sentence': 'rainbow finds a pearl in the castle',
        'example': 'Rainbow finds a shiny pearl in the castle.',
    },
    {
        'chapter': 'Air', 'title': 'Air: the cloud playground',
        'art': '38-rainbow-slide.webp',
        'words': ['CLOUD', 'SLIDE', 'SWING', 'BRIDGE', 'SKY', 'RAINBOW'],
        'scramble': 'G D B E R I', 'solution': 'BRIDGE',
        'sentence': 'aurora plays on the rainbow slide',
        'example': 'Aurora plays on the bright rainbow slide.',
    },
    {
        'chapter': 'Space', 'title': 'Space: a word adventure',
        'art': '47-flight-to-star-planet.webp',
        'words': ['MOON', 'ROCKET', 'EARTH', 'SPACE', 'HOME', 'PLANET'],
        'scramble': 'T C R E K O', 'solution': 'ROCKET',
        'sentence': 'dingdong flies to the moon',
        'example': 'Dingdong flies to the glowing moon.',
    },
    {
        'chapter': 'Fossils', 'title': 'Fossils: buried treasure',
        'art': '61-fossil-dig.webp',
        'words': ['FOSSIL', 'BRUSH', 'SAND', 'ROCK', 'SPIRAL', 'DIG'],
        'scramble': 'S L F I O S', 'solution': 'FOSSIL',
        'sentence': 'diana brushes sand from a fossil',
        'example': 'Diana brushes sand from a tiny fossil.',
    },
]


def occurrences(grid, word):
    found = []
    for r in range(7):
        for col in range(7):
            for dr, dc in [(0, 1), (1, 0)]:
                if r + (len(word) - 1) * dr < 7 and col + (len(word) - 1) * dc < 7:
                    got = ''.join(grid[r + i * dr][col + i * dc] for i in range(len(word)))
                    if got == word:
                        found.append((r, col, dr, dc))
    return found


def make_grid(words, seed, space=False):
    rng = random.Random(seed)
    for attempt in range(2000):
        grid = [[''] * 7 for _ in range(7)]
        placements = []
        if space:
            preset = [
                ('MOON', 0, 0, 0, 1), ('ROCKET', 2, 0, 0, 1),
                ('EARTH', 4, 1, 0, 1), ('SPACE', 0, 6, 1, 0),
                ('HOME', 6, 2, 0, 1), ('PLANET', 1, 0, 0, 1),
            ]
            for word, r, col, dr, dc in preset:
                for i, letter in enumerate(word):
                    grid[r + i * dr][col + i * dc] = letter
            placements = preset
        else:
            for word in sorted(words, key=lambda s: -len(s)):
                candidates = []
                for r in range(7):
                    for col in range(7):
                        for dr, dc in [(0, 1), (1, 0)]:
                            if r + (len(word) - 1) * dr >= 7 or col + (len(word) - 1) * dc >= 7:
                                continue
                            cells = [grid[r + i * dr][col + i * dc] for i in range(len(word))]
                            if all(not cell or cell == letter for cell, letter in zip(cells, word)):
                                overlap = sum(bool(cell) for cell in cells)
                                candidates.append((overlap + rng.random() * 2, r, col, dr, dc))
                if not candidates:
                    break
                _, r, col, dr, dc = max(candidates)
                for i, letter in enumerate(word):
                    grid[r + i * dr][col + i * dc] = letter
                placements.append((word, r, col, dr, dc))
        if len(placements) != len(words):
            continue
        for r in range(7):
            for col in range(7):
                if not grid[r][col]:
                    grid[r][col] = rng.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        if all(len(occurrences(grid, word)) == 1 for word in words):
            return grid, placements
    raise ValueError('Could not build a unique word search')


def chapter_hunt(chapter, index):
    start(chapter['title'], 'WORDS & WRITING',
          'Find six chapter words. Look across or down. Circle each word.',
          f"Chapter word hunt  /  {chapter['chapter']}")
    picture('src/assets/comic/opening/' + chapter['art'], M, 543, CW, 149)
    grid, placements = make_grid(chapter['words'], 1517 + index, chapter['chapter'] == 'Space')
    for r, letters in enumerate(grid):
        for col, letter in enumerate(letters):
            text(letter, M + 11 + col * 39, 511 - r * 39, 23, 'Bold')
    text('Find:', M + 332, 511, 16, 'Bold', TEAL)
    for i, word in enumerate(chapter['words']):
        text(word, M + 332, 475 - 35 * i, 17, 'Bold')

    text('1. Unjumble a chapter word.', M, 235, 15, 'Bold', PLUM)
    text(chapter['scramble'], M + 6, 199, 21, 'Bold')
    count = len(chapter['solution'])
    assert sorted(chapter['scramble'].replace(' ', '')) == sorted(chapter['solution'])
    for i in range(count):
        box(M + 253 + i * 41, 187, 34, 36, fill=colors.white, stroke=PLUM)
    text('2. Rewrite: add a describing word, a capital and a full stop.', M, 158, 12.5, 'Bold')
    text(chapter['sentence'], M + 3, 130, 16, colour=TRACE)
    rule(105)
    rule(75)
    answers.extend([f"PAGE {page_number} - {chapter['title'].upper()}",
                    'Word hunt: rows start at the top; columns start at the left.'])
    for word in chapter['words']:
        r, col, dr, dc = occurrences(grid, word)[0]
        answers.append(f"  {word}: row {r + 1}, column {col + 1}, {'down' if dr else 'across'}.")
    answers.extend([f"Unjumble: {chapter['solution']}.",
                    'Writing: many answers are possible. Look for a capital letter,',
                    'a suitable describing word and a full stop.',
                    'Example: ' + chapter['example'], ''])
    c.showPage()


royal_vault()
star_sums()
for index, chapter in enumerate(CHAPTERS):
    chapter_hunt(chapter, index)
assert page_number == 7
c.save()
(OUT / 'sea-friends-extra-puzzles-answers.txt').write_text('\n'.join(answers), encoding='utf-8')
print(f'Updated {PDF}: {page_number} A4 pages, five unique chapter word hunts.')
