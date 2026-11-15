"""Check opt-in transparency and registration without modifying artwork."""
import json
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]


def solid_bounds(image):
    return image.getchannel("A").point(lambda value: 255 if value >= 128 else 0).getbbox()


def main():
    entries = json.loads((ROOT / "asset-preparation/export-manifest.json").read_text())["assets"]
    cleaned = registered = 0
    for entry in entries:
        path = ROOT / entry["output"]
        image = Image.open(path).convert("RGBA")
        if "background_cleanup" in entry:
            cleaned += 1
            alpha = image.getchannel("A")
            assert alpha.getextrema() == (0, 255), path
            assert all(alpha.getpixel(point) == 0 for point in [(0, 0), (image.width - 1, 0)]), path
            source = Image.open(ROOT / entry["source"]).convert("RGBA")
            assert source.size == image.size
            # A retained source pixel keeps its exact color. Cleanup only removes alpha.
            for original, actual in zip(source.get_flattened_data(), image.get_flattened_data()):
                if actual[3]:
                    assert original == actual, f"Retained pixel recolored: {path}"
        if "registration" in entry:
            registered += 1
            settings = entry["registration"]
            width = image.width // entry["frames"]
            for frame in range(entry["frames"]):
                cell = image.crop((frame * width, 0, (frame + 1) * width, image.height))
                bounds = solid_bounds(cell)
                assert bounds and 0 < bounds[0] and bounds[2] < width, path
                if settings["mode"] == "feet":
                    assert bounds[3] == settings["anchor"][1], f"Foot baseline: {path}, frame {frame}"
                    assert bounds[3] - bounds[1] == settings["subject_height"], path
                else:
                    center = ((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2)
                    assert all(abs(a - b) <= 1 for a, b in zip(center, settings["anchor"])), path
        if "alpha_cleanup" in entry:
            alpha = image.getchannel("A")
            assert not alpha.crop(tuple(entry["alpha_cleanup"]["clear_rect"])).getbbox(), path
            assert alpha.getextrema()[1] <= 166, path
    marker = Image.open(ROOT / "public/assets/minigames/leak_marker.png").convert("RGBA").getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    patch = Image.open(ROOT / "public/assets/minigames/patch_sticker.png").convert("RGBA").getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    assert not ImageChops.subtract(marker, patch).getbbox(), "Patch leaves the crack exposed"
    for name in ("sky_day", "sky_dusk", "sky_night", "sky_dust", "sky_dawn"):
        assert Image.open(ROOT / f"public/assets/bg/{name}.png").convert("RGBA").getchannel("A").getextrema() == (255, 255)
    for name in ("wire_board", "air_module_cutaway"):
        assert Image.open(ROOT / f"public/assets/minigames/{name}.png").convert("RGBA").getchannel("A").getextrema() == (255, 255)
    print(f"Passed: {cleaned} alpha cutouts; {registered} registered assets; patch coverage; frost safe area; opaque skies/task backings.")


if __name__ == "__main__":
    main()
