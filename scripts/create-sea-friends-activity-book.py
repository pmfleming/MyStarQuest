"""Build the A4 Sea friends activity book from the existing story artwork.

Run with the bundled Codex Python (ReportLab and Pillow required).
Generated colouring masters live in output/pdf/artwork; story art stays in src.
"""

from pathlib import Path
import json
import re

from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab import rl_config

rl_config.useA85 = False


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
ART = OUT / 'artwork'
TMP = ROOT / 'tmp/pdfs'
for folder in (OUT, ART, TMP):
    folder.mkdir(parents=True, exist_ok=True)

for name, file in [('Body', 'trebuc.ttf'), ('Bold', 'trebucbd.ttf'),
                   ('Title', 'georgiab.ttf')]:
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
WHITE = colors.white
PDF = OUT / 'sea-friends-activity-book.pdf'
c = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
c.setTitle('Sea friends - Story and activity book')
c.setAuthor('MyStarQuest')
c.setSubject('Ages 5-7: story, tracing, colouring, maths and spelling')
pages = []
image_cache = {}


def txt(text, x, y, size=16, font='Body', colour=INK):
    c.setFillColor(colour)
    c.setFont(font, size)
    c.drawString(x, y, text)


def center(text, y, size=16, font='Body', colour=INK):
    c.setFont(font, size)
    c.setFillColor(colour)
    c.drawCentredString(W / 2, y, text)


def wrap(text, width, size=16, font='Body'):
    lines, line = [], ''
    for word in text.split():
        trial = (line + ' ' + word).strip()
        if pdfmetrics.stringWidth(trial, font, size) > width and line:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def para(text, x, y, width=CW, size=16, leading=24, font='Body', colour=INK):
    for line in wrap(text, width, size, font):
        txt(line, x, y, size, font, colour)
        y -= leading
    return y


def line(x1, y1, x2, y2, colour=RULE, width=.7):
    c.setStrokeColor(colour)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)


def rules(y, n=3, step=31, x=M, width=CW):
    for i in range(n):
        line(x, y - i * step, x + width, y - i * step)


def box(x, y, width=45, height=37):
    c.setStrokeColor(INK)
    c.setLineWidth(1)
    c.roundRect(x, y, width, height, 5, stroke=1, fill=0)


def picture(path, x, y, width, height):
    """Place a complete image without cropping; JPEG-cache colour story art."""
    path = Path(path)
    if not path.is_absolute():
        path = ROOT / path
    key = str(path)
    if key not in image_cache:
        im = Image.open(path)
        iw, ih = im.size
        render = path
        # Encoding is for PDF size only; preserve the complete composition.
        if path.suffix.lower() in ('.webp', '.png'):
            render = TMP / ('embed-' + str(len(image_cache)) + '.jpg')
            if im.mode == 'RGBA':
                opaque = Image.new('RGB', im.size, 'white')
                opaque.paste(im, mask=im.getchannel('A'))
                im = opaque
            else:
                im = im.convert('RGB')
            is_line_art = path.parent == ART
            im.save(render, 'JPEG', quality=95 if is_line_art else 86,
                    subsampling=0 if is_line_art else 2)
        image_cache[key] = (render, iw, ih)
    render, iw, ih = image_cache[key]
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(str(render), x + (width - dw) / 2,
                y + (height - dh) / 2, dw, dh, mask='auto')


def start(title, kind='STORY', section='Sea friends'):
    number = len(pages) + 1
    colour = TEAL if kind == 'STORY' else (PLUM if kind == 'COLOUR & WRITE' else GOLD)
    pages.append({'page': number, 'title': title, 'kind': kind, 'section': section})
    txt('MYSTARQUEST  /  SEA FRIENDS', M, H - 42, 10, 'Bold', colour)
    c.setFont('Bold', 9)
    c.setFillColor(colour)
    c.drawRightString(W - M, H - 42, kind)
    line(M, H - 54, W - M, H - 54, colour, 1)
    size = 28
    while pdfmetrics.stringWidth(title, 'Title', size) > CW:
        size -= 1
    txt(title, M, H - 96, size, 'Title')
    line(M, 47, W - M, 47)
    txt(section, M, 30, 9, colour=colors.HexColor('#6D6A77'))
    c.setFont('Bold', 10)
    c.setFillColor(INK)
    c.drawRightString(W - M, 30, str(number))
    c.bookmarkPage('page-' + str(number))
    c.addOutlineEntry(title, 'page-' + str(number), level=0, closed=False)


