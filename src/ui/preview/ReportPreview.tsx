import { useState } from 'react';
import { ReportScreen } from '../screens/ReportScreen';
import {
  GENTLE_HISTORY,
  SUCCESS_HISTORY,
  TEMPLATE_DEBRIEF_GENTLE,
  TEMPLATE_DEBRIEF_SUCCESS,
} from '../screens/report/fixtureCopy';

/** Open /ui-preview.html?screen=report */
export function ReportPreview() {
  const [mode, setMode] = useState<'success' | 'gentle'>('success');
  const [thinking, setThinking] = useState(false);

  const history = mode === 'success' ? SUCCESS_HISTORY : GENTLE_HISTORY;
  const debrief = thinking
    ? null
    : {
        source: 'template' as const,
        text: mode === 'success' ? TEMPLATE_DEBRIEF_SUCCESS : TEMPLATE_DEBRIEF_GENTLE,
      };

  return (
    <div>
      <div className="ui-preview__dev" style={{ margin: '0.75rem', position: 'relative', zIndex: 2 }}>
        <strong>Report preview</strong>
        {' · '}
        <button type="button" onClick={() => setMode('success')}>
          Success
        </button>{' '}
        <button type="button" onClick={() => setMode('gentle')}>
          Gentle
        </button>{' '}
        <button type="button" onClick={() => setThinking((v) => !v)}>
          {thinking ? 'Show template' : 'Robo thinking…'}
        </button>
      </div>
      <ReportScreen
        ending={mode}
        failedMeter={mode === 'gentle' ? 'power' : null}
        history={history}
        skyLevel="active"
        commanderStyle={mode === 'success' ? 'Careful Planner' : 'Brave Explorer'}
        commanderName="Ava"
        debrief={debrief}
        debriefPending={thinking}
        albumCount={mode === 'success' ? 8 : 5}
        canRetrySol={mode === 'gentle'}
        onRetryMission={() => undefined}
        onRetrySol={() => undefined}
        onOpenAlbum={() => undefined}
        onOpenCertificate={() => undefined}
        onClose={() => {
          window.location.href = '/ui-preview.html';
        }}
      />
    </div>
  );
}
