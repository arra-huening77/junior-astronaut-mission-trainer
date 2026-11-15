import { useEffect, useMemo, useState } from 'react';
import type { CargoId, SkyLevel, SkySource } from '../../engine/types';
import { BudgetBar } from '../components/BudgetBar';
import { CargoCard } from '../components/CargoCard';
import {
  BALANCED_PACK,
  CARGO_BUDGET,
  PLAN_CARGO,
  PLAN_COPY,
  SKY_BRIEFING,
  cargoWeight,
} from './plan/fixtureCopy';

function RoboSpeech({
  text,
  soundEnabled,
  reduceMotion,
  onNext,
}: {
  text: string;
  soundEnabled: boolean;
  reduceMotion: boolean;
  onNext?: () => void;
}) {
  const [count, setCount] = useState(0);
  const complete = reduceMotion || count >= text.length;
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(
      () => setCount((n) => Math.min(n + 1, text.length)),
      24,
    );
    return () => window.clearInterval(timer);
  }, [text, reduceMotion]);
  useEffect(() => {
    if (!soundEnabled || complete) return;
    const audio = new Audio('/assets/audio/keyboard-typing.mp3');
    audio.loop = true;
    audio.volume = 0.12;
    void audio.play()?.catch(() => {});
    return () => {
      audio.pause();
    };
  }, [soundEnabled, complete]);
  function advance() {
    if (!complete) setCount(text.length);
    else onNext?.();
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'button, input, select, textarea, a, [contenteditable="true"]',
        )
      )
        return;
      event.preventDefault();
      if (!complete) setCount(text.length);
      else onNext?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [complete, text, onNext]);
  return (
    <div
      className="plan-speech"
      role="button"
      tabIndex={0}
      aria-label="Robo dialogue: press Enter or tap to continue"
      onClick={advance}
    >
      <p role="status" className="plan-speech-accessible">
        {text}
      </p>
      <p className="plan-speech-text" aria-hidden="true">
        {complete ? text : text.slice(0, count) || '\u00a0'}
      </p>
      {(!complete || onNext) && (
        <p className="plan-enter-hint" aria-hidden="true">
          Press Enter or tap to {complete ? 'continue' : 'show text'}
        </p>
      )}
    </div>
  );
}

export type PlanScreenProps = {
  skyLevel?: SkyLevel;
  skyStatus?: SkySource | 'Unavailable';
  observationDate?: string;
  initialCargo?: CargoId[];
  solarGainPreview?: number;
  onLaunch: (cargo: CargoId[]) => void;
  onBack?: () => void;
  replacesSavedMission?: boolean;
  soundEnabled?: boolean;
  reduceMotion?: boolean;
};

/**
 * Plan-phase cargo bay. Selection + budget only — engine owns modifiers after Launch.
 */
export function PlanScreen({
  skyLevel = 'calm',
  initialCargo = [],
  solarGainPreview = 12,
  onLaunch,
  onBack,
  replacesSavedMission = false,
  soundEnabled = false,
  reduceMotion = false,
}: PlanScreenProps) {
  const [selected, setSelected] = useState<CargoId[]>(initialCargo);
  const [roboLine, setRoboLine] = useState<string>(PLAN_COPY.welcome);
  const [intro, setIntro] = useState(0);
  useEffect(() => {
    if (!soundEnabled) return;
    const audio = new Audio(
      '/assets/audio/' +
        encodeURIComponent(
          '1. The Happy Hello! (When the game starts or the.opus',
        ),
    );
    audio.volume = 0.25;
    void audio.play()?.catch(() => {});
    return () => {
      audio.pause();
    };
  }, [soundEnabled]);
  const used = useMemo(() => cargoWeight(selected), [selected]);
  const briefing = SKY_BRIEFING[skyLevel];
  const introLines = [PLAN_COPY.welcome, briefing.briefing, briefing.advice];
  const speech = intro < introLines.length ? introLines[intro] : roboLine;
  const canLaunch = used <= CARGO_BUDGET;
  const gain =
    selected.includes('solar_extra') && solarGainPreview === 12
      ? 15
      : solarGainPreview;

  function toggle(id: string) {
    setIntro(3);
    const cargoId = id as CargoId;
    const item = PLAN_CARGO.find((c) => c.id === cargoId);
    if (!item) return;

    if (selected.includes(cargoId)) {
      setSelected((prev) => prev.filter((x) => x !== cargoId));
      setRoboLine(item.hint);
      return;
    }

    if (used + item.weight > CARGO_BUDGET) {
      setRoboLine(
        `${item.name} needs ${item.weight} weight points, but we have only ${CARGO_BUDGET - used} left. Remove something first, then try again.`,
      );
      return;
    }

    setSelected((prev) => [...prev, cargoId]);
    setRoboLine(item.hint);
  }

  function applyBalanced() {
    setIntro(3);
    setSelected([...BALANCED_PACK]);
    setRoboLine(PLAN_COPY.balanced);
  }

  function launch() {
    if (!canLaunch) return;
    setRoboLine(PLAN_COPY.launch);
    onLaunch(selected);
  }

  return (
    <div className="plan-shell">
      <div className="plan-frame">
        <nav className="plan-back" aria-label="Plan navigation">
          {' '}
          {onBack ? (
            <button type="button" className="plan-btn" onClick={onBack}>
              Back
            </button>
          ) : null}
        </nav>
        <header className="plan-top">
          <div>
            <p className="plan-eyebrow">Plan phase</p>
            <h1>Pack your cargo</h1>
          </div>
        </header>

        <section className="plan-robo" aria-label="Robo explains cargo">
          <img
            src="/assets/characters/robo_explaining.png"
            alt="Robo"
            draggable={false}
          />
          <div className="plan-bubble">
            <h2 className="plan-speaker">Robo</h2>
            <RoboSpeech
              key={`${intro}:${speech}`}
              text={speech}
              soundEnabled={soundEnabled}
              reduceMotion={reduceMotion}
              onNext={intro < 3 ? () => setIntro((i) => i + 1) : undefined}
            />
          </div>
        </section>

        <BudgetBar used={used} max={CARGO_BUDGET} label="Launch weight" />

        <p className="plan-gen">
          Starting Power stays 65 · Solar generation: +{gain} per sol
          {selected.includes('solar_extra') ? ' (extra panels packed)' : ''}
        </p>

        <div className="plan-grid" role="list">
          {PLAN_CARGO.map((item) => {
            const isOn = selected.includes(item.id);
            const wouldOver = !isOn && used + item.weight > CARGO_BUDGET;
            return (
              <div key={item.id} role="listitem">
                <CargoCard
                  id={item.id}
                  name={item.name}
                  description={item.hint}
                  iconSrc={item.iconSrc}
                  mass={item.weight}
                  selected={isOn}
                  overBudget={wouldOver}
                  onToggle={toggle}
                />
              </div>
            );
          })}
        </div>

        {replacesSavedMission && (
          <p className="plan-replace-notice">
            Launching this new mission replaces your saved progress. Choose Back
            to keep the current mission.
          </p>
        )}
        <footer className="plan-foot">
          <button type="button" className="plan-btn" onClick={applyBalanced}>
            Balanced pack
          </button>
          <button
            type="button"
            className="plan-btn plan-btn--launch"
            disabled={!canLaunch}
            onClick={launch}
          >
            Launch mission
          </button>
        </footer>
      </div>
    </div>
  );
}