def finish():
    c.showPage()


def tracing(text, y, x=M, width=CW, size=19):
    lines = wrap(text, width, size)
    assert len(lines) <= 2, text
    for s in lines:
        txt(s, x + 3, y, size, colour=TRACE)
        line(x, y - 5, x + width, y - 5)
        y -= 27
    rules(y - 5, 1, x=x, width=width)


source = (ROOT / 'src/data/stories/seaFriends.ts').read_text(encoding='utf-8')
imports = {name: (ROOT / 'src/data/stories' / path).resolve()
           for name, path in re.findall(r"import (\w+) from '([^']+)'", source)}
story = [(pid, imports[image]) for pid, image in re.findall(
    r"\{\s+id: '([^']+)',(?:(?!\n    \},).)*?\bimage: (\w+),", source, re.S)
         if pid != 'cover']
assert len(story) == 63, f'Expected all 63 story scenes, found {len(story)}'

CAPTIONS = [
    'Odette walks beside the sea.', 'The sea seems to call to her.',
    'Odette leaps into the water.', 'Magic gives her a mermaid tail.',
    'Rainbow greets her by the coral.', 'Primarina and Aquafox say hello.',
    'Tangy and Sweet join the friends.', 'Eclipse and Diana wave hello.',
    'Hopping and Doremi join in.', 'The friends play in the sea.',
    'They swim towards a castle.', 'The castle has a shell door.',
    'The friends go inside.', 'Two helpers make ice creams.',
    'The helpers dust and mop.', 'They paint pictures for the walls.',
    'A helper puts the toys away.', 'Odette meets all seven helpers.',
    'It is time for an adventure.', 'They find a diamond mine.',
    'Everyone helps to gather gems.', 'Odette makes a diamond room.',
    'The room shines with rainbows.', 'The friends brush their teeth.',
    'The little helpers brush too.', 'Primarina and Aquafox sleep.',
    'Tangy and Sweet have sweet dreams.', 'Eclipse and Diana rest in bed.',
    'Hopping and Doremi sleep too.', 'Seven helpers snuggle into bed.',
    'Odette and Rainbow rest at last.', 'Morning comes to the castle.',
    'Ice cream is a funny breakfast!', 'The friends find a magic mirror.',
    'A pink portal opens up.', 'The portal whisks them away.',
    'They arrive at a sky castle.', 'Aurora welcomes her friends.',
    'A playground waits in the clouds.', 'Odette slides down the rainbow.',
    'Eclipse and Diana try the swings.', 'Two visitors hop on the stones.',
    'Two friends spin round and round.', 'The helpers bounce on clouds.',
    'Three helpers cross the bridge.', 'Dingdong invites them into space.',
    'The friends put on spacesuits.', 'A golden star planet glows.',
    'They fly towards the star.', 'Two new friends welcome them.',
    'So many worlds circle Pop Star!', 'Five friends fly to a castle.',
    'They reach the big golden doors.', 'The friends step into the dark.',
    'A cloaked visitor waits inside.', 'Surprise! It is a birthday party!',
    'Everyone gathers round the cake.', 'Doremi plays while friends dance.',
    'Everyone smiles for a photograph.', 'Odette holds the special picture.',
    'It is time to wave goodbye.', 'The friends fly home to Earth.',
    'Odette and her friends find fossils.',
]
assert len(CAPTIONS) == len(story)

PAIR_TITLES = [
    'The adventure begins', 'A splash of magic', 'Friends beneath the waves',
    'More friends to meet', 'Music and play', 'A castle in the sea',
    'Welcome to the castle', 'Busy little helpers', 'A helping hand',
    'Off to the diamond mine', 'A sparkling idea', 'Time to get ready for bed',
    'Goodnight, sea friends', 'Dreams in the castle', 'A quiet castle',
    'A brand new day', 'Breakfast and a magic mirror', 'Through the pink portal',
    'A castle in the clouds', 'The sky playground', 'Swings and stepping stones',
    'Spin and bounce', 'An invitation to space', 'Ready for the stars',
    'New friends on Pop Star', 'A sky full of worlds', 'Behind the golden doors',
    'A wonderful surprise', 'Cake, music and dancing', 'A picture to keep',
    'The journey home', 'A fossil adventure',
]


