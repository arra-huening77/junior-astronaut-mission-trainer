import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createSol01Scene } from '../../engine/scenes/sol01-touchdown';
import { createSol02Scene } from '../../engine/scenes/sol02-first-night';
import { createSol03Scene } from '../../engine/scenes/sol03-dust-warning';
import { createSol07Scene } from '../../engine/scenes/sol07-equipment-failure';
import type { SceneDefinition } from '../../engine/scene-types';
import { DialogueBox } from './DialogueBox';

afterEach(cleanup);

describe('authored crew expression presentation', () => {
  for (const speaker of ['kai', 'mei'] as const) {
    it(`changes ${speaker}'s portrait to match explanations, warnings and happy dialogue`, () => {
      const scenes: SceneDefinition[] = [
        createSol01Scene(),
        createSol02Scene(),
        createSol03Scene(),
        createSol07Scene(),
      ];
      const lines = scenes
        .flatMap((scene) => scene.steps)
        .filter((step) => step.type === 'dialogue' && step.speaker === speaker);
      const view = render(<div />);
      for (const expression of ['neutral', 'concerned', 'happy'] as const) {
        const line = lines.find(
          (step) => step.type === 'dialogue' && step.expression === expression,
        );
        expect(
          line,
          `${speaker} has an authored ${expression} dialogue`,
        ).toBeDefined();
        if (!line || line.type !== 'dialogue')
          throw new Error('Missing crew dialogue');
        view.rerender(
          <DialogueBox
            speaker={speaker}
            expression={expression}
            speakerName={speaker}
            text={line.textKey}
            onContinue={() => {}}
          />,
        );
        expect(view.container.querySelector('img')).toHaveAttribute(
          'src',
          `/assets/characters/${speaker}_${expression}.png`,
        );
      }
    });
  }
});
