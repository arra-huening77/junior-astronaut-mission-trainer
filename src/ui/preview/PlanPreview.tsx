import { useState } from 'react';
import type { SkyLevel } from '../../engine/types';
import { PlanScreen } from '../screens/PlanScreen';

/** Open /ui-preview.html?screen=plan */
export function PlanPreview() {
  const [sky, setSky] = useState<SkyLevel>('active');

  return (
    <div>
      <div className="ui-preview__dev" style={{ margin: '0.75rem', position: 'relative', zIndex: 2 }}>
        <strong>Plan preview</strong>
        {' · '}
        {(['calm', 'active', 'stormy'] as SkyLevel[]).map((level) => (
          <button key={level} type="button" onClick={() => setSky(level)} style={{ marginRight: 6 }}>
            {level}
          </button>
        ))}
      </div>
      <PlanScreen
        skyLevel={sky}
        skyStatus="saved"
        observationDate="2026-11-14"
        solarGainPreview={12}
        onBack={() => {
          window.location.href = '/ui-preview.html?screen=title';
        }}
        onLaunch={(cargo) => {
          window.alert(`Launch with: ${cargo.join(', ') || '(empty)'}`);
        }}
      />
    </div>
  );
}
