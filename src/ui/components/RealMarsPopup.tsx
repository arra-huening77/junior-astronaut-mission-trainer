import { useEffect, useRef } from 'react';
import { RealMarsCard } from './RealMarsCard';
import type { ResolvedSceneContent } from './ScenePresenter';

/** Native modal supplies focus trapping and blocks choices behind the science card. */
export function RealMarsPopup({
  card,
  onClose,
}: {
  card: NonNullable<ResolvedSceneContent['realCard']>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialog.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      if (typeof dialog.close === 'function') dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      className="real-mars-popup"
      ref={ref}
      aria-label={`Real Mars: ${card.title}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        className="real-mars-popup__close"
        aria-label="Close"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <div className="real-mars-popup__body">
        <RealMarsCard {...card} collapsed={false} showCloseButton={false} />
      </div>
    </dialog>
  );
}