def story_page(pair):
    items = story[pair * 2:pair * 2 + 2]
    section = ('Land & sea' if pair < 18 else 'Sky castle' if pair < 23
               else 'Space & birthday' if pair < 31 else 'Back on Earth')
    start(PAIR_TITLES[pair], section=section)
    if len(items) == 2:
        for j, (_, asset) in enumerate(items):
            top = 706 - 310 * j
            picture(asset, M, top - 224, CW, 224)
            tracing(CAPTIONS[pair * 2 + j], top - 251)
    else:
        picture(items[0][1], M, 358, CW, 342)
        tracing(CAPTIONS[-1], 328)
        txt('What can you spot in the sand?', M, 233, 17, 'Bold')
        rules(205, 4, 34)
    pages[-1]['scene_ids'] = [pid for pid, _ in items]
    finish()


def portrait(name, key, sentence, prompt):
    start(name, 'COLOUR & WRITE', 'Meet the characters')
    txt('Colour the picture. Trace the sentence. Add your own idea.', M, 714, 13)
    picture(ART / (key + '.png'), M + 40, 285, CW - 80, 405)
    tracing(sentence, 260)
    txt(prompt, M, 170, 16, 'Bold')
    rules(139, 2, 34)
    finish()


def colouring(title, key, sentence):
    start(title, 'COLOUR', 'Colour the story')
    para('Bring this story picture to life with your own colours.', M, 712, size=15)
    picture(ART / (key + '.png'), M, 290, CW, 390)
    tracing(sentence, 255)
    txt('Draw one more little detail from your imagination.', M, 160, 16)
    c.setStrokeColor(RULE)
    c.roundRect(M, 72, CW, 70, 8, stroke=1, fill=0)
    finish()


def names():
    start('Spell the sea friends', 'SPELLING', 'Picture spelling')
    para('Say each name. Circle the missing letter. Write it in the gap.', M, 710,
         size=16)
    entries = [('odette', 'O _ E T T E', ['B', 'D', 'P']),
               ('rainbow', 'R A I _ B O W', ['N', 'M', 'H']),
               ('eclipse', 'E C L _ P S E', ['A', 'O', 'I']),
               ('eclipse-diana', 'D I A _ A', ['N', 'R', 'S'])]
    images = ['odette', 'rainbow', None, None]
    for i, (_, word, choices) in enumerate(entries):
        y = 572 - i * 132
        asset = ('src/assets/comic/layers/underwater/' + images[i] + '.webp'
                 if images[i] else 'src/assets/teenie/' + ['odette', 'rainbow', 'eclipse', 'diana'][i] + '.webp')
        picture(asset, M, y - 3, 105, 105)
        txt(word, M + 126, y + 63, 24, 'Bold')
        txt('Choose:', M + 126, y + 20, 13)
        for j, letter in enumerate(choices):
            txt(letter, M + 203 + 55 * j, y + 17, 22, 'Bold')
        line(M + 125, y - 12, W - M, y - 12)
    finish()


def helper_maths():
    start('Little helper maths', 'MATHS', 'Add and take away')
    para('Count the helpers. Write the answer in each box.', M, 711, size=16)
    coral = 'src/assets/comic/layers/ice-cream/coral.webp'
    crystal = 'src/assets/comic/layers/ice-cream/crystal.webp'
    for row, (left, right, asset) in enumerate([(3, 2, coral), (4, 3, crystal)]):
        y = 562 - row * 172
        for i in range(left):
            picture(asset, M + i * 43, y, 40, 71)
        txt('+', M + 193, y + 27, 28, 'Bold')
        for i in range(right):
            picture(asset, M + 234 + i * 43, y, 40, 71)
        txt('=', W - M - 85, y + 27, 25, 'Bold')
        box(W - M - 45, y + 20)
        txt(f'{left} + {right} =', M + 10, y - 40, 21)
        box(M + 116, y - 50)
    txt('Cross out 2 helpers. How many are left?', M, 303, 17, 'Bold')
    for i in range(6):
        picture(coral, M + i * 67, 207, 57, 76)
    txt('6 - 2 =', M + 15, 160, 24)
    box(M + 122, 150)
    txt('Try it with your fingers: 5 + 5 =', M, 91, 18)
    box(M + 306, 80)
    finish()


