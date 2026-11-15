import { useEffect, useState } from 'react';
import {
  PROLOGUE_LINES,
  PROLOGUE_TAGLINE,
  PROLOGUE_TEAM_LINES,
} from './prologue/fixtureCopy';
import { SpinningMars } from './prologue/SpinningMars';
import { DialogueBox } from '../components/DialogueBox';

type PrologueScreenProps = {
  reduceMotion?: boolean;
  lines?: readonly string[];
  finalLabel?: string;
  onComplete: () => void;
  onSkip?: () => void;
};

/**
 * Prologue: starfield, spinning Mars, glowing team name, Robo narration.
 */
export function PrologueScreen({
  reduceMotion = false,
  lines = PROLOGUE_LINES,
  finalLabel = 'Begin Sol 1',
  onComplete,
  onSkip,
}: PrologueScreenProps) {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState({ line: '', text: '' });
  const [showBrand, setShowBrand] = useState(false);
  const line = lines[step] ?? '';
  const typed = reduceMotion ? line : typing.line === line ? typing.text : '';
  const doneTyping = typed.length >= line.length;
  const last = step >= lines.length - 1;

  useEffect(() => {
    const t = window.setTimeout(
      () => setShowBrand(true),
      reduceMotion ? 0 : 700,
    );
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !line) return;

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyping((previous) => {
        if (previous.line === line && previous.text.length >= line.length)
          return previous;
        return { line, text: line.slice(0, i) };
      });
      if (i >= line.length) window.clearInterval(id);
    }, 22);

    return () => window.clearInterval(id);
  }, [line, reduceMotion, step]);

  function advance() {
    if (!doneTyping) {
      setTyping({ line, text: line });
      return;
    }
    if (last) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div
      className={
        reduceMotion
          ? 'prologue-shell prologue-shell--static'
          : 'prologue-shell'
      }
    >
      <div className="prologue-sky" aria-hidden="true">
        <div className="prologue-stars prologue-stars--far" />
        <div className="prologue-stars prologue-stars--near" />
        <div className="prologue-nebula" />
        <SpinningMars reduceMotion={reduceMotion} />
      </div>

      {showBrand ? (
        <div className="prologue-brand">
          <h1 className="prologue-brand__name">
            {PROLOGUE_TEAM_LINES.map((word) => (
              <span key={word} className="prologue-brand__line">
                {word}
              </span>
            ))}
          </h1>
          <p className="prologue-brand__tag">{PROLOGUE_TAGLINE}</p>
        </div>
      ) : null}

      <div className="prologue-stage">
        <div className="prologue-card">
          <DialogueBox
            speaker="robo"
            expression="explaining"
            speakerName="Robo"
            text={typed || '\u00a0'}
            reduceMotion={reduceMotion}
            onContinue={advance}
            continueLabel={
              doneTyping ? (last ? finalLabel : 'Continue') : 'Skip typing'
            }
          />
        </div>

        {onSkip ? (
          <button type="button" className="prologue-skip" onClick={onSkip}>
            Skip prologue
          </button>
        ) : null}
      </div>
    </div>
  );
}
