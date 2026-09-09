"""Package generated Teenieping PNGs as WebP, preserving existing alpha.

Never fabricates transparency or accepts an opaque/checkerboard background.
The source PNGs and prompts remain available for review.
"""

import argparse
import json
import shutil
from html import escape
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--characters', nargs='+', help='Export only these profile IDs; validate the other existing exports.')
args = parser.parse_args()
profiles = json.loads((ROOT / "src/data/teeniepingProfiles.json").read_text())
categories = ("looks", "prop", "theme", "magic")
character_ids = {profile["id"] for profile in profiles}
manifest = ROOT / "docs/assets/teenieping-image-outputs.json"
records = sorted((ROOT / "docs/assets/teenieping-generation").glob("*.json"))
outputs = [json.loads(record.read_text(encoding="utf-8-sig")) for record in records] if records else json.loads(manifest.read_text(encoding="utf-8-sig"))
manifest.write_text(json.dumps(outputs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
ready, rejected = [], []
for output in outputs:
    category, character = output["id"].split("/")
    assert category in categories and character in character_ids
    destination = ROOT / "src/assets/teenie" / category / f"{character}.webp"
    assert destination.resolve().is_relative_to((ROOT / "src/assets/teenie").resolve())
    source = Path(output["source"])
    selected = not args.characters or character in args.characters
    raw = ROOT / "output/teenieping/raw" / category / f"{character}.png"
    if selected:
        raw.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, raw)
    with Image.open(source if selected else destination) as original:
        alpha_range = original.getchannel("A").getextrema() if original.mode == "RGBA" else None
        if alpha_range is None or alpha_range[0] != 0 or alpha_range[1] < 250:
            rejected.append(output["id"])
            # Discard only this task's stale export; the original PNG is retained.
            if selected:
                destination.unlink(missing_ok=True)
            continue
        alpha = original.getchannel("A")
        width, height = original.size
        corners = ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))
        # Allow sub-1% alpha noise at a corner; reject an actual opaque backdrop.
        if alpha.histogram()[0] < width * height * 0.1 or any(alpha.getpixel(point) > 2 for point in corners):
            rejected.append(output["id"])
            if selected:
                destination.unlink(missing_ok=True)
            continue
        # Encoding only: keep original dimensions and every alpha value.
        destination.parent.mkdir(parents=True, exist_ok=True)
        if selected and (not destination.exists() or destination.stat().st_mtime < source.stat().st_mtime):
            original.save(destination, format="WEBP", quality=90, method=6, exact=True)
        with Image.open(destination) as packaged:
            assert packaged.mode == "RGBA"
            assert packaged.getchannel("A").tobytes() == original.getchannel("A").tobytes()
        ready.append(output["id"])
print(json.dumps({"ready": len(ready), "needs_transparency": rejected}, indent=2))
status = {
    "expected": len(profiles) * len(categories),
    "generated": len(outputs),
    "ready": ready,
    "needsTransparency": rejected,
    "notGenerated": [f"{category}/{profile['id']}" for profile in profiles for category in categories if f"{category}/{profile['id']}" not in {output["id"] for output in outputs}],
}
(ROOT / "docs/assets/teenieping-export-status.json").write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")

# A review surface that exposes alpha edges over light, dark, and coloured cards.
sections = []
for profile in profiles:
    cards = []
    for category in categories:
        relative = f"../../src/assets/teenie/{category}/{profile['id']}.webp"
        exists = (ROOT / "src/assets/teenie" / category / f"{profile['id']}.webp").exists()
        picture = f'<img src="{relative}" alt="{escape(profile["clues"][category])}" loading="lazy">' if exists else '<span class="pending">Artwork pending</span>'
        cards.append(f'<figure><div class="art">{picture}</div><figcaption><b>{category.upper()}</b>{escape(profile["clues"][category])}</figcaption></figure>')
    portrait_id = profile.get('portraitId', profile['id'])
    sections.append(f'<section><h2><img src="../../src/assets/teenie/{portrait_id}.webp" alt="">{escape(profile["name"])}</h2><div class="clues">{"".join(cards)}</div></section>')
html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Teenieping artwork</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f1fa;color:#32263d;font:15px/1.5 system-ui}main{max-width:1180px;margin:auto;padding:32px 24px}h1{font-size:36px;margin:0}header{position:sticky;top:0;background:#f6f1faf2;z-index:2;padding:16px 0}nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}button{padding:8px 14px;border:1px solid #a18cad;background:white;border-radius:20px;cursor:pointer;color:#32263d}button[aria-pressed=true]{background:#6f3d86;color:white}section{margin:28px 0 48px}h2{display:flex;align-items:center;gap:12px;font-size:24px}h2 img{width:58px;height:66px;object-fit:contain}.clues{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0;overflow:hidden;border:1px solid #ddd0e3;border-radius:18px;background:white}.art{aspect-ratio:1;display:grid;place-items:center;background:var(--art-bg,#e5d6ed);padding:12px}.art img{width:100%;height:100%;object-fit:contain}figcaption{padding:13px 15px;min-height:92px}figcaption b{display:block;color:#865098;font-size:11px;letter-spacing:.09em;margin-bottom:5px}.pending{font-size:12px;color:#9c83a9}a{color:#6f3d86}@media(max-width:700px){.clues{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:28px}main{padding:16px}}
</style><main><header><h1>Teenieping clue artwork</h1><p>READY_COUNT of 336 transparent illustrations exported. <a href="teenieping-research.html">Research and sources</a></p><nav aria-label="Preview background"><span>Preview on</span><button data-color="#e5d6ed" aria-pressed="true">Lilac</button><button data-color="#ffffff" aria-pressed="false">White</button><button data-color="#182a3c" aria-pressed="false">Dark blue</button><button data-color="#88ccb0" aria-pressed="false">Mint</button></nav></header>SECTIONS</main><script>document.querySelectorAll('[data-color]').forEach(button=>button.addEventListener('click',()=>{document.documentElement.style.setProperty('--art-bg',button.dataset.color);document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));</script></html>'''
html = html.replace('</nav></header>', '</nav><p><label>Find a Teenieping <input type="search" id="character-search" placeholder="Name or clue" style="font:inherit;padding:8px 12px;border:1px solid #a18cad;border-radius:10px"></label></p></header>')
html = html.replace('</script>', '''document.getElementById('character-search').addEventListener('input',event=>{const query=event.target.value.trim().toLowerCase();document.querySelectorAll('section').forEach(section=>{section.hidden=!section.textContent.toLowerCase().includes(query)})});</script>''')
(ROOT / "docs/assets/teenieping-artwork.html").write_text(html.replace("of 336", f"of {len(profiles) * len(categories)}").replace("READY_COUNT", str(len(ready))).replace("SECTIONS", "".join(sections)), encoding="utf-8")
