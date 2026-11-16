"""Regenerate card-sized artwork from the original PNGs (requires Pillow)."""

from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
sources = [
    *root.glob("src/assets/themes/*/practice-*.png"),
    *root.glob("src/assets/rewards/claw-game-*.png"),
]
for source in sources:
    with Image.open(source) as image:
        for width in (256, 768):
            resized = image.copy()
            resized.thumbnail((width, width), Image.Resampling.LANCZOS)
            suffix = "" if width == 768 else "-256"
            target = source.with_name(f"{source.stem}{suffix}.webp")
            resized.save(target, "WEBP", quality=88, method=6)
            print(f"{target.relative_to(root)}: {target.stat().st_size} bytes")
