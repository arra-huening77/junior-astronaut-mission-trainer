import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PatchLeakProps } from './PatchLeak';
import {
  getPatchLeakTierConfig,
  sizeLabel,
  type LeakSpotDef,
  type PatchLeakDifficulty,
  type PatchRotation,
  type PatchSizeTier,
} from './_lib/patchLeakTiers';
import { useMiniGameResult } from './_lib/useMiniGameResult';

type LeakStage = 'scan' | 'patch' | 'pressure';

type AdvancedProps = PatchLeakProps & { difficulty: PatchLeakDifficulty };

export function PatchLeakAdvanced({
  instruction,
  reduceMotion,
  onResult,
  sol = 8,
  difficulty,
}: AdvancedProps) {
  const config = useMemo(
    () => getPatchLeakTierConfig(difficulty)!,
    [difficulty],
  );
  const { spots, realLeakCount, traySizes, rotationSizes } = config;
  const spotCount = spots.length;

  const titleId = useId();
  const { ended, celebrating, finish, finishedRef } = useMiniGameResult(
    onResult,
    reduceMotion,
  );

  const scanHint =
    config.difficulty === 3
      ? 'Robo says: scan every marker. One hiss may be a decoy — trust the readings.'
      : 'Robo says: scan each marker. Note the shape and size for your patch tray.';
  const patchHint =
    config.rotationSizes.length > 0
      ? 'Pick size, rotate large patches when needed, then seal each leak.'
      : PATCH_HINT_GENERIC;

  const stageRef = useRef<LeakStage>('scan');
  const scannedRef = useRef<string[]>([]);
  const sealedRef = useRef<string[]>([]);
  const selectedPatchRef = useRef<PatchSizeTier | null>(null);
  const patchRotationRef = useRef<PatchRotation>(0);

  const [stage, setStage] = useState<LeakStage>('scan');
  const [scanned, setScanned] = useState<string[]>([]);
  const [sealed, setSealed] = useState<string[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<PatchSizeTier | null>(null);
  const [patchRotation, setPatchRotation] = useState<PatchRotation>(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [toast, setToast] = useState(scanHint);
  const [hissId, setHissId] = useState<string | null>(null);
  const [gaugeStable, setGaugeStable] = useState(false);

  const scannedSet = useMemo(() => new Set(scanned), [scanned]);
  const sealedSet = useMemo(() => new Set(sealed), [sealed]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    scannedRef.current = scanned;
  }, [scanned]);
  useEffect(() => {
    sealedRef.current = sealed;
  }, [sealed]);
  useEffect(() => {
    selectedPatchRef.current = selectedPatch;
  }, [selectedPatch]);
  useEffect(() => {
    patchRotationRef.current = patchRotation;
  }, [patchRotation]);

  function spotById(id: string) {
    return spots.find((s) => s.id === id);
  }

  function realSpots() {
    return spots.filter((s) => !s.decoy);
  }

  function countRealScanned() {
    return scannedRef.current.filter((id) => !spotById(id)?.decoy).length;
  }

  function nextSealTarget(): LeakSpotDef | undefined {
    const nextOrder = sealedRef.current.length + 1;
    return realSpots().find((s) => s.sealOrder === nextOrder);
  }

  function enterPatchPhase() {
    setStage('patch');
    setToast(patchHint);
  }

  function enterPressurePhase() {
    setStage('pressure');
    setToast(
      `All ${realLeakCount} leaks are sealed. Press CHECK PRESSURE to verify the air module.`,
    );
  }

  function runPressureTest() {
    if (finishedRef.current || stageRef.current !== 'pressure') return;
    if (sealedRef.current.length < realLeakCount) {
      setToast('Seal every real leak before checking pressure.');
      return;
    }
    setGaugeStable(true);
    setToast('Pressure stable! The oxygen line is holding.');
    finish('done');
  }

  function pulseHiss(leakId: string) {
    if (reduceMotion) return;
    setHissId(leakId);
    window.setTimeout(() => setHissId(null), 360);
  }

  function scanLeak(leakId: string) {
    if (finishedRef.current || stageRef.current !== 'scan') return;
    const leak = spotById(leakId);
    if (!leak) return;

    if (scannedRef.current.includes(leakId)) {
      setToast(`${leak.label} is already scanned. Check another marker.`);
      return;
    }

    const next = [...scannedRef.current, leakId];
    scannedRef.current = next;
    setScanned(next);
    pulseHiss(leakId);

    if (leak.decoy) {
      setToast('No leak here — Robo says ignore this hiss and keep scanning.');
      return;
    }

    const realCount = countRealScanned();
    setToast(
      realCount >= realLeakCount
        ? `${leak.label} needs a ${sizeLabel(leak.size)} patch (${leak.shape} shape). Open the tray.`
        : `${leak.label}: ${sizeLabel(leak.size)} ${leak.shape} leak. Scan ${realLeakCount - realCount} more.`,
    );

    if (realCount >= realLeakCount) {
      enterPatchPhase();
    }
  }

  function selectPatch(size: PatchSizeTier) {
    if (finishedRef.current || stageRef.current !== 'patch') return;
    selectedPatchRef.current = size;
    setSelectedPatch(size);
    const rotateNote = rotationSizes.includes(size)
      ? ' Use Rotate if the shape needs 90°.'
      : '';
    setToast(`${sizeLabel(size)} patch selected.${rotateNote}`);
  }

  function cycleRotation() {
    if (finishedRef.current || stageRef.current !== 'patch') return;
    const next = patchRotationRef.current === 0 ? 90 : 0;
    patchRotationRef.current = next;
    setPatchRotation(next);
    setToast(`Patch rotation set to ${next} degrees.`);
  }

  function applyPatch(leakId: string) {
    if (finishedRef.current || stageRef.current !== 'patch') return;
    const leak = spotById(leakId);
    if (!leak || leak.decoy) {
      setToast('No leak to seal at this spot.');
      return;
    }

    if (!scannedRef.current.includes(leakId)) {
      setToast('Scan this leak first so Robo can read its size.');
      return;
    }

    if (sealedRef.current.includes(leakId)) {
      setToast(`${leak.label} is already sealed. Pick another leak.`);
      return;
    }

    if (config.enforceSealOrder && leak.sealOrder !== undefined) {
      const expected = nextSealTarget();
      if (expected && expected.id !== leak.id) {
        setToast(
          `Robo says: pressure is highest at ${expected.pressureZone} — seal ${expected.label} next.`,
        );
        pulseHiss(leakId);
        return;
      }
    }

    const patch = selectedPatchRef.current;
    if (!patch) {
      setToast('Choose a patch size from the tray first.');
      return;
    }

    if (patch !== leak.size) {
      setToast(
        `Wrong size for ${leak.label}. Robo scan read ${sizeLabel(leak.size)}.`,
      );
      pulseHiss(leakId);
      return;
    }

    if (
      rotationSizes.includes(leak.size) &&
      leak.requiredRotation !== patchRotationRef.current
    ) {
      setToast(
        `Rotate the patch to ${leak.requiredRotation}° for this ${leak.shape} leak.`,
      );
      pulseHiss(leakId);
      return;
    }

    const next = [...sealedRef.current, leakId];
    sealedRef.current = next;
    setSealed(next);
    selectedPatchRef.current = null;
    setSelectedPatch(null);
    patchRotationRef.current = 0;
    setPatchRotation(0);

    const nextTarget = nextSealTarget();
    setToast(
      next.length >= realLeakCount
        ? enterPressureToast()
        : nextTarget
          ? `${leak.label} sealed. Pressure cue: ${nextTarget.label} (${nextTarget.pressureZone}) is next.`
          : `${leak.label} sealed. ${next.length} of ${realLeakCount} done.`,
    );

    if (next.length >= realLeakCount) {
      enterPressurePhase();
    }
  }

  function enterPressureToast() {
    return `All ${realLeakCount} leaks sealed. ${PRESSURE_READY}`;
  }

  function activateLeak(leakId: string) {
    if (stageRef.current === 'scan') scanLeak(leakId);
    else if (stageRef.current === 'patch') applyPatch(leakId);
  }

  function openLeaksForFocus() {
    if (stageRef.current === 'scan') {
      return spots.filter((l) => !scannedRef.current.includes(l.id));
    }
    if (stageRef.current === 'patch') {
      return realSpots().filter(
        (l) =>
          scannedRef.current.includes(l.id) &&
          !sealedRef.current.includes(l.id),
      );
    }
    return [];
  }

  useLayoutEffect(() => {
    const maxKey = spotCount;

    function bypassTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          'input, textarea, select, .mg-skip, .ui-preview__dev, [role="checkbox"]',
        ),
      );
    }

    function onKey(event: KeyboardEvent) {
      if (finishedRef.current) return;
      if (bypassTarget(event.target)) return;

      if (stageRef.current === 'pressure') {
        if (event.key === 'p' || event.key === 'P') {
          event.preventDefault();
          runPressureTest();
        }
        return;
      }

      if (stageRef.current === 'patch') {
        if (event.key === 's' || event.key === 'S') {
          event.preventDefault();
          selectPatch('small');
          return;
        }
        if (event.key === 'm' || event.key === 'M') {
          event.preventDefault();
          selectPatch('medium');
          return;
        }
        if (event.key === 'l' || event.key === 'L') {
          event.preventDefault();
          selectPatch('large');
          return;
        }
        if (event.key === 'r' || event.key === 'R') {
          event.preventDefault();
          cycleRotation();
        }
      }

      const open = openLeaksForFocus();

      if (event.key >= '1' && event.key <= '9') {
        const idx = Number(event.key) - 1;
        if (idx >= maxKey) return;
        const leak = spots[idx];
        if (!leak) return;
        if (stageRef.current === 'scan') {
          if (scannedRef.current.includes(leak.id)) return;
        } else if (stageRef.current === 'patch') {
          if (leak.decoy) return;
          if (
            !scannedRef.current.includes(leak.id) ||
            sealedRef.current.includes(leak.id)
          ) {
            return;
          }
        } else {
          return;
        }
        event.preventDefault();
        const openIdx = open.findIndex((l) => l.id === leak.id);
        if (openIdx >= 0) setFocusIndex(openIdx);
        activateLeak(leak.id);
        return;
      }

      if (open.length === 0) return;

      let localFocus = Math.min(focusIndex, Math.max(0, open.length - 1));

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        localFocus = (localFocus + 1) % open.length;
        setFocusIndex(localFocus);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        localFocus = (localFocus - 1 + open.length) % open.length;
        setFocusIndex(localFocus);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const fromModule =
          event.target instanceof Element &&
          Boolean(event.target.closest('.mg-leak__module-wrap'));
        if (!fromModule) return;
        event.preventDefault();
        const leak = open[localFocus];
        if (leak) activateLeak(leak.id);
      }
    }

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  });

  const focusPool =
    stage === 'scan'
      ? spots.filter((l) => !scannedSet.has(l.id))
      : stage === 'patch'
        ? realSpots().filter(
            (l) => scannedSet.has(l.id) && !sealedSet.has(l.id),
          )
        : [];
  const focusLeakId =
    focusPool[Math.min(focusIndex, Math.max(0, focusPool.length - 1))]?.id;

  const realScanned = scanned.filter((id) => !spotById(id)?.decoy).length;
  const orderTarget = stage === 'patch' ? nextSealTarget() : undefined;

  const progressLabel =
    stage === 'scan'
      ? `Scanned ${realScanned} of ${realLeakCount} leaks`
      : stage === 'patch'
        ? `Sealed ${sealed.length} of ${realLeakCount} leaks`
        : `Pressure check ready`;

  return (
    <section
      className={[
        'mg-leak',
        celebrating ? 'mg-leak--won' : '',
        gaugeStable ? 'mg-leak--stable' : '',
        stage === 'pressure' ? 'mg-leak--testing' : '',
        stage === 'scan' ? 'mg-leak--scan' : '',
        config.difficulty === 3 ? 'mg-leak--advanced' : 'mg-leak--training',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
    >
      <div className="mg-leak__hud">
        <div className="mg-leak__chip">Sol {sol}</div>
        <div className="mg-leak__title-card">
          <span className="mg-leak__title-icon" aria-hidden="true" />
          <div>
            <h2 id={titleId}>Patch Leak</h2>
            <p>
              {config.difficulty === 3
                ? 'Follow pressure cues and orient patches carefully.'
                : 'Match patch sizes and rotate for large slit leaks.'}
            </p>
          </div>
        </div>
        <div className="mg-leak__chip" aria-label={progressLabel}>
          {stage === 'scan'
            ? `${realScanned} / ${realLeakCount} scanned`
            : stage === 'patch'
              ? `${sealed.length} / ${realLeakCount} sealed`
              : `${realLeakCount} / ${realLeakCount} sealed`}
        </div>
      </div>

      <div className="mg-leak__clues" aria-label="Training tier badge">
        <span className="mg-leak__clue-training">
          Training tier {config.difficulty}
        </span>
      </div>

      <div className="mg-leak__stage">
        <div
          className="mg-leak__module-wrap"
          role="group"
          aria-label={`Air module training tier ${config.difficulty}`}
        >
          <img
            className="mg-leak__module"
            src="/assets/minigames/air_module_cutaway.png"
            alt=""
            width={320}
            height={180}
            draggable={false}
          />

          {spots.map((leak, index) => {
            const isScanned = scannedSet.has(leak.id);
            const isSealed = sealedSet.has(leak.id);
            const isFocus = focusLeakId === leak.id;
            const showHiss =
              hissId === leak.id && !reduceMotion && !isSealed;
            const decoyScanned = leak.decoy && isScanned;
            return (
              <button
                key={leak.id}
                type="button"
                className={[
                  'mg-leak__spot',
                  `mg-leak__spot--shape-${leak.shape}`,
                  isSealed ? 'mg-leak__spot--patched' : 'mg-leak__spot--open',
                  isScanned && !isSealed ? 'mg-leak__spot--scanned' : '',
                  stage === 'scan' && !isScanned ? 'mg-leak__spot--scan' : '',
                  leak.decoy ? 'mg-leak__spot--decoy' : '',
                  decoyScanned ? 'mg-leak__spot--decoy-done' : '',
                  isFocus ? 'mg-leak__spot--focus' : '',
                  !isSealed && !reduceMotion && stage !== 'pressure'
                    ? 'mg-leak__spot--hiss'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ left: `${leak.x}%`, top: `${leak.y}%` }}
                aria-label={spotAria(leak, isScanned, isSealed)}
                disabled={
                  ended ||
                  stage === 'pressure' ||
                  (stage === 'scan' && isScanned) ||
                  (stage === 'patch' && (!isScanned || leak.decoy))
                }
                aria-disabled={
                  ended || stage === 'pressure' || isSealed || leak.decoy
                }
                onClick={() => {
                  const pool = openLeaksForFocus();
                  const openIdx = pool.findIndex((l) => l.id === leak.id);
                  if (openIdx >= 0) setFocusIndex(openIdx);
                  activateLeak(leak.id);
                }}
                onFocus={() => {
                  const pool = openLeaksForFocus();
                  const openIdx = pool.findIndex((l) => l.id === leak.id);
                  if (openIdx >= 0) setFocusIndex(openIdx);
                }}
                data-spot-index={index + 1}
              >
                <img
                  className="mg-leak__marker"
                  src={
                    isSealed
                      ? '/assets/minigames/patch_sticker.png'
                      : '/assets/minigames/leak_marker.png'
                  }
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                  style={
                    isSealed && rotationSizes.includes(leak.size)
                      ? { transform: `rotate(${leak.requiredRotation}deg)` }
                      : undefined
                  }
                />
                <span className="mg-leak__spot-tag" aria-hidden="true">
                  {isSealed
                    ? 'Sealed'
                    : isScanned
                      ? leak.decoy
                        ? 'Decoy'
                        : sizeLabel(leak.size)
                      : leak.label}
                </span>
                {showHiss ? (
                  <img
                    className="mg-leak__hiss"
                    src="/assets/overlays/hiss_puff.png"
                    alt=""
                    draggable={false}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {stage === 'patch' ? (
          <>
            {config.showPressureCues && orderTarget ? (
              <div
                className="mg-leak__pressure-order"
                aria-live="polite"
              >
                Pressure cue: seal <strong>{orderTarget.label}</strong> (
                {orderTarget.pressureZone} zone) next.
              </div>
            ) : null}
            <div
              className="mg-leak__tray"
              role="group"
              aria-label="Patch size tray"
            >
              {traySizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={[
                    'mg-leak__tray-btn',
                    selectedPatch === size ? 'mg-leak__tray-btn--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={ended}
                  aria-pressed={selectedPatch === size}
                  aria-label={`Select ${sizeLabel(size).toLowerCase()} patch`}
                  onClick={() => selectPatch(size)}
                >
                  {sizeLabel(size)} patch
                  <span className="mg-leak__tray-glyph" aria-hidden="true">
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="mg-leak__rotate-btn"
                disabled={ended}
                aria-label={`Rotate patch, currently ${patchRotation} degrees`}
                onClick={cycleRotation}
              >
                Rotate ({patchRotation}°)
              </button>
              <span className="mg-leak__tray-hint">
                Keys S / M / L, R to rotate, 1–{spotCount} for spots.
              </span>
            </div>
          </>
        ) : null}

        {stage === 'pressure' ? (
          <div
            className="mg-leak__pressure-panel"
            role="group"
            aria-label="Oxygen pressure gauge"
          >
            <div
              className={[
                'mg-leak__gauge',
                gaugeStable ? 'mg-leak__gauge--stable' : '',
                !reduceMotion && gaugeStable ? 'mg-leak__gauge--pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="mg-leak__gauge-label">O₂ pressure</span>
              <span className="mg-leak__gauge-readout" aria-hidden="true">
                {gaugeStable ? 'STABLE' : 'CHECK'}
              </span>
            </div>
            <button
              type="button"
              className="mg-leak__pressure-btn"
              disabled={ended || gaugeStable}
              onClick={runPressureTest}
            >
              Check pressure
            </button>
            <span className="mg-leak__tray-hint">
              Press P for check pressure (keyboard).
            </span>
          </div>
        ) : null}

        <p className="mg-leak__toast" role="status">
          {toast}
        </p>

        {celebrating ? (
          <div className="mg-leak__celebrate" role="status">
            <p>Air module sealed!</p>
            <span>Pressure is holding steady.</span>
          </div>
        ) : null}
      </div>

      <div className="mg-leak__footer">
        <p className="mg-leak__instruction">{instruction}</p>
        <button
          type="button"
          className="mg-skip"
          disabled={ended}
          onClick={() => finish('skipped')}
        >
          Skip
        </button>
      </div>
    </section>
  );
}

const PATCH_HINT_GENERIC =
  'Pick a patch size, then tap the matching leak. Use symbols and labels — not color alone.';
const PRESSURE_READY =
  'Press CHECK PRESSURE to verify the air module.';

function spotAria(leak: LeakSpotDef, isScanned: boolean, isSealed: boolean) {
  if (isSealed) {
    return `${leak.label}, sealed with ${sizeLabel(leak.size)} patch at ${leak.requiredRotation} degrees`;
  }
  if (leak.decoy && isScanned) {
    return `${leak.label}, decoy hiss, no leak`;
  }
  if (isScanned) {
    return `${leak.label}, scanned as ${sizeLabel(leak.size)} ${leak.shape} leak, tap to seal`;
  }
  return `${leak.label}, marker ${leak.shape} shape, tap to scan`;
}