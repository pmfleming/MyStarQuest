"""Download official Punirunes reference artwork and record its provenance.

Run from the repository root with Python and Pillow installed.
"""

import hashlib
import io
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/assets/punirunes'
TOY = 'https://www.takaratomy.co.jp/products/punirunes/character/'
ANIME = 'https://www.tv-tokyo.co.jp/anime/punirunes/chara/'
ANIME2 = 'https://www.tv-tokyo.co.jp/anime/punirunes2/chara/'
ANIME3 = 'https://www.tv-tokyo.co.jp/anime/punirunes3_kachikochi/chara/'
NAMES = dict(line.split() for line in '''
べびるん Bebirun
あかるん Akarun
きいるん Kiirun
あおるん Aorun
あいるん Airun
じゅえるん Jewerun
らぶるん Loverun
えねるん Enerun
うるるん Ururun
くーるん Coorun
ともるん Tomorun
おしるん Oshirun
おにるん Onirun
みにるん Minirun
ちょこるん Chokorun
なぞるん Nazorun
ぷかるん Pukarun
おとるん Otorun
らんるん Ranrun
すしるん Sushirun
べりるん Berirun
かぷるん Kapurun
にゃるるん Nyarurun
えんじぇるん Enjerun
でびるん Debirun
ふぇあるん Fearun
はるるん Harurun
がおるん Gaorun
さんるん Sanrun
つくるん Tsukurun
ぞうるん Zourun
ぴかるん Pikarun
ぴよるん Piyorun
ぷるるん Pururun
べあるん Bearun
うさるん Usarun
はぴるん Happyrun
とげるん Toggyrun
ひかるん Hikarun
ゆにるん Yunirun
ぷいるん Puirun
るんるん Runrun
うたるん Utarun
いかるん Ikarun
ばけるん Bakerun
わふるん Wafurun
ねるるん Nerurun
ぽいるん Poirun
ぷりるん Purirun
むにゃるん Munyarun
ぱふぇるん Paferun
まきるん Makirun
ゆか Yuka
'''.strip().splitlines())


class Images(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.images = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.images.append(dict(attrs))


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'MyStarQuest asset research'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


def download(job):
    target = OUT / job['file']
    target.parent.mkdir(parents=True, exist_ok=True)
    data = target.read_bytes() if target.exists() else fetch(job['sourceUrl'])
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        assert image.format == 'PNG', job
        job.update(width=image.width, height=image.height, sha256=hashlib.sha256(data).hexdigest())
        job['hasTransparency'] = image.convert('RGBA').getchannel('A').getextrema()[0] < 255
    if not target.exists():
        target.write_bytes(data)
    return job


def main():
    cards = {}
    for img in Images(fetch(TOY).decode('utf-8')).images:
        if not re.match(r'img/img_index\d+\.png', img.get('src', '')):
            continue
        name = img['alt']
        number = int(re.search(r'index(\d+)', img['src'])[1])
        edition = 'Puni Plus' if number <= 28 else 'Punitomo Tsushin' if number <= 69 else 'Punistal'
        if number >= 108:
            edition = 'Punistal Premium'
        if name not in cards:
            cards[name] = dict(name=NAMES[name], japaneseName=name, editions=[], referenceImages=[])
        entry = cards[name]
        if edition not in entry['editions']:
            entry['editions'].append(edition)
        entry['referenceImages'].append(urljoin(TOY, img['src']))
    assert len(cards) == 52, f'Review changed official roster: {len(cards)}'
    jobs = [dict(name=e['name'], japaneseName=jp, file=f"references/{e['name']}.png", kind='official-character-card', sourcePage=TOY, sourceUrl=e['referenceImages'][0]) for jp, e in cards.items()]
    standalone = {}
    for page in [ANIME, ANIME2, ANIME3]:
        for img in Images(fetch(page).decode('utf-8')).images:
            name = img.get('alt')
            if name in NAMES and '/chara/chara' in img.get('src', ''):
                standalone.setdefault(name, dict(name=NAMES[name], japaneseName=name, file=f'{NAMES[name]}.png', kind='official-standalone', sourcePage=page, sourceUrl=urljoin(page, img['src'])))
    jobs.extend(standalone.values())
    with ThreadPoolExecutor(max_workers=6) as pool:
        assets = list(pool.map(download, jobs))
    roster = []
    for jp, e in cards.items():
        e['stage'] = 'baby' if jp == 'べびるん' else 'child' if jp in ['あかるん', 'きいるん', 'あおるん'] else 'adult'
        e['card'] = f"references/{e['name']}.png"
        e['image'] = f"{e['name']}.png" if jp in standalone else None
        roster.append(e)
    roster.append(dict(name='Yuka', japaneseName='ゆか', stage='human', image='Yuka.png'))
    manifest = dict(researchedOn='2026-11-15', scope='All 52 distinct characters on the official Takara Tomy character catalog, plus Yuka from the anime. Color variants are not separate characters. Sanrio crossover characters and anime-only guest/supporting characters outside these official character pages are not included.', naming='English names where verified in official English material; otherwise romanizations of the Japanese name. Romanizations are not claimed to be official localized names.', characters=roster, assets=assets)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(characters=len(roster), downloaded=len(assets), standalone=len(standalone), needsExtraction=[e['name'] for e in roster if not e.get('image')]), indent=2))


if __name__ == '__main__':
    main()
