import { useEffect, useState } from 'react';
import { Portrait } from './Portrait';

type AfterCardProps = {
  text: string;
  onContinue: () => void;
  continueLabel?: string;
  reduceMotion?: boolean;
  soundEnabled?: boolean;
};

/** Robo explains the committed result; this component never changes resources. */
export function AfterCard({
  text,
  onContinue,
  continueLabel = 'Continue',
  reduceMotion = false,
  soundEnabled = false,
}: AfterCardProps) {
  const [count, setCount] = useState(0);
  const complete = reduceMotion || count >= text.length;
  useEffect(() => {
    if (reduceMotion) return;
    let length = 0;
    const timer = window.setInterval(() => {
      length += 1;
      setCount((n) => Math.max(n, length));
      if (length >= text.length) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [text, reduceMotion]);
  useEffect(() => {
    if (!soundEnabled || complete) return;
    const audio = new Audio('/assets/audio/keyboard-typing.mp3');
    audio.loop = true;
    audio.volume = 0.1;
    void audio.play()?.catch(() => {});
    return () => audio.pause();
  }, [soundEnabled, complete]);
  useEffect(() => {
    function next(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) return;
      if (
        event.target instanceof Element &&
        event.target.closest('button, input, select, textarea, a')
      )
        return;
      event.preventDefault();
      if (complete) onContinue();
      else setCount(text.length);
    }
    window.addEventListener('keydown', next);
    return () => window.removeEventListener('keydown', next);
  }, [complete, text, onContinue]);
  return (
    <section className="ui-dialogue" aria-label="Robo explains the result">
      <div className="ui-dialogue__speaker" aria-hidden="true">
        <Portrait
          speaker="robo"
          expression="explaining"
          size="hero"
          reduceMotion={reduceMotion}
          alt=""
        />
      </div>
      <div className="ui-dialogue__bubble">
        <header className="ui-dialogue__name">Robo</header>
        {!complete && (
          <p className="app-meter-readout" aria-live="polite">
            {text}
          </p>
        )}
        <p className="ui-dialogue__text" onClick={() => setCount(text.length)}>
          {complete ? text : text.slice(0, count) || '\u00a0'}
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
