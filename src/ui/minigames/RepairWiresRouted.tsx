import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RepairWiresProps } from './RepairWires';
import {
  CONDUIT_ROW_Y,
  getRepairWiresTierConfig,
  type RepairWiresDifficulty,
  type WirePairRoute,
} from './_lib/repairWiresTiers';
import { useMiniGameResult } from './_lib/useMiniGameResult';

const LEFT_X = 14;
const RIGHT_X = 86;

type WireTerminal = {
  id: string;
  pairId: string;
  side: 'left' | 'right';
  row: number;
  x: number;
  y: number;
  symbol: string;
  name: string;
  color: string;
};

type RoutedStage = 'match' | 'route' | 'test';

const CONDUIT_CLUE =
  'Robo says: each wire needs its own conduit row — pick a free lane.';
const MATCH_CLUE_HINT = 'Robo says: match symbols and labels, not just colors.';

function buildTerminals(
  pairs: readonly WirePairRoute[],
  rowY: readonly number[],
): WireTerminal[] {
  return pairs.flatMap((pair, row) => [
    {
      id: `${pair.id}-L`,
      pairId: pair.id,
      side: 'left' as const,
      row,
      x: LEFT_X,
      y: rowY[row],
      symbol: pair.symbol,
      name: pair.name,
      color: pair.color,
    },
    {
      id: `${pair.id}-R`,
      pairId: pair.id,
      side: 'right' as const,
      row,
      x: RIGHT_X,
      y: rowY[row],
      symbol: pair.symbol,
      name: pair.name,
      color: pair.color,
    },
  ]);
}

function wirePolyline(
  portY: number,
  path: 'A' | 'B',
  conduitRow: number,
  conduitMode: boolean,
): string {
  const midY = conduitMode
    ? CONDUIT_ROW_Y[conduitRow]
    : portY + (path === 'A' ? -6 : 6);
  return `M ${LEFT_X} ${portY} L 35 ${portY} L 35 ${midY} L 65 ${midY} L 65 ${portY} L ${RIGHT_X} ${portY}`;
}

type RoutedProps = RepairWiresProps & { difficulty: RepairWiresDifficulty };