def gem_maths():
    start('Diamond mine numbers', 'MATHS', 'Count, compare and share')
    para('Use the gems to help you solve each puzzle.', M, 712, size=16)
    # The gem is a world from the story's Pop Star system.
    gem = 'src/assets/comic/layers/star-system/gem.webp'
    txt('1. Count the gems. Then add one more.', M, 664, 17, 'Bold')
    for i in range(5):
        picture(gem, M + i * 70, 570, 59, 65)
    txt('5 + 1 =', M, 530, 23)
    box(M + 119, 520)
    txt('2. Draw 8 gems in the two baskets.', M, 463, 17, 'Bold')
    txt('Share them equally. How many in each basket?', M, 436, 15)
    for x in [M, M + 260]:
        c.setStrokeColor(INK)
        c.roundRect(x, 278, 235, 132, 16, stroke=1, fill=0)
        c.arc(x + 65, 365, x + 169, 414, 0, 180)
    txt('Each basket has', M, 237, 20)
    box(M + 168, 225)
    txt('gems.', M + 229, 237, 20)
    txt('3. Fill each gap: count in twos.', M, 174, 17, 'Bold')
    for i, value in enumerate(['2', '4', '', '8', '']):
        x = M + i * 98
        box(x, 96, 70, 50)
        if value:
            txt(value, x + 25, 110, 26, 'Bold')
    finish()


def bedtime():
    start('Ready for bed', 'STORY PUZZLE', 'First, next and last')
    para('Number the pictures 1, 2 and 3. Show what happened first.', M, 710,
         size=16)
    by_id = dict(story)
    order = [('30-helper-nursery', 'Sleep in a cosy bed.'),
             ('14-ice-creams', 'Make ice creams.'),
             ('25-helpers-brushing', 'Brush your teeth.')]
    for i, (pid, text) in enumerate(order):
        y = 505 - i * 171
        picture(by_id[pid], M, y, 242, 140)
        box(M + 277, y + 62, 53, 45)
        tracing(text, y + 25, x=M + 277, width=CW - 277, size=16)
    finish()


def space():
    start('Numbers in space', 'MATHS', 'Number trails and tens')
    para('Dingdong is ready to fly. Help her with these number jobs.', M, 710,
         size=16)
    picture('src/assets/comic/layers/dingdong-arrival/dingdong.webp',
            W - M - 120, 528, 115, 135)
    txt('1. Count on in ones.', M, 660, 18, 'Bold')
    for i, value in enumerate(['3', '4', '', '6', '', '8']):
        x = M + i * 59
        box(x, 579, 45, 47)
        txt(value, x + 14, 592, 24, 'Bold')
    txt('2. Count backwards.', M, 518, 18, 'Bold')
    for i, value in enumerate(['10', '', '8', '', '6']):
        x = M + i * 97
        box(x, 443, 69, 47)
        txt(value, x + 21, 456, 24, 'Bold')
    txt('3. Make ten stars.', M, 382, 18, 'Bold')
    # Use the actual golden star planet artwork, not an unrelated icon.
    star = dict(story)['46-star-planet']
    picture(star, M, 241, 200, 113)
    txt('6 +', M + 232, 297, 24)
    box(M + 295, 286)
    txt('= 10', M + 353, 297, 24)
    txt('4. Put the numbers in order, smallest first.', M, 197, 16, 'Bold')
    txt('9        2        6', M + 41, 153, 25)
    for i in range(3):
        box(M + 260 + i * 65, 141, 49, 43)
    finish()


GRID = ['CAKESRS', 'PARTYUT', 'XDFGHSA', 'ODANCER', 'JLMNOPQ', 'FRIENDS', 'UVWXYZB']
WORDS = [('CAKE', 0, 0, 0, 1), ('PARTY', 1, 0, 0, 1),
         ('STAR', 0, 6, 1, 0), ('DANCE', 3, 1, 0, 1),
         ('FRIENDS', 5, 0, 0, 1)]
