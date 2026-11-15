import type { DebriefResponse } from '../../engine/contracts';
import type {
  HistoryEntry,
  MeterId,
  Meters,
  SkyLevel,
} from '../../engine/types';
import { MeterGraph } from './report/MeterGraph';
import {
  COMMANDER_STYLES,
  ENDING_COPY,
  eventLabel,
  type CommanderStyle,
} from './report/fixtureCopy';

export type ReportScreenProps = {
  ending: 'success' | 'gentle';
  finalMeters?: Meters;
  drains?: {
    sol: number;
    eventId: HistoryEntry['eventId'];
    choiceId: HistoryEntry['choiceId'];
    meter: MeterId;
    amount: number;
  }[];
  failedMeter?: MeterId | null;
  history: HistoryEntry[];
  skyLevel?: SkyLevel;
  commanderStyle?: CommanderStyle;
  commanderName?: string;
  debrief?: DebriefResponse | null;
  debriefPending?: boolean;
  albumCount?: number;
  sourcesNote?: string;
  canRetrySol?: boolean;
  onRetryMission?: () => void;
  onRetrySol?: () => void;
  onOpenAlbum?: () => void;
  onOpenCertificate?: () => void;
  onClose?: () => void;
};

/**
 * Mission Report + What happened? presentation.
 * Engine owns ending/history; UI never mutates meters or invents outcomes.
 */
export function ReportScreen({
  ending,
  failedMeter = null,
  history,
  finalMeters,
  drains: evidence = [],
  skyLevel = 'calm',
  commanderStyle = COMMANDER_STYLES[0],
  commanderName = 'Junior Commander',
  debrief = null,
  debriefPending = false,
  albumCount = 0,
  sourcesNote = 'NASA data sources used in this run are listed on Sources & Credits.',
  canRetrySol = false,
  onRetryMission,
  onRetrySol,
  onOpenAlbum,
  onOpenCertificate,
  onClose,
}: ReportScreenProps) {
  const isGentle = ending === 'gentle';
  const meter = failedMeter ?? 'power';
  const drains = isGentle
    ? evidence.filter((d) => d.meter === meter).slice(0, 3)
    : [];
  const debriefLabel =
    debrief?.source === 'ai' ? 'Written by AI' : "Robo's mission summary";

  return (
    <div
      className={
        isGentle ? 'report-shell report-shell--gentle' : 'report-shell'
      }
    >
      <div
        className="report-frame"
        role="dialog"
        aria-labelledby="report-title"
      >
        <header className="report-top">
          <div className="report-brand">
            <img
              src="/assets/characters/robo_cheering.png"
              alt=""
              className="report-brand__robo"
              draggable={false}
            />
            <div>
              <p className="report-brand__eyebrow">
                {isGentle ? 'What happened?' : 'Mission Report'}
              </p>
              <h1 id="report-title">
                {isGentle ? ENDING_COPY.gentleTitle : ENDING_COPY.successTitle}
              </h1>
            </div>
          </div>
          {onClose ? (
            <button
              type="button"
              className="report-close"
              aria-label="Close report"
              onClick={onClose}
            >
              ✕
            </button>
          ) : null}
        </header>

        <div className="report-body">
          <section className="report-card report-card--lead">
            <p>{isGentle ? ENDING_COPY.gentleLead : ENDING_COPY.successBody}</p>
            {isGentle ? (
              <p className="report-emphasis">{ENDING_COPY.gentle[meter]}</p>
            ) : null}
            <p className="report-style">
              Commander style: <strong>{commanderStyle}</strong>
              <span aria-hidden="true"> · </span>
              {commanderName}
            </p>
            <p className="report-meta">Sky input: {skyLevel}</p>
          </section>

          <section className="report-card">
            <h2>Meters after each choice</h2>
            {finalMeters && (
              <p>
                Final meters after all committed costs: Life Support{' '}
                {finalMeters.life} · Power {finalMeters.power} · Shielding{' '}
                {finalMeters.shield}
              </p>
            )}
            <MeterGraph history={history} highlight={isGentle ? meter : null} />
          </section>

          <section className="report-card">
            <h2>Choices made</h2>
            <ol className="report-choices">
              {history.map((entry) => (
                <li key={`${entry.sol}-${entry.eventId}`}>
                  <span className="report-choices__sol">Sol {entry.sol}</span>
                  <span>
                    {eventLabel(entry.eventId)} · Choice {entry.choiceId}
                    {entry.miniGame ? ` · task ${entry.miniGame}` : ''}
                  </span>
                  <span className="report-choices__meters">
                    L{entry.meters.life} · P{entry.meters.power} · S
                    {entry.meters.shield}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {isGentle ? (
            <section className="report-card">
              <h2>Choice costs on {meterLabel(meter)}</h2>
              <p>
                Night supplies and solar generation also affect your meters.
              </p>
              <ul className="report-drains">
                {drains.map((d) => (
                  <li key={`${d.sol}-${d.eventId}`}>
                    Sol {d.sol} · {eventLabel(d.eventId)} · Choice {d.choiceId}
                    <strong> −{d.amount}</strong>
                  </li>
                ))}
              </ul>
              <p className="report-hint">Hint: {ENDING_COPY.hint[meter]}</p>
            </section>
          ) : null}

          <section className="report-card report-debrief">
            <header>
              <img
                src={
                  debriefPending
                    ? '/assets/characters/robo_thinking.png'
                    : '/assets/characters/robo_explaining.png'
                }
                alt=""
                draggable={false}
              />
              <div>
                <h2>{debriefPending ? 'Robo is thinking…' : debriefLabel}</h2>
                <p className="report-meta">No score · reflection only</p>
              </div>
            </header>
            {debrief ? <p>{debrief.text}</p> : null}
            {!debrief && !debriefPending ? (
              <p className="report-meta">
                Summary will appear here when ready.
              </p>
            ) : null}
          </section>

          <section className="report-card report-card--row">
            <div>
              <h2>Mission Album</h2>
              <p>
                {albumCount} Real Mars card{albumCount === 1 ? '' : 's'} saved
                this run.
              </p>
            </div>
            {onOpenAlbum ? (
              <button
                type="button"
                className="report-btn"
                onClick={onOpenAlbum}
              >
                Open album
              </button>
            ) : null}
          </section>

          <p className="report-sources">{sourcesNote}</p>
        </div>

        <footer className="report-foot">
          {onRetryMission ? (
            <button
              type="button"
              className="report-btn report-btn--primary"
              onClick={onRetryMission}
            >
              Try again
            </button>
          ) : null}
          {isGentle && canRetrySol && onRetrySol ? (
            <button type="button" className="report-btn" onClick={onRetrySol}>
              Try this sol again
            </button>
          ) : null}
          {!isGentle && onOpenCertificate ? (
            <button
              type="button"
              className="report-btn report-btn--gold"
              onClick={onOpenCertificate}
            >
              Certificate
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className="report-btn" onClick={onClose}>
              Title
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function meterLabel(id: MeterId): string {
  if (id === 'life') return 'Life Support';
  if (id === 'power') return 'Power';
  return 'Shielding';
}
