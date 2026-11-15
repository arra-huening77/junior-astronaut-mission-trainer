import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PatchLeakProps } from './PatchLeak';
import { useMiniGameResult } from './_lib/useMiniGameResult';

type LeakSize = 'small' | 'large';
type PatchSize = LeakSize;
type LeakStage = 'scan' | 'patch' | 'pressure';

const LEAK_COUNT = 3;

const LEAKS = [
  { id: 'leak-a', label: 'Leak A', x: 26, y: 34, size: 'small' as const },
  { id: 'leak-b', label: 'Leak B', x: 54, y: 62, size: 'large' as const },
  { id: 'leak-c', label: 'Leak C', x: 76, y: 38, size: 'small' as const },
] as const;

const SCAN_HINT =
  'Robo says: scan each hiss marker first. Learn if it needs a small or large patch.';
const PATCH_HINT =
  'Pick a patch size, then tap the matching leak. Use symbols and labels — not color alone.';
const PRESSURE_HINT =
  'All three leaks are sealed. Press CHECK PRESSURE to verify the air module.';

function sizeLabel(size: LeakSize) {
  return size === 'small' ? 'Small' : 'Large';
}

/** Mission Tier 1 — scan, S/L patch tray, pressure test (no rotation). */
export function PatchLeakTier1({
  instruction,
  reduceMotion,
  onResult,
  sol = 8,
}: PatchLeakProps) {
  const titleId = useId();
  const { ended, celebrating, finish, finishedRef } = useMiniGameResult(
    onResult,
    reduceMotion,
  );

  const stageRef = useRef<LeakStage>('scan');
  const scannedRef = useRef<string[]>([]);
  const sealedRef = useRef<string[]>([]);
  const selectedPatchRef = useRef<PatchSize | null>(null);

  const [stage, setStage] = useState<LeakStage>('scan');
  const [scanned, setScanned] = useState<string[]>([]);
  const [sealed, setSealed] = useState<string[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<PatchSize | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [toast, setToast] = useState(SCAN_HINT);
  const [hissId, setHissId] = useState<string | null>(null);
  const [gaugeStable, setGaugeStable] = useState(false);
  const [, setWrongAttempts] = useState(0);

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

  function enterPatchPhase() {
    setStage('patch');
    setToast(PATCH_HINT);
  }

  function enterPressurePhase() {
    setStage('pressure');
    setToast(PRESSURE_HINT);
  }

  function runPressureTest() {
    if (finishedRef.current || stageRef.current !== 'pressure') return;
    if (sealedRef.current.length < LEAK_COUNT) {
      setToast('Seal every leak with the right patch size first.');
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
    if (scannedRef.current.includes(leakId)) {
      const label = LEAKS.find((l) => l.id === leakId)?.label ?? 'That spot';
      setToast(`${label} is already scanned. Check another marker.`);
      return;
    }
    const leak = LEAKS.find((l) => l.id === leakId);
    if (!leak) return;
    const next = [...scannedRef.current, leakId];
    scannedRef.current = next;
    setScanned(next);
    pulseHiss(leakId);
    setToast(
      next.length >= LEAK_COUNT
        ? `${leak.label} needs a ${sizeLabel(leak.size)} patch. Open the patch tray below.`
        : `${leak.label}: Robo reads a ${sizeLabel(leak.size)} leak. Scan ${LEAK_COUNT - next.length} more.`,
    );
    if (next.length >= LEAK_COUNT) {
      enterPatchPhase();
    }
  }

  function selectPatch(size: PatchSize) {
    if (finishedRef.current || stageRef.current !== 'patch') return;
    selectedPatchRef.current = size;
    setSelectedPatch(size);
    setToast(
      `${sizeLabel(size)} patch selected. Tap the leak that matches this size.`,
    );
  }

  function applyPatch(leakId: string) {
    if (finishedRef.current || stageRef.current !== 'patch') return;
    const leak = LEAKS.find((l) => l.id === leakId);
    if (!leak) return;

    if (!scannedRef.current.includes(leakId)) {
      setToast('Scan this leak first so Robo can read its size.');
      return;
    }

    if (sealedRef.current.includes(leakId)) {
      setToast(`${leak.label} is already sealed. Pick another leak.`);
      return;
    }

    const patch = selectedPatchRef.current;
    if (!patch) {
      setToast('Choose Small or Large from the patch tray first.');
      return;
    }

    if (patch !== leak.size) {
      setWrongAttempts((n) => {
        const next = n + 1;
        setToast(
          next >= 2
            ? `That patch is too ${patch === 'small' ? 'small' : 'large'} for ${leak.label}. Robo says: match the scan reading — ${sizeLabel(leak.size)} here.`
            : `That patch does not fit ${leak.label}. Try the other size.`,
        );
        return next;
      });
      pulseHiss(leakId);
      return;
    }

    const next = [...sealedRef.current, leakId];
    sealedRef.current = next;
    setSealed(next);
    selectedPatchRef.current = null;
    setSelectedPatch(null);
    setToast(
      next.length >= LEAK_COUNT
        ? PRESSURE_HINT
        : `${leak.label} sealed. ${next.length} of ${LEAK_COUNT} patched.`,
    );
    if (next.length >= LEAK_COUNT) {
      enterPressurePhase();
    }
  }

  function activateLeak(leakId: string) {
    if (stageRef.current === 'scan') scanLeak(leakId);
    else if (stageRef.current === 'patch') applyPatch(leakId);
  }

  function openLeaksForFocus() {
    if (stageRef.current === 'scan') {
      return LEAKS.filter((l) => !scannedRef.current.includes(l.id));
    }
    if (stageRef.current === 'patch') {
      return LEAKS.filter(
        (l) =>
          scannedRef.current.includes(l.id) &&
          !sealedRef.current.includes(l.id),
      );
    }
    return [];
  }

  useLayoutEffect(() => {
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
        if (event.key === 'l' || event.key === 'L') {
          event.preventDefault();
          selectPatch('large');
          return;
        }
      }

      const open = openLeaksForFocus();
      if (open.length === 0 && stageRef.current !== 'scan') return;

      if (event.key >= '1' && event.key <= '3') {
        const leak = LEAKS[Number(event.key) - 1];
        if (!leak) return;
        if (stageRef.current === 'scan') {
          if (scannedRef.current.includes(leak.id)) return;
        } else if (stageRef.current === 'patch') {
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
      ? LEAKS.filter((l) => !scannedSet.has(l.id))
      : stage === 'patch'
        ? LEAKS.filter((l) => scannedSet.has(l.id) && !sealedSet.has(l.id))
        : [];
  const focusLeakId =
    focusPool[Math.min(focusIndex, Math.max(0, focusPool.length - 1))]?.id;

  const progressLabel =
    stage === 'scan'
      ? `Scanned ${scanned.length} of ${LEAK_COUNT} leaks`
      : stage === 'patch'
        ? `Sealed ${sealed.length} of ${LEAK_COUNT} leaks`
        : `Pressure check ready — ${LEAK_COUNT} of ${LEAK_COUNT} sealed`;

  const moduleAria =
    stage === 'scan'
      ? 'Air module. Scan each hiss marker. Keys 1 to 3.'
      : stage === 'patch'
        ? 'Air module. Select patch size, then tap a scanned leak. Keys S, L, 1 to 3.'
        : 'Air module sealed. Use Check Pressure below.';

  return (
    <section
      className={[
        'mg-leak',
        celebrating ? 'mg-leak--won' : '',
        gaugeStable ? 'mg-leak--stable' : '',
        stage === 'pressure' ? 'mg-leak--testing' : '',
        stage === 'scan' ? 'mg-leak--scan' : '',
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
              {stage === 'scan'
                ? 'Scan each leak, then patch with the right size.'
                : stage === 'patch'
                  ? 'Match patch size to each scanned leak.'
                  : 'Verify pressure before celebrating.'}
            </p>
          </div>
        </div>
        <div className="mg-leak__chip" aria-label={progressLabel}>
          {stage === 'scan'
            ? `${scanned.length} / ${LEAK_COUNT} scanned`
            : stage === 'patch'
              ? `${sealed.length} / ${LEAK_COUNT} sealed`
              : `${LEAK_COUNT} / ${LEAK_COUNT} sealed`}
        </div>
      </div>

      <div className="mg-leak__stage">
        <div
          className="mg-leak__module-wrap"
          role="group"
          aria-label={moduleAria}
        >
          <img
            className="mg-leak__module"
            src="/assets/minigames/air_module_cutaway.png"
            alt=""
            width={320}
            height={180}
            draggable={false}
          />

          {LEAKS.map((leak) => {
            const isScanned = scannedSet.has(leak.id);
            const isSealed = sealedSet.has(leak.id);
            const isFocus = focusLeakId === leak.id;
            const showHiss =
              hissId === leak.id && !reduceMotion && !isSealed;
            return (
              <button
                key={leak.id}
                type="button"
                className={[
                  'mg-leak__spot',
                  isSealed ? 'mg-leak__spot--patched' : 'mg-leak__spot--open',
                  isScanned && !isSealed ? 'mg-leak__spot--scanned' : '',
                  stage === 'scan' && !isScanned ? 'mg-leak__spot--scan' : '',
                  isFocus ? 'mg-leak__spot--focus' : '',
                  !isSealed && !reduceMotion && stage !== 'pressure'
                    ? 'mg-leak__spot--hiss'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ left: `${leak.x}%`, top: `${leak.y}%` }}
                aria-label={
                  isSealed
                    ? `${leak.label}, sealed with ${sizeLabel(leak.size)} patch`
                    : isScanned
                      ? `${leak.label}, scanned as ${sizeLabel(leak.size)} leak, tap to seal`
                      : `${leak.label}, marked leak spot, tap to scan`
                }
                disabled={
                  ended ||
                  stage === 'pressure' ||
                  (stage === 'scan' && isScanned) ||
                  (stage === 'patch' && !isScanned)
                }
                aria-disabled={
                  ended ||
                  stage === 'pressure' ||
                  (stage === 'scan' && isScanned) ||
                  isSealed
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
                />
                <span className="mg-leak__spot-tag" aria-hidden="true">
                  {isSealed
                    ? 'Sealed'
                    : isScanned
                      ? sizeLabel(leak.size)
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
          <div
            className="mg-leak__tray"
            role="group"
            aria-label="Patch size tray. Small and large patches only."
          >
            <button
              type="button"
              className={[
                'mg-leak__tray-btn',
                selectedPatch === 'small' ? 'mg-leak__tray-btn--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={ended}
              aria-pressed={selectedPatch === 'small'}
              aria-label="Select small patch"
              onClick={() => selectPatch('small')}
            >
              Small patch
              <span className="mg-leak__tray-glyph" aria-hidden="true">
                S
              </span>
            </button>
            <button
              type="button"
              className={[
                'mg-leak__tray-btn',
                selectedPatch === 'large' ? 'mg-leak__tray-btn--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={ended}
              aria-pressed={selectedPatch === 'large'}
              aria-label="Select large patch"
              onClick={() => selectPatch('large')}
            >
              Large patch
              <span className="mg-leak__tray-glyph" aria-hidden="true">
                L
              </span>
            </button>
            <span className="mg-leak__tray-hint">
              Press S or L, then tap a leak (keys 1–3).
            </span>
          </div>
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