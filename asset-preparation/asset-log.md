# Asset log

Record every asset, including drafts and real NASA photos. Keep original files and their real dates.

| Filename | Status | Creator / tool | Date | Prompt / reference | Edits | Source URL | License / permission / credit |
|---|---|---|---|---|---|---|---|

## Scripted cleanup — November 13, 2026

Original creator/tool and rights still need team records. These entries describe only the deterministic edits to runtime exports; original masters remain unchanged.

| Runtime file | Processing | Preserved original | Tool |
|---|---|---|---|
| `public/assets/bg/mars_ground.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/bg/mars_ground.png` | Python/Pillow; no AI generation |
| `public/assets/bg/mount_sharp.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/bg/mount_sharp.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/habitat.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/habitat.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/air_module.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/air_module.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/greenhouse.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/greenhouse.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/solar_panels_clean.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/solar_panels_clean.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/solar_panels_covered.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/solar_panels_covered.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/solar_panels_damaged.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/solar_panels_damaged.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/comms_dish.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/comms_dish.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/rover_garage_closed.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/rover_garage_closed.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/rover_garage_open.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/rover_garage_open.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/shelter_closed.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/shelter_closed.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/shelter_open.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/shelter_open.png` | Python/Pillow; no AI generation |
| `public/assets/buildings/supply_ship.png` | Border-connected checker removal; detached speckles removed; retained colors unchanged | `asset-preparation/buildings/supply_ship.png` | Python/Pillow; no AI generation |
| `public/assets/characters/commander_idle.png` | Frame foot/head registration | `asset-preparation/characters/commander_idle/generated-master.png` | Python/Pillow; no AI generation |
| `public/assets/characters/commander_walk.png` | Frame foot/head registration | `asset-preparation/characters/commander-actions/walk-master.png` | Python/Pillow; no AI generation |
| `public/assets/characters/commander_cheer.png` | Frame foot/head registration | `asset-preparation/characters/commander-actions/cheer-master.png` | Python/Pillow; no AI generation |
| `public/assets/characters/commander_concerned.png` | Frame foot/head registration | `asset-preparation/characters/commander-actions/concerned-master.png` | Python/Pillow; no AI generation |
| `public/assets/characters/kai_work.png` | Frame foot/head registration | `asset-preparation/characters/curiosity-and-work/kai_work-master.png` | Python/Pillow; no AI generation |
| `public/assets/characters/mei_work.png` | Frame foot/head registration | `asset-preparation/characters/curiosity-and-work/mei_work-master.png` | Python/Pillow; no AI generation |
| `public/assets/minigames/rover_top.png` | Centered pivot and normalized visible size | `asset-preparation/minigames/rover_top.png` | Python/Pillow; no AI generation |
| `public/assets/minigames/leak_marker.png` | Centered pivot and normalized visible size | `asset-preparation/minigames/leak_marker.png` | Python/Pillow; no AI generation |
| `public/assets/minigames/patch_sticker.png` | Centered pivot and normalized visible size | `asset-preparation/minigames/patch_sticker.png` | Python/Pillow; no AI generation |
| `public/assets/overlays/frost_corners.png` | Frost opacity reduced; center safe area cleared | `asset-preparation/overlays/frost_corners.png` | Python/Pillow; no AI generation |

## Curated NASA card media — November 14, 2026

Runtime metadata is authoritative in `src/content/photos.json`; card references are in `src/content/realMoments.json`. Sources and exact published credits were checked against the linked pages. The five ambiguous/mismatched files (Sol 1, drill, ISS, crater and finale) were replaced with the exact linked assets. The solar file was re-exported as JPEG because it contained WebP data under a `.jpg` name. The other five files closely match the official source images after resizing/recompression. No AI generation or redrawing was used. Previous replaced files are recoverable in Git and local ignored `tmp/photo-source-backup/`.

Use: educational/informational cards; preserve credits and do not imply endorsement. See [NASA media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/). This records source checks, not a blanket claim about every third-party asset or a completion claim for scientific fact verification.

| Runtime file | Source page | Published credit | Type |
|---|---|---|---|
| `/assets/photos/sol1-gale-crater.jpg` | https://science.nasa.gov/resource/layers-at-the-base-of-mount-sharp/ | NASA/JPL-Caltech/MSSS | photo |
| `/assets/photos/sol2-mars-night.jpg` | https://www.jpl.nasa.gov/images/pia19400-sunset-in-mars-gale-crater | NASA/JPL-Caltech/MSSS/Texas A&M Univ. | photo |
| `/assets/photos/sol3-dust-devil.jpg` | https://www.jpl.nasa.gov/images/pia24039-curiosity-spots-a-dust-devil-in-the-hills/ | NASA/JPL-Caltech/SSI | photo |
| `/assets/photos/sol4-rover-drill.jpg` | https://science.nasa.gov/photojournal/curiositys-first-sample-drilling/ | NASA/JPL-Caltech/MSSS | photo |
| `/assets/photos/sol5-earth-view.jpg` | https://www.jpl.nasa.gov/images/pia17936-bright-evening-star-seen-from-mars-is-earth | NASA/JPL-Caltech/MSSS/TAMU | photo |
| `/assets/photos/sol6-solar-flare.jpg` | https://www.nasa.gov/image-article/strong-solar-flare/ | NASA/SDO | photo |
| `/assets/photos/sol7-worn-wheel.jpg` | https://www.jpl.nasa.gov/images/pia17751-left-front-wheel-of-curiosity-rover-approaching-three-miles/ | NASA/JPL-Caltech/MSSS | photo |
| `/assets/photos/sol8-iss-leak.jpg` | https://www.nasa.gov/isam/robotic-external-leak-locator/ | NASA | photo |
| `/assets/photos/sol8-fresh-crater.jpg` | https://science.nasa.gov/photojournal/a-spectacular-new-martian-impact-crater/ | NASA/JPL-Caltech/Univ. of Arizona | photo |
| `/assets/photos/sol9-mars-frost.jpg` | https://www.jpl.nasa.gov/images/pia00571-ice-on-mars-utopia-planitia-again | NASA/JPL | photo |
| `/assets/photos/sol10-exploration-future.jpg` | https://www.nasa.gov/blogs/missions/2020/10/28/lunar-living-nasas-artemis-base-camp-concept/ | NASA | illustration |
