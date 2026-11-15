import { Portrait } from './Portrait';

type NarrationCardProps = {
  text: string;
  onContinue: () => void;
  continueLabel?: string;
  reduceMotion?: boolean;
  showPortrait?: boolean;
};

/** Bottom narration / Robo hint — same dialogue panel style as character speech. */
export function NarrationCard({
  text,
  onContinue,
  continueLabel = 'Continue',
  reduceMotion = false,
  showPortrait = true,
}: NarrationCardProps) {
  return (
    <section
      className={showPortrait ? 'ui-dialogue' : 'ui-dialogue ui-dialogue--solo'}
      aria-live="polite"
      aria-label="Robo says"
    >
      {showPortrait ? (
        <div className="ui-dialogue__speaker" aria-hidden="true">
          <Portrait
            speaker="robo"
            expression="explaining"
            size="hero"
            alt=""
            reduceMotion={reduceMotion}
          />
        </div>
      ) : null}
      <div className="ui-dialogue__bubble">
        <header className="ui-dialogue__name">Robo</header>
        <p
          className={
            reduceMotion
              ? 'ui-dialogue__text'
              : 'ui-dialogue__text ui-narration__text--type'
          }
        >
          {text}
        </p>
        <button
          type="button"
          className="ui-dialogue__continue"
          onClick={onContinue}
        >
          {continueLabel}
          <span aria-hidden="true"> ››</span>
        </button>
      </div>
    </section>
  );
}
