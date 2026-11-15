import type { SpeakerPortrait } from '../../engine/scene-types';
import { Portrait } from './Portrait';

type DialogueBoxProps = SpeakerPortrait & {
  speakerName: string;
  text: string;
  onContinue?: () => void;
  continueLabel?: string;
  reduceMotion?: boolean;
};

/** Shared character speech and walking guidance, with an optional advance action. */
export function DialogueBox({
  speakerName,
  text,
  onContinue,
  continueLabel = 'Continue',
  reduceMotion = false,
  ...portrait
}: DialogueBoxProps) {
  return (
    <section className="ui-dialogue" aria-label={`${speakerName} says`}>
      <div className="ui-dialogue__speaker" aria-hidden="true">
        <Portrait
          {...portrait}
          size="hero"
          alt=""
          reduceMotion={reduceMotion}
        />
      </div>
      <div className="ui-dialogue__bubble">
        <header className="ui-dialogue__name">{speakerName}</header>
        <p className="ui-dialogue__text">{text}</p>
        {onContinue ? (
          <button
            type="button"
            className="ui-dialogue__continue"
            onClick={onContinue}
          >
            {continueLabel}
            <span aria-hidden="true"> ››</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
