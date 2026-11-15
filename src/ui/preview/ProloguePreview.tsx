import { useState } from 'react';
import { PrologueScreen } from '../screens/PrologueScreen';

/** Open /ui-preview.html?screen=prologue */
export function ProloguePreview() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div>
      <div className="ui-preview__dev" style={{ margin: '0.75rem', position: 'relative', zIndex: 5 }}>
        <strong>Prologue preview</strong>
        {' · '}
        <button type="button" onClick={() => setReduceMotion((v) => !v)}>
          Reduce Motion: {reduceMotion ? 'on' : 'off'}
        </button>{' '}
        <button type="button" onClick={() => setKey((k) => k + 1)}>
          Restart
        </button>
      </div>
      <PrologueScreen
        key={key}
        reduceMotion={reduceMotion}
        onComplete={() => {
          window.alert('Prologue complete → Member 1 advances to Sol 1.');
        }}
        onSkip={() => {
          window.alert('Skip prologue → Sol 1.');
        }}
      />
    </div>
  );
}
