# Continue and sol retry — Member 1 handoff

This checkpoint implements the save/retry modules and automated checks, not the title/Continue screen or complete gameplay. It makes no NASA request and does not change Member 2's API types or Member 4's UI components.

## Entry points

| File                            | Purpose                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/services/storage.ts`       | `createSaveEnvelope`, `createMissionStorage`, storage modes and overwrite/stale-write results.           |
| `src/engine/save-validation.ts` | `readSave`, `prepareForContinue`, structural/rule checks and optional scene-cursor registry validation.  |
| `src/engine/retry.ts`           | `createRetrySession`: capture/restore one sol-start snapshot in memory only.                             |
| `src/engine/contracts.ts`       | `SaveEnvelope` now includes the already-specified `runId`. API request/response contracts are unchanged. |

The app creates a run ID once for a new mission and keeps it for Continue and retry. A new mission gets a different ID. This identifier is not a schedule seed. Dates and current content version are supplied by the caller.

## Store and restore

1. Create a storage instance with the current `contentVersion`. It defaults to browser `localStorage`; tests can inject a `StorageAdapter`, and `storage: null` explicitly chooses memory-only behavior.
2. Build an envelope from the state **after** a durable transition using `createSaveEnvelope({ runId, state, checkpoint, savedAt, cursor })`.
3. Call `save(envelope)` and inspect its result. `saved` includes `mode: persistent | memory`; `confirmation_required` means a different unfinished run exists. Only save again with `{ replaceUnfinished: true }` after the human confirms. Cancellation leaves progress intact.
4. On Continue, call `loadActive()`. `ready` includes a validated cloned save; `empty` means no unfinished mission; `invalid` or `incompatible` needs the friendly restart message. These conditions are not silently reinterpreted or migrated.
5. `prepareForContinue` normalizes WALKING to WALK_SELECT and clears an uncommitted mini-game completion marker while retaining its selected choice. It never applies solar generation, cargo bonuses, choice effects or upkeep. Resume presentation from the validated cursor/current phase, not by launching the mission again.
6. Pass `isKnownCursor` from the scene registry once the scene player exists. Without it, cursor shape/event/variant are checked but unknown nonempty step names cannot yet be resolved against a real timeline. The UI integration must supply this callback before claiming complete scene-step validation.

Durable checkpoints: `launch`, `sol_start`, `choice_result`, `night`, `ending`. Resource-engine phase semantics are in `ENGINE_HANDOFF.md`. A launch/sol-start envelope is pre-choice; a choice-result envelope is RESULT/REAL_CARD; NIGHT means upkeep has already committed; an ending envelope is ENDED.

The validator checks schema/content versions, dates, run ID, known IDs, meter ranges, unique valid cargo and recomputed modifiers, fixed schedule, solar snapshot consistency, sequential history/branch flags, future pending effects and phase/checkpoint consistency. Unknown state fields are rejected rather than accidentally saving keys or arbitrary UI data. UI settings/presentation state do not belong as extra fields inside `GameState`.

## Failure and stale-write behavior

- Storage access is wrapped in try/catch. After a read/write/remove error, the active store stays in memory mode for that session. `mode` must be reflected in save-status/Settings copy; don't promise progress survives closing the browser.
- In-memory state is authoritative after a failed write. A later read cannot replace it with an older on-disk save. Clearing progress also keeps an in-memory tombstone when removal fails.
- An older checkpoint of the same run cannot overwrite a newer committed resource transition; `save` returns `stale`. Step-ID guards in the scene player are still needed for stale callbacks within the same presentation phase.
- An ending is retained under `mms.lastRun` and removed from `mms.activeRun`. Completed missions do not become unfinished Continue missions. A matching completed report suppresses an old active copy if removal partially failed.
- This module owns only those two mission keys. It does not modify settings, the photo album, NASA cache or debrief cache.

## Sol-start retry

- Create one `createRetrySession()` for the active application session.
- Capture immediately after sol-start effects, in BRIEFING, with the event's entry cursor: `capture(runId, state, cursor)`.
- For a gentle ending on that same run and sol, `restore(runId, failedState)` returns a cloned snapshot. It retains the original cargo, NASA input and already-applied start generation. It removes the failed choice/history effects by restoring the pre-choice state.
- If a snapshot is returned, save its restored state/cursor as `sol_start` with `{ retrySol: true }`. This explicitly clears the superseded failure report so it cannot hide the resumed mission. Only use this option after an actual in-session restore.
- A successful ending, different run/sol or fresh retry-session instance returns no snapshot. Hide/disable the retry-this-sol action when unavailable. Browser reopening does not recreate a retry snapshot; durable Continue still works separately.
- Failed or completed runs cannot be resurrected by a late ordinary autosave; it returns `stale` unless this explicit gentle-ending retry path is used.

## Verification and remaining integration

The automated suite exercises reload-equivalent store recreation after launch, walking, mini-game, result and night; corrupt/incompatible data; bad IDs/ranges/modifiers; blocked/quota/removal failures; overwrite cancellation; final reports; explicit retry and stale autosaves. Minute-precision observation timestamps are preserved without inventing extra precision.

Actual browser button wiring, close/reopen/manual playthroughs and scene-registry integration remain for the scene player/UI checkpoint. This module is not a claim that the entire game is offline-capable. No database or backend persistence is added.
