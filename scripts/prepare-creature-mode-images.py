"""Encode the generated game-mode icons as WebP without changing their alpha."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest_path = root / 'docs/assets/creature-mode-artwork.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for job in manifest['jobs']:
    destination = root / job['destination']
    assert destination.resolve().is_relative_to(root / 'src/assets/creature-mode-icons')
    with Image.open(job['source']) as original:
        assert original.mode == 'RGBA', f"Opaque source: {job['id']}"
        alpha = original.getchannel('A')
        width, height = original.size
        assert alpha.getextrema() == (0, 255), job['id']
        assert alpha.histogram()[0] >= width * height * 0.15, job['id']
        assert all(alpha.getpixel(corner) <= 2 for corner in (
            (0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)
        )), job['id']
        destination.parent.mkdir(parents=True, exist_ok=True)
        original.save(destination, format='WEBP', quality=90, method=6, exact=True)
        with Image.open(destination) as packaged:
            assert packaged.getchannel('A').tobytes() == alpha.tobytes(), job['id']
        job['transparencyVerified'] = True
        print(f"Exported {job['id']}", flush=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
