export type TextSize = 'md' | 'lg' | 'xl';

export type SettingsValues = {
  soundEnabled: boolean;
  reduceMotion: boolean;
  textSize: TextSize;
  classroomMode: boolean;
};

type SettingsScreenProps = {
  values: SettingsValues;
  onChange: (next: SettingsValues) => void;
  saveStatus?: string;
  onClose?: () => void;
};

/**
 * Settings presentation. Parent owns localStorage persistence.
 * Classroom on → suggest sound off + Reduce Motion on (caller may apply).
 */
export function SettingsScreen({
  values,
  onChange,
  saveStatus = 'Progress saves on this device when storage is available.',
  onClose,
}: SettingsScreenProps) {
  function patch(partial: Partial<SettingsValues>) {
    const next = { ...values, ...partial };
    if (partial.classroomMode === true) {
      next.soundEnabled = false;
      next.reduceMotion = true;
    }
    onChange(next);
  }

  return (
    <div className="menu-shell">
      <div className="menu-frame" role="dialog" aria-labelledby="settings-title">
        <header className="menu-top">
          <h1 id="settings-title">Settings</h1>
          {onClose ? (
            <button type="button" className="menu-close" aria-label="Close settings" onClick={onClose}>
              ✕
            </button>
          ) : null}
        </header>

        <div className="settings-list">
          <label className="settings-row">
            <span>Sound</span>
            <input
              type="checkbox"
              checked={values.soundEnabled}
              onChange={(e) => patch({ soundEnabled: e.target.checked })}
            />
          </label>

          <label className="settings-row">
            <span>Reduce Motion</span>
            <input
              type="checkbox"
              checked={values.reduceMotion}
              onChange={(e) => patch({ reduceMotion: e.target.checked })}
            />
          </label>

          <label className="settings-row">
            <span>Text size</span>
            <select
              value={values.textSize}
              onChange={(e) => patch({ textSize: e.target.value as TextSize })}
            >
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra large</option>
            </select>
          </label>

          <label className="settings-row">
            <span>Classroom mode</span>
            <input
              type="checkbox"
              checked={values.classroomMode}
              onChange={(e) => patch({ classroomMode: e.target.checked })}
            />
          </label>
          <p className="menu-note">
            Classroom uses bigger text, discussion pauses, sound off, and Reduce Motion on by
            default. Same mission — not a new mode.
          </p>
        </div>

        <p className="menu-note menu-note--status">{saveStatus}</p>
      </div>
    </div>
  );
}