for word, r, col, dr, dc in WORDS:
    assert ''.join(GRID[r + i * dr][col + i * dc] for i in range(len(word))) == word


def wordsearch():
    start('Birthday word hunt', 'SPELLING', 'Find and write')
    para('Find the party words. Look across or down. Circle each word.', M, 711,
         size=16)
    picture(dict(story)['55-birthday-cake'], M, 542, CW, 126)
    cell = 43
    gx, gy = M + 3, 500
    for row, letters in enumerate(GRID):
        for col, letter in enumerate(letters):
            txt(letter, gx + col * cell + 10, gy - row * cell, 24, 'Bold')
    txt('Find:', M + 337, 496, 17, 'Bold')
    for i, (word, *_) in enumerate(WORDS):
        txt(word, M + 337, 453 - i * 46, 17, 'Bold')
    txt('Choose a word. Trace it, then write it yourself.', M, 182, 16)
    tracing('cake', 144)
    finish()


def fossil():
    start('Fossil detective', 'SPELLING & MATHS', 'Look closely')
    picture(dict(story)['61-fossil-dig'], M, 487, CW, 216)
    txt('1. Finish the dig words. Use the word bank.', M, 450, 17, 'Bold')
    txt('sand       brush       fossil', M + 52, 412, 22, 'Bold', TEAL)
    txt('s _ n d', M, 361, 25)
    txt('b r _ s h', M + 166, 361, 25)
    txt('f o s s _ l', M + 338, 361, 25)
    txt('2. Three friends dig. Two more friends join them.', M, 304, 16)
    txt('3 + 2 =', M, 257, 23)
    box(M + 121, 245)
    txt('3. Which tool helps you look closely? Circle it.', M, 193, 16, 'Bold')
    for i, option in enumerate(['a spoon', 'a magnifying glass', 'a pillow']):
        txt(option, M + 14, 150 - 25 * i, 17)
    finish()


def next_adventure():
    start('Your next adventure', 'DRAW & WRITE', 'Imagine what happens next')
    para('Where will Odette go next? Draw a new story scene.', M, 709, size=16)
    c.setStrokeColor(RULE)
    c.roundRect(M, 324, CW, 344, 10, stroke=1, fill=0)
    tracing('Next, Odette goes to', 282)
    rules(207, 4, 34)
    finish()


def cover():
    start('Sea friends', 'ACTIVITY BOOK', 'Read, trace, colour and play')
    center('A magical story & activity adventure', 699, 19, 'Bold', PLUM)
    picture('src/assets/comic/sea-friends-poster.webp', M + 100, 226,
            CW - 200, 440)
    center('Sea castles. Cloud playgrounds. Space surprises.', 191, 15)
    center('Colouring  /  Writing  /  Maths  /  Spelling', 154, 16, 'Bold', TEAL)
    center('For explorers aged 5-7', 102, 14)
    finish()


def guide():
    start('This adventure belongs to...', 'WELCOME', 'Make the book your own')
    txt('My name is', M, 705, 20, 'Bold')
    rules(659, 1)
    txt('How to use your book', M, 598, 21, 'Title')
    y = 556
    for title, body in [
        ('READ & TRACE', 'Trace the pale grey captions, then write on the blank lines. You can write your own words instead.'),
        ('COLOUR & WRITE', 'Colour each character. Trace a sentence, then write your own word or idea.'),
        ('MATHS & SPELLING', 'Count the story pictures, finish names and hunt for words. A grown-up can read the instructions.'),
    ]:
        txt(title, M, y, 12, 'Bold', TEAL)
        y = para(body, M, y - 29, size=16) - 29
    txt('Your adventure trail', M, 236, 21, 'Title')
    txt('Sea  >  Sky  >  Space  >  Fossils', M, 195, 20, 'Bold', PLUM)
    para('For grown-ups: print on A4 at actual size (100%). Single-sided pages leave room for colouring. Answers are at the back.',
         M, 133, size=12, leading=18)
    finish()


