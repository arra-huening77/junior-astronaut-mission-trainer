# Preparation import — provenance and current status

This clean team folder imports selected existing materials from `D:/Projects/tuesday`. It is not a claim that those materials were first created during the event.

- Import recorded at UTC: **2026-11-14 02:59:53 UTC**.
- Import recorded at Asia/Rangoon: **2026-11-14 09:29:53 +06:30**.
- The target repository already contained initial commit `b10d781`. Its `.git` and configured origin are preserved. No old `.git`, old commits or old branches are copied from `tuesday`.
- Existing source modification times are retained by the selected-file copy where supported. Import timestamps are records of this copy, not authorship proof or competition eligibility certification.
- No Git commit date, author date or history is rewritten. No commit, push, merge or deployment is performed by the import itself.

## Included

- Confirmed README/specification, detailed team workflow and SVG, current story Markdown and facts ledger.
- New `AGENTS.md` orientation, this provenance note and a JSON checksum/source inventory.
- Sixty-two prepared runtime PNGs; original artwork needed to reproduce those exports; the two tiny effect inputs used by the exporter.
- Seven original Robo images, plus the existing helmeted Mei source for later review.
- Team setting reference renamed to `asset-preparation/references/setting-reference.jpg`. It is a visual reference, not a runtime NASA photograph.
- Existing `prepare_assets.py` and `check_asset_cleanup.py`, explicitly imported as prior asset utilities. These contain preparation code, not a newly built mission engine.
- Empty frontend/backend/content/test/teacher/category directories and an empty `.env.example`. No credentials.

## Excluded

- The four individual member asset briefs, duplicate/source PDFs, old member-number directories and the old repository's Git metadata.
- Temporary audit sheets, comparison previews, intermediate scripts, generated review GIFs, dependency/build caches and unrelated source duplicates.
- Any local `.env` secrets. This copy includes only the empty configuration example.

## Still to do

The game is not runnable: bootstrap, contracts, engine, timelines, UI, API functions, mini-games, Teacher Pack and deployment are implementation tasks. The story contains thirteen prepared versions but still needs factual verification, data filling, runtime conversion and playtesting. The source PDFs remain in the untouched preparation backup rather than this handoff.

The 62 exported images passed source-hash/dimension/frame checks and cleanup checks at import. The seven Robo masters have not been integrated into runtime assets by this import. Audio and curated NASA photo files remain to be acquired/verified. Composition/style and the previously identified artwork edits are not magically completed by moving files.

`preparation-import.json` lists copied preparation files, original/import SHA-256 values and which document prose was updated for the new handoff. Updated prose concerns locations/status only; confirmed game decisions and numbers are not intentionally changed.

To begin, open `AGENTS.md` and then `TEAM_WORKFLOW.md` in the new repository. Each person uses their own clone or worktree and task branch. A filesystem folder does not isolate two agents working on the same checkout.
