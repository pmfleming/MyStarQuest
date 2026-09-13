"""Export approved generated maps without changing their illustration or alpha.

Run after setting each manifest asset's source. --only accepts asset keys.
Reject opaque output (including painted checkerboards) instead of installing it.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', nargs='+')
parser.add_argument('--verify-only', action='store_true')
args = parser.parse_args()
manifest = json.loads((ROOT / 'docs/assets/expanded-region-images.json').read_text(encoding='utf-8'))
checks = []
for item in manifest['assets']:
    if args.verify_only or (args.only and item['key'] not in args.only):
        continue
    source = Image.open(item['source'])
    if source.mode != 'RGBA' or source.getchannel('A').getextrema()[0] != 0:
        raise ValueError(f"{item['key']}: regenerate with real transparency before exporting")
    # Format/size conversion only; retain the generator's original transparency.
    artwork = ImageOps.contain(source, (512, 512), Image.Resampling.LANCZOS)
    destination = ROOT / item['destination']
    destination.parent.mkdir(parents=True, exist_ok=True)
    artwork.save(destination, 'WEBP', quality=80, method=6)
    exported = Image.open(destination)
    assert exported.mode == 'RGBA' and exported.getchannel('A').getextrema()[0] == 0
    checks.append(item['key'])
exported_count = len(checks)
# A partial re-export still produces a complete installed-set report.
checks = []
for item in manifest['assets']:
    destination = ROOT / item['destination']
    installed = Image.open(destination)
    assert installed.mode == 'RGBA' and installed.getchannel('A').getextrema()[0] == 0
    checks.append({'key': item['key'], 'size': list(installed.size), 'alpha': True,
                   'bytes': destination.stat().st_size})
review = ROOT / 'output/expanded-region-review'
review.mkdir(parents=True, exist_ok=True)
(review / 'export-checks.json').write_text(json.dumps(checks, indent=2), encoding='utf-8')
print(json.dumps({'exported': exported_count, 'validated': len(checks),
                  'bytes': sum(row['bytes'] for row in checks)}))
