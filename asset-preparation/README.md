# Artwork sources and game exports

`asset-preparation/` keeps original artwork and review previews. Its category folders match the game: `bg`, `buildings`, `characters`, `cargo`, `minigames` and `overlays`. Existing character source/preview subfolders remain intact. Original files are organized by these categories; a separate member-number folder is unnecessary.

`public/assets/` contains the smaller PNGs the website will load. Do not replace an original master with a game export. The two folders serve different purposes; they should not both contain identical large deliveries.

`export-manifest.json` records the source path, original SHA-256, source size, physical PNG `size`, `logical_size` and horizontal frame count for the 62 Member 2–4 images. Robo's seven original files are outside this batch and unchanged. Creator, prompt and rights information still belongs in `asset-log.md`; the manifest does not establish ownership or a license.

Mixed resolutions approved November 13: nine crew portraits are 384x384; Commander/Kai/Mei map sheets use 96x128 cells; the outpost rover and Curiosity are 128x96; eight cargo icons are 128x128. Other exports retain their previous sizes. Logical dimensions preserve the original layout contract. For example, the Commander walk sheet is physically 384x128 with four 96x128 cells but still represents a logical 96x32 sheet with four 24x32 cells. Rendering must slice using physical cells and display using logical size/scene scale; never assume every PNG pixel is one world pixel.

From the project root, with Python and Pillow available:

```powershell
python scripts/prepare_assets.py
python scripts/prepare_assets.py --check
```

The exporter uses the approved physical export sizes, nearest-neighbor resizing and lossless PNG compression. Objects retain their aspect ratio with centered padding. Sheets are split into equal source cells and each cell is fitted into its specified output cell; it does not stretch a whole sheet to a different aspect ratio. The two tiny effect sheets use the existing pixel-sized 4x previews as export inputs so their fading frames survive downsampling; their high-resolution masters are still preserved and recorded. Manifest settings now also support border-connected checkerboard removal, isolated-speckle cleanup, frame registration, and frost alpha cleanup. These opt-in steps are deterministic; no artwork is regenerated. Rerunning exports replaces the runtime copies, so later art fixes should be made in the source and the manifest updated deliberately.

**Current status (November 13): transparency and sprite registration pass complete.** Fourteen Member 2 cutouts have real alpha; the remaining five skies stay opaque and the already-transparent dusty panels stay intact. Six Commander/crew assets use stable head/foot registration at physical `(48,120)` / logical `(12,30)`. The four-direction rover uses a centered `(12,12)` pivot. Leak/patch overlays share `(16,16)` with verified patch coverage. Frost has reduced opacity and a fully clear safe center. Source hashes and retained cutout colors are verified; originals are untouched.

Run `python scripts/check_asset_cleanup.py` for transparency, anchor, patch-coverage and frost checks in addition to the exporter check. Visual QA includes light/dark mattes, a provisional outpost composite and animation-frame previews. These do not replace final in-game/mobile review. Plating fit, panel design/perspective mismatches and outdoor helmet edits remain separate artwork tasks. High-resolution masters are preserved if a later approved export size is needed.
