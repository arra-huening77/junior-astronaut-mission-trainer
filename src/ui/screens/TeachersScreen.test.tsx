import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { TeachersScreen } from './TeachersScreen';
import { ClassroomPause } from './teacher/ClassroomPause';
import { readClassroomSettings } from '../../services/classroom-settings';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Teacher Pack', () => {
  it('has one navigation area, explains each section and removes demo controls', () => {
    render(<TeachersScreen />);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: /pause demo/i }),
    ).not.toBeInTheDocument();
    for (const name of [
      'Lesson Plan',
      'Discussion',
      'Vocabulary',
      'Mission Log',
      'Photo cards',
      'Certificate',
    ]) {
      const button = within(screen.getByRole('navigation')).getByRole(
        'button',
        { name: new RegExp(name) },
      );
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-current', 'page');
      expect(
        screen.getByRole('checkbox', { name: /Classroom presentation/ }),
      ).toBeInTheDocument();
    }
  });
  it('persists classroom defaults across remounts, preserving unrelated settings', () => {
    localStorage.setItem(
      'mms.settings',
      JSON.stringify({ extra: 'keep', textSize: 'xl' }),
    );
    const first = render(<TeachersScreen />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(readClassroomSettings()).toEqual({
      classroomMode: true,
      soundEnabled: false,
      reduceMotion: true,
      textSize: 'xl',
    });
    expect(JSON.parse(localStorage.getItem('mms.settings')!).extra).toBe(
      'keep',
    );
    first.unmount();
    render(<TeachersScreen />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
  it('keeps the toggle usable and explains when browser storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<TeachersScreen />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('could not be saved');
  });
  it('prints only collected real NASA cards with source and credit', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<TeachersScreen albumIds={['rm_gale', 'rm_gale', 'unknown']} />);
    fireEvent.click(screen.getByRole('button', { name: /Photo cards/ }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'NASA source' })).toHaveAttribute(
      'href',
      expect.stringContaining('nasa.gov'),
    );
    expect(screen.getByText(/Credit:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(print).toHaveBeenCalledOnce();
  });
  it('shows an honest empty album instead of fixture cards', () => {
    render(<TeachersScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Photo cards/ }));
    expect(screen.getByText(/No cards collected yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Print' })).toBeDisabled();
  });
  it('prints the certificate without a completion gate and does not save the typed name', () => {
    render(<TeachersScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Certificate/ }));
    expect(screen.getByRole('button', { name: 'Print' })).toBeEnabled();
    expect(
      screen.queryByText(/Finish the mission to print/),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Young Explorer' },
    });
    expect(screen.getByRole('button', { name: 'Print' })).toBeEnabled();
    expect(localStorage.length).toBe(0);
  });
  it('waits for the teacher to continue a discussion', () => {
    const next = vi.fn();
    render(
      <ClassroomPause
        sol={1}
        question="What did your cargo help with?"
        onContinue={next}
      />,
    );
    expect(next).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(next).toHaveBeenCalledOnce();
  });
});