/** Preview tiers 2–3: extra pairs, route around obstacles, optional conduit grid. */
export function RepairWiresRouted({
  instruction,
  reduceMotion,
  onResult,
  sol = 7,
  difficulty,
}: RoutedProps) {
  const config = useMemo(
    () => getRepairWiresTierConfig(difficulty),
    [difficulty],
  );
  const { pairs, rowY, conduitMode } = config;
  const pairCount = pairs.length;
  const terminals = useMemo(() => buildTerminals(pairs, rowY), [pairs, rowY]);

  const titleId = useId();
  const { ended, celebrating, finish, finishedRef } = useMiniGameResult(
    onResult,
    reduceMotion,
  );

  const roboHint = `Choose a wire end, then its matching symbol. Connect all ${pairCount} pairs.`;
  const testHint = `All ${pairCount} pairs are routed. Press TEST POWER to check the circuit.`;

  const selectedRef = useRef<string | null>(null);
  const matchedRef = useRef<string[]>([]);
  const routedRef = useRef<string[]>([]);
  const routePathRef = useRef<Record<string, 'A' | 'B'>>({});
  const stageRef = useRef<RoutedStage>('match');
  const pendingRouteRef = useRef<string | null>(null);

  const [stage, setStage] = useState<RoutedStage>('match');
  const [matched, setMatched] = useState<string[]>([]);
  const [routed, setRouted] = useState<string[]>([]);
  const [routePaths, setRoutePaths] = useState<Record<string, 'A' | 'B'>>({});
  const [pendingRoutePairId, setPendingRoutePairId] = useState<string | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [toast, setToast] = useState(roboHint);
  const [nudge, setNudge] = useState(false);
  const [spark, setSpark] = useState(false);
  const [, setPairMismatches] = useState<Record<string, number>>({});
  const [, setConduitBlocks] = useState(0);
  const [circuitLive, setCircuitLive] = useState(false);

  const matchedSet = useMemo(() => new Set(matched), [matched]);
  const routedSet = useMemo(() => new Set(routed), [routed]);

  const completeCount = useMemo(
    () =>
      pairs.filter((p) => matchedSet.has(p.id) && routedSet.has(p.id)).length,
    [pairs, matchedSet, routedSet],
  );

  const occupiedConduits = useMemo(() => {
    const rows = new Set<number>();
    for (const pairId of routed) {
      const pair = pairs.find((p) => p.id === pairId);
      const path = routePaths[pairId];
      if (!pair || !path) continue;
      const row = path === 'A' ? pair.pathAConduit : pair.pathBConduit;
      rows.add(row);
    }
    return rows;
  }, [pairs, routed, routePaths]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    matchedRef.current = matched;
  }, [matched]);
  useEffect(() => {
    routedRef.current = routed;
  }, [routed]);
  useEffect(() => {
    routePathRef.current = routePaths;
  }, [routePaths]);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    pendingRouteRef.current = pendingRoutePairId;
  }, [pendingRoutePairId]);

  function pairById(id: string) {
    return pairs.find((p) => p.id === id);
  }

  function enterRoutePhase(pairId: string) {
    setStage('route');
    setPendingRoutePairId(pairId);
    const pair = pairById(pairId);
    setToast(
      pair
        ? `Route the ${pair.name} line (${pair.symbol}). Avoid the hot conduit. Keys A or B.`
        : 'Pick a safe route for this wire.',
    );
  }

  function enterTestPhase() {
    setStage('test');
    setPendingRoutePairId(null);
    setToast(testHint);
  }

  function allComplete() {
    return completeCount >= pairCount;
  }

  function runCircuitTest() {
    if (finishedRef.current || stageRef.current !== 'test') return;
    if (!allComplete()) {
      setToast('Finish matching and routing every line before testing.');
      return;
    }
    setCircuitLive(true);
    setToast('Circuit stable! Power is flowing again.');
    finish('done');
  }

  function afterPairRouted() {
    setPendingRoutePairId(null);
    const done = pairs.every(
      (p) =>
        matchedRef.current.includes(p.id) && routedRef.current.includes(p.id),
    );
    if (done) {
      enterTestPhase();
      return;
    }
    setStage('match');
    setToast(roboHint);
  }

  function pickRoute(path: 'A' | 'B') {
    if (finishedRef.current || stageRef.current !== 'route') return;
    const pairId = pendingRouteRef.current;
    if (!pairId) return;
    const pair = pairById(pairId);
    if (!pair) return;

    const conduitRow = path === 'A' ? pair.pathAConduit : pair.pathBConduit;
    if (
      conduitMode &&
      occupiedConduits.has(conduitRow) &&
      !routedRef.current.includes(pairId)
    ) {
      setConduitBlocks((n) => {
        const next = n + 1;
        setToast(
          next >= 1
            ? `That conduit row is already in use. ${CONDUIT_CLUE}`
            : 'That conduit row is already in use. Try the other route.',
        );
        return next;
      });
      if (!reduceMotion) {
        setNudge(true);
        window.setTimeout(() => setNudge(false), 420);
      }
      return;
    }

    if (path !== pair.safePath) {
      setToast('Too close to hot line. Try the other route.');
      if (!reduceMotion) {
        setNudge(true);
        setSpark(true);
        window.setTimeout(() => setNudge(false), 420);
        window.setTimeout(() => setSpark(false), 380);
      }
      return;
    }

    const nextRouted = routedRef.current.includes(pairId)
      ? routedRef.current
      : [...routedRef.current, pairId];
    routedRef.current = nextRouted;
    const nextPaths = { ...routePathRef.current, [pairId]: path };
    routePathRef.current = nextPaths;
    setRouted(nextRouted);
    setRoutePaths(nextPaths);
    setToast(
      `Route locked for ${pair.name}. ${completeCount + 1} of ${pairCount} ready.`,
    );
    afterPairRouted();
  }

  function terminalById(id: string) {
    return terminals.find((t) => t.id === id);
  }

  function isPortMatched(terminal: WireTerminal) {
    return matchedSet.has(terminal.pairId);
  }

  function isPairFullyDone(pairId: string) {
    return matchedSet.has(pairId) && routedSet.has(pairId);
  }

  function activateTerminal(terminal: WireTerminal) {
    const liveMatched = new Set(matchedRef.current);
    if (
      finishedRef.current ||
      stageRef.current !== 'match' ||
      liveMatched.has(terminal.pairId)
    ) {
      return;
    }

    const activeSelection = selectedRef.current;

    if (!activeSelection) {
      selectedRef.current = terminal.id;
      setSelectedId(terminal.id);
      setToast(
        `Selected ${terminal.name} (${terminal.symbol}). Now pick its matching end.`,
      );
      return;
    }

    if (activeSelection === terminal.id) {
      selectedRef.current = null;
      setSelectedId(null);
      setToast(roboHint);
      return;
    }

    const first = terminalById(activeSelection);
    if (!first) {
      selectedRef.current = terminal.id;
      setSelectedId(terminal.id);
      return;
    }

    if (first.pairId === terminal.pairId && first.id !== terminal.id) {
      const nextMatched = liveMatched.has(terminal.pairId)
        ? matchedRef.current
        : [...matchedRef.current, terminal.pairId];
      matchedRef.current = nextMatched;
      setMatched(nextMatched);
      selectedRef.current = null;
      setSelectedId(null);
      enterRoutePhase(terminal.pairId);
      return;
    }

    selectedRef.current = null;
    setSelectedId(null);
    const mismatchPair = first.pairId;
    setPairMismatches((prev) => {
      const nextCount = (prev[mismatchPair] ?? 0) + 1;
      const showStrong =
        nextCount >= config.mismatchHintAfter ||
        (prev[terminal.pairId] ?? 0) >= config.mismatchHintAfter;
      setToast(
        showStrong
          ? `Those ends do not match. ${MATCH_CLUE_HINT}`
          : 'Those ends do not match. Try again — match the symbol and label.',
      );
      return { ...prev, [mismatchPair]: nextCount };
    });
    if (!reduceMotion) {
      setNudge(true);
      setSpark(true);
      window.setTimeout(() => setNudge(false), 420);
      window.setTimeout(() => setSpark(false), 380);
    }
  }

  function activeFocusIndex() {
    const open = terminals.filter((t) => !matchedSet.has(t.pairId));
    if (open.length === 0) return 0;
    const idx = Math.min(focusIndex, open.length - 1);
    const globalIndex = terminals.findIndex((t) => t.id === open[idx].id);
    return globalIndex >= 0 ? globalIndex : 0;
  }

  useLayoutEffect(() => {
    const pairCountLocal = pairCount;

    function openPorts() {
      const live = new Set(matchedRef.current);
      return terminals.filter((t) => !live.has(t.pairId));
    }

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

      if (stageRef.current === 'test') {
        if (event.key === 't' || event.key === 'T') {
          event.preventDefault();
          runCircuitTest();
        }
        return;
      }

      if (stageRef.current === 'route') {
        if (event.key === 'a' || event.key === 'A') {
          event.preventDefault();
          pickRoute('A');
        } else if (event.key === 'b' || event.key === 'B') {
          event.preventDefault();
          pickRoute('B');
        }
        return;
      }

      const open = openPorts();
      if (open.length === 0) return;

      const digit = Number(event.key);
      if (digit >= 1 && digit <= pairCountLocal * 2) {
        const idx = digit - 1;
        const row = idx % pairCountLocal;
        const side: 'left' | 'right' = idx < pairCountLocal ? 'left' : 'right';
        const terminal = terminals.find(
          (t) => t.row === row && t.side === side,
        );
        const live = new Set(matchedRef.current);
        if (!terminal || live.has(terminal.pairId)) return;
        event.preventDefault();
        setFocusIndex(open.findIndex((t) => t.id === terminal.id));
        activateTerminal(terminal);
        return;
      }

      let localFocus = Math.min(focusIndex, Math.max(0, open.length - 1));
      const openCol = (term: WireTerminal) =>
        open.findIndex((t) => t.id === term.id);
      const current = open[localFocus] ?? open[0];

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (current.side === 'left') {
          const twin = open.find(
            (t) => t.pairId === current.pairId && t.side === 'right',
          );
          if (twin) localFocus = openCol(twin);
        }
        setFocusIndex(localFocus);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (current.side === 'right') {
          const twin = open.find(
            (t) => t.pairId === current.pairId && t.side === 'left',
          );
          if (twin) localFocus = openCol(twin);
        }
        setFocusIndex(localFocus);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const sameSide = open.filter((t) => t.side === current.side);
        const pos = sameSide.findIndex((t) => t.id === current.id);
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next =
          sameSide[(pos + delta + sameSide.length) % sameSide.length];
        localFocus = openCol(next);
        setFocusIndex(localFocus);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        selectedRef.current = null;
        setSelectedId(null);
        setToast(roboHint);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const fromBoard =
          event.target instanceof Element &&
          Boolean(event.target.closest('.mg-wires__board-wrap'));
        if (!fromBoard) return;
        event.preventDefault();
        const term = open[localFocus];
        if (term) activateTerminal(term);
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  });

  const focusGlobal = activeFocusIndex();
  const pendingPair = pendingRoutePairId ? pairById(pendingRoutePairId) : null;
  const tierBadge = `Training tier ${config.difficulty}`;

  return (
    <section
      className={[
        'mg-wires',
        celebrating ? 'mg-wires--won' : '',
        circuitLive ? 'mg-wires--powered' : '',
        stage === 'test' ? 'mg-wires--testing' : '',
        stage === 'route' ? 'mg-wires--routing' : '',
        conduitMode ? 'mg-wires--conduit' : '',
        nudge && !reduceMotion ? 'mg-wires--nudge' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
    >
      <div className="mg-wires__hud">
        <div className="mg-wires__chip">Sol {sol}</div>
        <div className="mg-wires__title-card">
          <span className="mg-wires__title-icon" aria-hidden="true" />
          <div>
            <h2 id={titleId}>Repair Wires</h2>
            <p>
              {conduitMode
                ? 'Route each wire through a free conduit lane.'
                : 'Match pairs, then route around hot lines.'}
            </p>
          </div>
        </div>
        <div
          className="mg-wires__chip"
          aria-label={`Routed ${completeCount} of ${pairCount} pairs`}
        >
          {completeCount} / {pairCount}
        </div>
      </div>

      {config.showClueStrip ? (
        <div className="mg-wires__clues" aria-label="Wire pair clue strip">
          {pairs.map((pair) => (
            <span key={pair.id} className="mg-wires__clue-pill">
              <span aria-hidden="true">{pair.symbol}</span> {pair.name}
            </span>
          ))}
          <span className="mg-wires__clue-training">{tierBadge}</span>
        </div>
      ) : null}

      <div className="mg-wires__stage">
        <div
          className="mg-wires__board-wrap"
          role="group"
          aria-label={
            stage === 'test'
              ? 'Wire board ready for circuit test. Use Test Power below.'
              : stage === 'route'
                ? 'Choose route A or B for the active wire. Avoid hot conduits.'
                : `Wire board. Pick an end, then its matching symbol. Keys 1–${pairCount * 2}.`
          }
        >
          <img
            className="mg-wires__board"
            src="/assets/minigames/wire_board.png"
            alt=""
            width={320}
            height={180}
            draggable={false}
          />

          {conduitMode ? (
            <svg
              className="mg-wires__conduit-grid"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {CONDUIT_ROW_Y.map((y, row) => (
                <g key={row}>
                  <line
                    x1={28}
                    y1={y}
                    x2={72}
                    y2={y}
                    className={[
                      'mg-wires__conduit-lane',
                      occupiedConduits.has(row)
                        ? 'mg-wires__conduit-lane--busy'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                </g>
              ))}
            </svg>
          ) : (
            <div
              className="mg-wires__obstacle mg-wires__obstacle--hot"
              aria-hidden="true"
            >
              <span>Hot line</span>
            </div>
          )}

          <svg
            className="mg-wires__lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {pairs.map((pair, row) => {
              if (!isPairFullyDone(pair.id)) return null;
              const path = routePaths[pair.id] ?? 'A';
              const conduitRow =
                path === 'A' ? pair.pathAConduit : pair.pathBConduit;
              const portY = rowY[row];
              return (
                <path
                  key={pair.id}
                  d={wirePolyline(portY, path, conduitRow, conduitMode)}
                  fill="none"
                  stroke={pair.color}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    reduceMotion
                      ? 'mg-wires__line'
                      : 'mg-wires__line mg-wires__line--pulse'
                  }
                />
              );
            })}
          </svg>

          {terminals.map((terminal, index) => {
            const matchedPort = isPortMatched(terminal);
            const fullyDone = isPairFullyDone(terminal.pairId);
            const picked = selectedId === terminal.id;
            const keyboardFocus = focusGlobal === index && !matchedPort;
            const pendingRoute = stage === 'route' && !fullyDone && matchedPort;
            return (
              <button
                key={terminal.id}
                type="button"
                className={[
                  'mg-wires__port',
                  fullyDone ? 'mg-wires__port--linked' : '',
                  matchedPort && !fullyDone ? 'mg-wires__port--matched' : '',
                  picked ? 'mg-wires__port--selected' : '',
                  keyboardFocus ? 'mg-wires__port--focus' : '',
                  pendingRoute ? 'mg-wires__port--route' : '',
                  !matchedPort && !reduceMotion && !picked
                    ? 'mg-wires__port--idle'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${terminal.x}%`,
                  top: `${terminal.y}%`,
                  ['--mg-wire-color' as string]: terminal.color,
                }}
                aria-label={
                  fullyDone
                    ? `${terminal.name} wire ${terminal.side}, routed`
                    : matchedPort
                      ? `${terminal.name} wire ${terminal.side}, matched, choose route`
                      : picked
                        ? `${terminal.name} wire ${terminal.side}, selected, symbol ${terminal.symbol}`
                        : `${terminal.name} wire ${terminal.side}, symbol ${terminal.symbol}, color accent for sighted players`
                }
                aria-pressed={picked || matchedPort}
                disabled={
                  ended ||
                  fullyDone ||
                  stage === 'test' ||
                  (stage === 'route' && !matchedPort)
                }
                onClick={() => {
                  setFocusIndex(
                    terminals
                      .filter((t) => !matchedSet.has(t.pairId))
                      .findIndex((t) => t.id === terminal.id),
                  );
                  activateTerminal(terminal);
                }}
                onFocus={() => {
                  const openIdx = terminals
                    .filter((t) => !matchedSet.has(t.pairId))
                    .findIndex((t) => t.id === terminal.id);
                  if (openIdx >= 0) setFocusIndex(openIdx);
                }}
              >
                <span className="mg-wires__port-symbol" aria-hidden="true">
                  {terminal.symbol}
                </span>
                <span className="mg-wires__port-label" aria-hidden="true">
                  {terminal.name}
                </span>
              </button>
            );
          })}

          {spark && !reduceMotion ? (
            <img
              className="mg-wires__spark"
              src="/assets/overlays/spark.png"
              alt=""
              draggable={false}
            />
          ) : null}
        </div>

        {stage === 'route' && pendingPair ? (
          <div
            className="mg-wires__route-panel"
            role="group"
            aria-label={`Route options for ${pendingPair.name}`}
          >
            <p className="mg-wires__route-title">
              Route {pendingPair.symbol} {pendingPair.name}
            </p>
            <div className="mg-wires__route-options">
              <button
                type="button"
                className="mg-wires__route-btn mg-wires__route-btn--a"
                disabled={ended}
                onClick={() => pickRoute('A')}
              >
                Route A — upper conduit
              </button>
              <button
                type="button"
                className="mg-wires__route-btn mg-wires__route-btn--b"
                disabled={ended}
                onClick={() => pickRoute('B')}
              >
                Route B — lower conduit
              </button>
            </div>
            <span className="mg-wires__test-hint">
              Press A or B on the keyboard. Unsafe routes spark — try again.
            </span>
          </div>
        ) : null}

        {stage === 'test' ? (
          <div
            className="mg-wires__test-panel"
            role="group"
            aria-label="Circuit indicators for all wire lines"
          >
            {pairs.map((pair) => (
              <div
                key={pair.id}
                className={[
                  'mg-wires__led',
                  circuitLive ? 'mg-wires__led--live' : 'mg-wires__led--ready',
                  !reduceMotion && circuitLive ? 'mg-wires__led--pulse' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ ['--mg-wire-color' as string]: pair.color }}
              >
                <span className="mg-wires__led-bulb" aria-hidden="true" />
                <span className="mg-wires__led-label">
                  {pair.symbol} {pair.name}
                </span>
              </div>
            ))}
            <button
              type="button"
              className="mg-wires__test-btn"
              disabled={ended || circuitLive}
              onClick={runCircuitTest}
            >
              Test power
            </button>
            <span className="mg-wires__test-hint">
              Press T for test power (keyboard).
            </span>
          </div>
        ) : null}

        <p className="mg-wires__toast" role="status">
          {toast}
        </p>

        {celebrating ? (
          <div className="mg-wires__celebrate" role="status">
            <p>Power line restored!</p>
            <span>Wiring is steady again.</span>
          </div>
        ) : null}
      </div>

      <div className="mg-wires__footer">
        <p className="mg-wires__instruction">{instruction}</p>
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
