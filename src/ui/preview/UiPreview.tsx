import { useCallback, useMemo, useState } from 'react';
import type { SceneInput, SceneStep } from '../../engine/scene-types';
import type { ChoiceId, Meters, MoodId } from '../../engine/types';
import { ScenePresenter } from '../components/ScenePresenter';
import { SceneScreen } from '../screens/SceneScreen';
import { OUTPOST_PATH_START } from '../components/outpostLayout';
import { alertForMood } from '../presentation/eventAlert';
import {
  PREVIEW_LAYERS,
  PREVIEW_METERS,
  PREVIEW_NOTES,
  PREVIEW_SPOTS,
} from './fixtures';
import {
  SOL1_PREVIEW_STEPS,
  contentForStep,
  nextStepId,
} from './sol1Fixture';

/**
 * Member 4 harness: contract-driven Sol 1 preview path.
 * Open /ui-preview.html — does not rewrite App.tsx.
 */
export function UiPreview() {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [previewMood, setPreviewMood] = useState<MoodId | null>(null);
  const [stepId, setStepId] = useState(SOL1_PREVIEW_STEPS[0].id);
  const [choiceId, setChoiceId] = useState<ChoiceId | undefined>();
  const [meters, setMeters] = useState<Meters>(PREVIEW_METERS);
  const [log, setLog] = useState<string[]>([]);
  const eventAlert = useMemo(() => alertForMood(previewMood), [previewMood]);
  const layers = useMemo(
    () => ({
      ...PREVIEW_LAYERS,
      sky: (previewMood === 'dust_storm'
        ? 'dust'
        : previewMood === 'cold_night'
          ? 'night'
          : previewMood === 'solar_storm' || previewMood === 'finale_storm'
            ? 'dusk'
            : PREVIEW_LAYERS.sky) as typeof PREVIEW_LAYERS.sky,
      solar: (previewMood === 'dust_storm' ? 'dusty' : 'clean') as 'clean' | 'dusty',
      frost: previewMood === 'cold_night',
    }),
    [previewMood],
  );

  const step = useMemo(
    () => SOL1_PREVIEW_STEPS.find((s) => s.id === stepId) ?? SOL1_PREVIEW_STEPS[0],
    [stepId],
  );

  const content = useMemo(() => contentForStep(step, choiceId), [step, choiceId]);

  const goTo = useCallback((id: string | null) => {
    if (!id) {
      setLog((rows) => [...rows, 'Timeline complete (fixture).']);
      return;
    }
    setStepId(id);
  }, []);

  const onInput = useCallback(
    (input: SceneInput) => {
      if (input.stepId !== step.id) return;
      setLog((rows) => [...rows, `${input.type} @ ${input.stepId}`]);

      if (input.type === 'choose') {
        setChoiceId(input.choiceId);
        setMeters((m) => ({
          ...m,
          power: Math.max(
            0,
            m.power - (input.choiceId === 'C' ? 10 : input.choiceId === 'B' ? 5 : 0),
          ),
        }));
        goTo(nextStepId(SOL1_PREVIEW_STEPS, step, input.choiceId));
        return;
      }

      if (input.type === 'select_spot') {
        return;
      }

      if (
        input.type === 'advance' ||
        input.type === 'walk_finished' ||
        input.type === 'mini_game_result'
      ) {
        goTo(nextStepId(SOL1_PREVIEW_STEPS, step, choiceId));
      }
    },
    [step, choiceId, goTo],
  );

  function jump(target: SceneStep['type']) {
    const found = SOL1_PREVIEW_STEPS.find((s) => s.type === target);
    if (found) setStepId(found.id);
  }

  return (
    <div className="ui-preview">
      <details className="ui-preview__dev">
        <summary>Preview controls</summary>
        <label>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
          Reduce Motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={showBuildings}
            onChange={(e) => setShowBuildings(e.target.checked)}
          />
          Buildings
        </label>
        <label>
          Event alert
          <select
            value={previewMood ?? ''}
            onChange={(e) =>
              setPreviewMood(e.target.value === '' ? null : (e.target.value as MoodId))
            }
          >
            <option value="">None</option>
            <option value="dust_storm">Dust storm</option>
            <option value="solar_storm">Solar storm</option>
            <option value="alarm_red">Critical</option>
            <option value="cold_night">Cold night</option>
            <option value="meteors">Meteors</option>
          </select>
        </label>
        <nav className="ui-preview__modes" aria-label="Jump to step type">
          {(['narration', 'walk', 'dialogue', 'choice', 'after', 'real_card'] as const).map(
            (type) => (
              <button key={type} type="button" onClick={() => jump(type)}>
                {type}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => {
              setStepId(SOL1_PREVIEW_STEPS[0].id);
              setChoiceId(undefined);
              setMeters(PREVIEW_METERS);
              setLog([]);
            }}
          >
            restart
          </button>
        </nav>
        <p>
          Active step: <code>{step.id}</code> ({step.type})
        </p>
        <ul className="ui-preview__notes">
          {PREVIEW_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>Real Mars cards resolve from media catalog (imageType / savedLabel / credit).</li>
        </ul>
        {log.length > 0 ? (
          <ol className="ui-preview__notes">
            {log.slice(-6).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        ) : null}
      </details>

      <SceneScreen
        meters={meters}
        sol={1}
        phaseLabel="Day"
        clockLabel="08:00"
        reduceMotion={reduceMotion}
        eventAlert={eventAlert}
      >
        <ScenePresenter
          step={step}
          reduceMotion={reduceMotion}
          onInput={onInput}
          content={content}
          spots={PREVIEW_SPOTS}
          layers={layers}
          moodTintClassName={
            previewMood === 'dust_storm'
              ? 'ui-mood--dust'
              : previewMood === 'cold_night'
                ? 'ui-mood--cold'
                : previewMood === 'solar_storm' || previewMood === 'finale_storm'
                  ? 'ui-mood--solar'
                  : undefined
          }
          settings={{ reduceMotion, soundEnabled: false }}
          showBuildings={showBuildings}
          commanderStart={{ ...OUTPOST_PATH_START }}
        />
      </SceneScreen>
    </div>
  );
}
