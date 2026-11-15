import { useState } from 'react';
import { SettingsScreen, type SettingsValues } from '../screens/SettingsScreen';
import { SourcesScreen } from '../screens/SourcesScreen';
import { TitleScreen, type TitleAction } from '../screens/TitleScreen';
import { TeachersScreen } from '../screens/TeachersScreen';

type MenuView = 'title' | 'sources' | 'settings' | 'teachers';

/** Open /ui-preview.html?screen=title */
export function TitlePreview() {
  const [view, setView] = useState<MenuView>('title');
  const [canContinue, setCanContinue] = useState(false);
  const [settings, setSettings] = useState<SettingsValues>({
    soundEnabled: true,
    reduceMotion: false,
    textSize: 'md',
    classroomMode: false,
  });

  function handleAction(action: TitleAction) {
    if (action === 'start') {
      window.location.href = '/';
      return;
    }
    if (action === 'continue') {
      window.location.href = '/';
      return;
    }
    setView(action);
  }

  if (view === 'sources')
    return <SourcesScreen onClose={() => setView('title')} />;
  if (view === 'settings') {
    return (
      <SettingsScreen
        values={settings}
        onChange={setSettings}
        onClose={() => setView('title')}
      />
    );
  }
  if (view === 'teachers')
    return <TeachersScreen onClose={() => setView('title')} />;

  return (
    <div>
      <div
        className="ui-preview__dev"
        style={{ margin: '0.75rem', position: 'relative', zIndex: 4 }}
      >
        <strong>Title preview</strong>
        {' · '}
        <button type="button" onClick={() => setCanContinue((v) => !v)}>
          {canContinue ? 'Hide Continue' : 'Show Continue'}
        </button>
      </div>
      <TitleScreen
        canContinue={canContinue}
        sky={{
          level: 'active',
          status: 'saved',
          observationDate: '2026-11-14',
        }}
        onAction={handleAction}
      />
    </div>
  );
}