def answer_block(title, lines, y):
    txt(title, M, y, 17, 'Bold', TEAL)
    return para(' '.join(lines), M, y - 29, size=14, leading=22) - 25


def answers():
    page_for = {p['title']: p['page'] for p in pages}
    start('Answers for grown-ups', 'ANSWERS', 'Help, hints and encouragement')
    y = 710
    for title, result in [
        ('Spell the sea friends', ['Odette: D. Rainbow: N. Eclipse: I. Diana: N.']),
        ('Little helper maths', ['3 + 2 = 5. 4 + 3 = 7. 6 - 2 = 4. 5 + 5 = 10.']),
        ('Diamond mine numbers', ['5 + 1 = 6. Share 8 equally: 4 gems in each basket. Count in twos: 2, 4, 6, 8, 10.']),
        ('Ready for bed', ['Top picture: 3 (sleep). Middle: 1 (make ice creams). Bottom: 2 (brush teeth).']),
        ('Numbers in space', ['Count on: 3, 4, 5, 6, 7, 8. Count back: 10, 9, 8, 7, 6. Make ten: 6 + 4 = 10. Smallest first: 2, 6, 9.']),
    ]:
        y = answer_block(f'{title} (page {page_for[title]})', result, y)
    para('Accept invented spellings and spoken answers while children build confidence. Drawing and writing pages have no single right answer.',
         M, 142, size=13, leading=20)
    finish()
    start('More answers & a big well done', 'ANSWERS', 'Keep the adventure going')
    y = answer_block(f'Birthday word hunt (page {page_for["Birthday word hunt"]})', [
        'Rows and columns count from the top left. CAKE: row 1, columns 1-4. PARTY: row 2, columns 1-5. STAR: column 7, rows 1-4. DANCE: row 4, columns 2-6. FRIENDS: row 6, columns 1-7.'
    ], 710)
    y = answer_block(f'Fossil detective (page {page_for["Fossil detective"]})', [
        'sand: a. brush: u. fossil: i. Three plus two makes five. The magnifying glass helps you look closely.'
    ], y)
    txt('I am a StarQuest explorer!', M, 395, 25, 'Title', PLUM)
    para('I explored the story. I tried new puzzles. I made the pages my own.',
         M, 352, size=18, leading=28)
    txt('My favourite part was', M, 249, 18, 'Bold')
    rules(209, 2, 34)
    txt('Finished on:', M, 109, 15)
    line(M + 100, 103, W - M, 103)
    finish()


cover()
guide()
for pair in range(32):
    story_page(pair)
    if pair == 1:
        portrait('Odette', 'odette', 'Odette is ready to explore.', 'What would you show Odette?')
    elif pair == 4:
        portrait('Rainbow Ping', 'rainbow', 'Rainbow is a kind friend.', 'How can you be a kind friend?')
        names()
    elif pair == 6:
        colouring('Ice cream in the castle', 'ice-cream', 'The helpers make a tasty treat.')
        helper_maths()
    elif pair == 10:
        gem_maths()
    elif pair == 15:
        bedtime()
    elif pair == 18:
        portrait('Aurora Ping', 'aurora', 'Aurora welcomes her friends.', 'What would you play in the clouds?')
    elif pair == 19:
        colouring('Colour the rainbow slide', 'rainbow-slide', 'The friends slide through the sky.')
    elif pair == 22:
        portrait('Dingdong Ping', 'dingdong', 'Dingdong loves a space trip.', 'Where would your rocket go?')
    elif pair == 23:
        space()
    elif pair == 25:
        portrait('Eclipse Ping', 'eclipse', 'Eclipse explores with her friends.', 'What would you take on an adventure?')
    elif pair == 29:
        wordsearch()
    elif pair == 31:
        portrait('Diana Ping', 'diana', 'Diana looks closely at a fossil.', 'What would you like to discover?')
        fossil()
        next_adventure()
answers()
c.save()
assert len(pages) == 52, len(pages)
assert [pid for p in pages for pid in p.get('scene_ids', [])] == [pid for pid, _ in story]
(OUT / 'sea-friends-page-index.json').write_text(json.dumps(pages, indent=2), encoding='utf-8')
print(f'Created {PDF}: {len(pages)} A4 pages; all {len(story)} story scenes in order.')
