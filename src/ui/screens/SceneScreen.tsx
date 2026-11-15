import type { ReactNode } from 'react';
import type { Meters } from '../../engine/types';
import { Banner } from '../components/Banner';
import { EventAlert } from '../components/EventAlert';
import { Meters as MetersBar } from '../components/Meters';
import { SolBadge } from '../components/SolBadge';
import type { EventAlertContent } from '../presentation/eventAlert';
import { primaryMeterWarning } from '../presentation/meterWarnings';

type SceneScreenProps = {
  meters: Meters;
  sol: number;
  phaseLabel?: string;
  clockLabel?: string;
  reduceMotion?: boolean;
  goalTitle?: string;
  goalBody?: string;
  challenges?: string[];
  /** Hazard mood alert (dust storm, solar storm, …) */
  eventAlert?: EventAlertContent | null;
  onLearn?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
  /** ScenePresenter output: stage + dock */
  children: ReactNode;
};

/**
 * Scene HUD chrome over the outpost stage.
 */
export function SceneScreen({
  meters,
  sol,
  phaseLabel = 'Day',
  clockLabel,
  reduceMotion = false,
  goalTitle = 'Mission Goal',
  goalBody = 'Survive for 10 Sols on Mars!',
  challenges = ['☢ Radiation', '❄ Extreme cold', '💧 Limited water'],
  eventAlert = null,
  onLearn,
  onHelp,
  onSettings,
  children,
}: SceneScreenProps) {
  const warning = primaryMeterWarning(meters);

  return (
    <div className="ui-game">
      {children}
      <header className="ui-topbar">
        <div className="ui-brand">
          <span className="ui-brand__mark">
            <img
              src="/assets/branding/tiny_habitat_transparent.png"
              alt="Tiny Habitat"
            />
          </span>
        </div>
        <MetersBar values={meters} reduceMotion={reduceMotion} variant="hud" />
        <div className="ui-topbar__end">
          <SolBadge sol={sol} phaseLabel={phaseLabel} clockLabel={clockLabel} />
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Settings"
            onClick={onSettings}
          >
            ⚙
          </button>
        </div>
      </header>

      {eventAlert ? (
        <div className="ui-game__alert">
          <EventAlert {...eventAlert} reduceMotion={reduceMotion} />
        </div>
      ) : null}

      {warning ? (
        <div className="ui-game__warn">
          <Banner tone="warning" message={warning.message} />
        </div>
      ) : null}

      <aside className="ui-rail ui-rail--left" aria-label="Mission tools">
        <button type="button" className="ui-rail__btn" onClick={onLearn}>
          <span aria-hidden="true">📘</span>
          Learn
        </button>
        <button type="button" className="ui-rail__btn" onClick={onHelp}>
          <span aria-hidden="true">❓</span>
          Help
        </button>
      </aside>

      <aside className="ui-rail ui-rail--right" aria-label={goalTitle}>
        <h2>{goalTitle}</h2>
        <p>{goalBody}</p>
        <ul>
          {challenges.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
