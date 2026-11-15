"""Prepare PNG game exports from preserved masters. Requires Pillow.

Run from any directory: python scripts/prepare_assets.py
Validation only: python scripts/prepare_assets.py --check
Cleanup and registration are opt-in manifest settings. Originals are never changed.
"""
import argparse
import hashlib
import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "asset-preparation/export-manifest.json"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def local_path(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError(f"Path outside project: {relative}")
    return path


def fit(image, size):
    """Preserve aspect ratio and padding; never auto-trim the artwork."""
    ratio = min(size[0] / image.width, size[1] / image.height)
    fitted = image.resize(
        (max(1, round(image.width * ratio)), max(1, round(image.height * ratio))),
        Image.Resampling.NEAREST,
    )
    result = Image.new("RGBA", size)
    # Paste preserves RGBA values, including partially transparent pixels.
    result.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return result


def clean_background(image, settings):
    """Flood only border-connected checker colors; never erase all grey globally."""
    image = image.copy()
    pixels = image.load()
    width, height = image.size
    seen = set()
    queue = deque([(x, y) for x in range(width) for y in (0, height - 1)])
    queue.extend((x, y) for y in range(height) for x in (0, width - 1))
    while queue:
        x, y = queue.popleft()
        if not (0 <= x < width and 0 <= y < height) or (x, y) in seen:
            continue
        seen.add((x, y))
        red, green, blue, alpha = pixels[x, y]
        if alpha and not (
            max(red, green, blue) - min(red, green, blue) <= settings["max_chroma"]
            and min(red, green, blue) >= settings["min_channel"]
        ):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    # Residual one-pixel screenshot speckles are detached from the object.
    remaining = {(x, y) for y in range(height) for x in range(width) if pixels[x, y][3]}
    while remaining:
        component = [remaining.pop()]
        queue = deque(component)
        while queue:
            x, y = queue.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbor = (x + dx, y + dy)
                    if neighbor in remaining:
                        remaining.remove(neighbor)
                        component.append(neighbor)
                        queue.append(neighbor)
        if len(component) <= settings.get("remove_islands_up_to", 0):
            for point in component:
                pixels[point] = (0, 0, 0, 0)
    assert image.getchannel("A").getbbox(), "Cleanup removed entire subject"
    return image


def register_sprite(image, size, settings):
    """Use a stable head/foot anchor or center pivot, with no limb redrawing."""
    mask = image.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    bounds = mask.getbbox()
    assert bounds, "Empty source sprite"
    subject = image.crop(bounds)
    if settings["mode"] == "feet":
        height = settings["subject_height"]
        scale = height / subject.height
        width = round(subject.width * scale)
        head = mask.crop(bounds).crop((0, 0, subject.width, max(1, round(subject.height * 0.4)))).getbbox()
        head_center = (head[0] + head[2]) / 2
        left = round(settings["anchor"][0] - head_center * scale)
        top = settings["anchor"][1] - height
    else:
        scale = min(settings["visible_size"][0] / subject.width, settings["visible_size"][1] / subject.height)
        width, height = max(1, round(subject.width * scale)), max(1, round(subject.height * scale))
        left = round(settings["anchor"][0] - width / 2)
        top = round(settings["anchor"][1] - height / 2)
    assert 0 <= left and left + width <= size[0] and 0 <= top and top + height <= size[1], "Sprite would clip"
    result = Image.new("RGBA", size)
    result.paste(subject.resize((width, height), Image.Resampling.NEAREST), (left, top))
    return result


def finish_alpha(image, settings):
    image = image.copy()
    alpha = image.getchannel("A")
    if "opacity" in settings:
        factor = settings["opacity"]
        alpha = alpha.point(lambda value: round(value * factor) if value > 4 else 0)
    if "clear_rect" in settings:
        alpha.paste(0, tuple(settings["clear_rect"]))
    image.putalpha(alpha)
    return image


def export_image(image, entry):
    if "background_cleanup" in entry:
        image = clean_background(image, entry["background_cleanup"])
    size = tuple(entry["size"])
    frames = entry["frames"]
    if frames == 1:
        if "registration" in entry:
            return register_sprite(image, size, entry["registration"])
        if entry["output"].endswith(("wire_board.png", "air_module_cutaway.png", "frost_corners.png")):
            # Full-canvas backgrounds/overlays register to the task or scene.
            result = image.resize(size, Image.Resampling.NEAREST)
            return finish_alpha(result, entry["alpha_cleanup"]) if "alpha_cleanup" in entry else result
        return fit(image, size)
    assert size[0] % frames == 0
    cell_size = (size[0] // frames, size[1])
    result = Image.new("RGBA", size)
    for frame in range(frames):
        left = round(frame * image.width / frames)
        right = round((frame + 1) * image.width / frames)
        source_cell = image.crop((left, 0, right, image.height))
        cell = register_sprite(source_cell, cell_size, entry["registration"]) if "registration" in entry else fit(source_cell, cell_size)
        result.paste(cell, (frame * cell_size[0], 0))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    assets = json.loads(MANIFEST.read_text(encoding="utf-8"))["assets"]
    # Check every preserved source before writing any export.
    for entry in assets:
        source = local_path(entry["source"])
        assert sha(source) == entry["source_sha256"], f"Master changed: {source}"
        with Image.open(source) as image:
            assert list(image.size) == entry["source_size"]
        if "export_source" in entry:
            assert sha(local_path(entry["export_source"])) == entry["export_source_sha256"]
    total = 0
    for entry in assets:
        source, output = local_path(entry["source"]), local_path(entry["output"])
        assert source.is_relative_to(ROOT / "asset-preparation")
        assert output.is_relative_to(ROOT / "public/assets")
        export_source = local_path(entry.get("export_source", entry["source"]))
        with Image.open(export_source) as image:
            expected = export_image(image.convert("RGBA"), entry)
        if not args.check:
            output.parent.mkdir(parents=True, exist_ok=True)
            expected.save(output, format="PNG", optimize=True, compress_level=9)
        with Image.open(output) as actual:
            actual.load()
            assert actual.format == "PNG" and list(actual.size) == entry["size"], str(output)
            # Exact decoded-pixel equality proves compression added no changes.
            assert actual.convert("RGBA").tobytes() == expected.tobytes(), str(output)
            if entry["frames"] > 1:
                cell_width = actual.width // entry["frames"]
                for frame in range(entry["frames"]):
                    cell = actual.convert("RGBA").crop((frame * cell_width, 0, (frame + 1) * cell_width, actual.height))
                    assert cell.getchannel("A").getbbox(), f"Empty frame {frame}: {output}"
        total += output.stat().st_size
        assert sha(source) == entry["source_sha256"], f"Master modified: {source}"
    print(f"{'Verified' if args.check else 'Exported and verified'} {len(assets)} PNGs: {total:,} bytes ({total / 1048576:.2f} MiB).")
    print("All original hashes preserved. Manifest cleanup and registration verified.")


if __name__ == "__main__":
    main()
