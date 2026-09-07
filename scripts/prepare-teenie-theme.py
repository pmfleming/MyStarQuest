"""Export generated theme masters, preserving real alpha; build a review sheet."""
import json
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/assets/teenie-theme-artwork.json'

def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_id = {e['id']: e for e in manifest['assets']}
    for group in ['teenie-theme-ability-prompts.json', 'teenie-theme-season-prompts.json']:
        source = MANIFEST.parent / group
        if source.exists():
            for entry in json.loads(source.read_text(encoding='utf-8-sig')):
                by_id.setdefault(entry['id'], entry)
    records = sorted((MANIFEST.parent / 'teenie-theme-generation').glob('*.json')) + sorted((MANIFEST.parent / 'teenie-theme-corrections').glob('*.json'))
    latest = {}
    for record in records:
        entry = json.loads(record.read_text(encoding='utf-8-sig'))
        latest[entry['id']] = entry
    for entry in latest.values():
        previous = by_id.get(entry['id'], {})
        by_id[entry['id']] = {**entry, **previous} if previous.get('source') == entry.get('source') and previous.get('status') == 'exported' else entry
    manifest['assets'] = list(by_id.values())
    reviewed = []
    rejected = []
    for entry in manifest['assets']:
        if not entry.get('source'):
            continue
        source = Image.open(entry['source'])
        source_hash = hashlib.sha256(Path(entry['source']).read_bytes()).hexdigest()
        transparent = entry.get('transparent', True)
        if transparent:
            if source.mode != 'RGBA' or source.getchannel('A').getextrema() != (0, 255):
                rejected.append(entry)
                entry['status'] = 'needs-transparency-correction'
                continue
            alpha = source.getchannel('A')
            clear = alpha.histogram()[0] / (source.width * source.height)
            if clear < 0.05:
                rejected.append(entry)
                entry['status'] = 'needs-transparency-correction'
                continue
            entry['alpha'] = {'range': [0, 255], 'clearFraction': round(clear, 3)}
        target = ROOT / entry['output']
        target.parent.mkdir(parents=True, exist_ok=True)
        source.thumbnail(tuple(entry.get('size', [768, 768])), Image.Resampling.LANCZOS)
        if not target.exists() or entry.get('status') != 'exported' or entry.get('sourceSha256') != source_hash:
            source.save(target, 'WEBP', quality=78, method=4, exact=True)
        exported = Image.open(target)
        if transparent and exported.getchannel('A').tobytes() != source.getchannel('A').tobytes():
            raise ValueError(f"{entry['id']}: alpha changed during export")
        entry['exportedSize'] = list(exported.size)
        entry['bytes'] = target.stat().st_size
        entry['sourceSha256'] = source_hash
        entry['status'] = 'exported'
        reviewed.append((entry['id'], exported.copy()))
    manifest['status'] = 'exported' if len(reviewed) == len(manifest['assets']) else 'in-progress'
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    for page in range((len(reviewed) + 23) // 24):
        chunk = reviewed[page * 24:(page + 1) * 24]
        sheet = Image.new('RGB', (1200, ((len(chunk) + 5) // 6) * 220), '#302744')
        draw = ImageDraw.Draw(sheet)
        for i, (name, picture) in enumerate(chunk):
            picture.thumbnail((184, 184))
            x, y = (i % 6) * 200, (i // 6) * 220
            if picture.mode == 'RGBA':
                sheet.paste(picture, (x + (200-picture.width)//2, y), picture)
            else:
                sheet.paste(picture, (x + (200-picture.width)//2, y))
            draw.text((x + 5, y + 188), name, fill='white')
        dest = ROOT / f'output/teenie-theme/review-{page + 1}.jpg'
        dest.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(dest, quality=90)
    rejection_file = ROOT / 'output/teenie-theme/rejected.json'
    rejection_file.parent.mkdir(parents=True, exist_ok=True)
    rejection_file.write_text(json.dumps(rejected, indent=2), encoding='utf-8')
    print(f'Exported {len(reviewed)}/{len(manifest["assets"])} assets; rejected {len(rejected)} opaque masters')
    if rejected or len(reviewed) != len(manifest['assets']):
        raise SystemExit(1)

if __name__ == '__main__':
    main()
