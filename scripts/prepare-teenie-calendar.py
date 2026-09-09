"""Export the Memoping calendar artwork, preserving generated transparency."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    record = ROOT / 'docs/assets/teenie-theme-generation/control-calendar.json'
    entry = json.loads(record.read_text(encoding='utf-8'))
    with Image.open(entry['source']) as source:
        assert source.mode == 'RGBA', 'Calendar source must have real transparency'
        alpha = source.getchannel('A')
        assert alpha.getextrema() == (0, 255)
        clear = alpha.histogram()[0] / (source.width * source.height)
        assert clear >= 0.1
        assert all(alpha.getpixel(point) <= 2 for point in (
            (0, 0), (source.width - 1, 0),
            (0, source.height - 1), (source.width - 1, source.height - 1)
        ))
        source.thumbnail(tuple(entry['size']), Image.Resampling.LANCZOS)
        target = ROOT / entry['output']
        source.save(target, 'WEBP', quality=78, method=4, exact=True)
        with Image.open(target) as exported:
            assert exported.getchannel('A').tobytes() == source.getchannel('A').tobytes()
        entry.update(status='exported', exportedSize=list(source.size),
                     bytes=target.stat().st_size,
                     sourceSha256=hashlib.sha256(Path(entry['source']).read_bytes()).hexdigest(),
                     alpha={'range': [0, 255], 'clearFraction': round(clear, 3)})
    record.write_text(json.dumps(entry, indent=2) + '\n', encoding='utf-8')
    manifest_path = ROOT / 'docs/assets/teenie-theme-artwork.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['assets'] = [entry if item['id'] == entry['id'] else item for item in manifest['assets']]
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f"Exported Memoping calendar: {entry['exportedSize']}, alpha preserved")


if __name__ == '__main__':
    main()
