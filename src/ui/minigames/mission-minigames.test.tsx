import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CoverPanels } from './CoverPanels';
import { RoverDrive } from './RoverDrive';
afterEach(cleanup);
describe('mission mini-game keyboard escape', () => {
  for (const game of ['cover_panels', 'rover_drive'] as const) {
    it(`keeps native keyboard Skip available in ${game}`, () => {
      const result = vi.fn();
      const props = {
        reduceMotion: true,
        instructionKey: 'test',
        instruction: 'Try the task or skip.',
        onResult: result,
      };
      render(
        game === 'cover_panels' ? (
          <CoverPanels {...props} id="cover_panels" />
        ) : (
          <RoverDrive {...props} id="rover_drive" />
        ),
      );
      const skip = screen.getByRole('button', { name: 'Skip' });
      skip.focus();
      expect(fireEvent.keyDown(skip, { key: 'Enter' })).toBe(true);
      expect(result).not.toHaveBeenCalled();
      fireEvent.click(skip);
      fireEvent.click(skip);
      expect(result).toHaveBeenCalledExactlyOnceWith('skipped');
    });
  }
});
