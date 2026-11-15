import { useState } from 'react';
import { PhotoFrame } from '../components/PhotoFrame';
import type { AlbumCardRecord } from './album/fixtureCopy';

export type MissionAlbumScreenProps = {
  cards: AlbumCardRecord[];
  title?: string;
  onClose?: () => void;
};

/**
 * Mission Album — encountered Real Mars cards.
 * Engine supplies album IDs; parent resolves records. UI never invents facts.
 */
export function MissionAlbumScreen({
  cards,
  title = 'Mission Album',
  onClose,
}: MissionAlbumScreenProps) {
  const [openId, setOpenId] = useState<string | null>(cards[0]?.id ?? null);
  const open = cards.find((c) => c.id === openId) ?? null;

  return (
    <div className="album-shell">
      <div className="album-frame" role="dialog" aria-labelledby="album-title">
        <header className="album-top no-print">
          <div>
            <p className="album-eyebrow">Real Mars cards</p>
            <h1 id="album-title">{title}</h1>
            <p className="album-sub">
              {cards.length === 0
                ? 'No cards yet — play sols to collect them.'
                : `${cards.length} card${cards.length === 1 ? '' : 's'} collected this run.`}
            </p>
          </div>
          <div className="album-top__actions">
            <button
              type="button"
              className="album-btn"
              disabled={cards.length === 0}
              onClick={() => window.print()}
            >
              Print
            </button>
            {onClose ? (
              <button
                type="button"
                className="album-close"
                aria-label="Close album"
                onClick={onClose}
              >
                ✕
              </button>
            ) : null}
          </div>
        </header>

        {cards.length === 0 ? (
          <div className="album-empty">
            <img
              src="/assets/characters/robo_thinking.png"
              alt=""
              draggable={false}
            />
            <p>
              Encountered cards appear here even if you continue without opening
              each one.
            </p>
          </div>
        ) : (
          <div className="album-body">
            <div className="album-grid no-print" role="list">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  role="listitem"
                  className={
                    openId === card.id
                      ? 'album-thumb album-thumb--active'
                      : 'album-thumb'
                  }
                  onClick={() => setOpenId(card.id)}
                >
                  {card.photoSrc ? (
                    <img src={card.photoSrc} alt="" draggable={false} />
                  ) : (
                    <span className="album-thumb__missing">No photo</span>
                  )}
                  <span className="album-thumb__label">{card.title}</span>
                </button>
              ))}
            </div>

            {open ? (
              <article className="album-detail" aria-label={open.title}>
                <header>
                  <h2>{open.title}</h2>
                  <span className="album-pill">
                    {open.savedLabel ?? open.mediaLabel ?? 'Saved photo'}
                  </span>
                </header>
                {open.photoSrc ? (
                  <PhotoFrame
                    src={open.photoSrc}
                    alt={open.photoAlt}
                    credit={open.photoCredit}
                    savedLabel={open.savedLabel ?? open.mediaLabel ?? true}
                  />
                ) : (
                  <p className="album-missing">Photo not bundled yet.</p>
                )}
                <p className="album-fact">{open.fact}</p>
                {open.photoCaption ? <p>{open.photoCaption}</p> : null}
                {open.contextNote ? (
                  <p className="album-note">{open.contextNote}</p>
                ) : null}
                {open.observationNote ? <p>{open.observationNote}</p> : null}
                <p className="album-source">{open.sourceLabel}</p>
                {open.sourceUrl ? (
                  <a
                    className="album-link no-print"
                    href={open.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source
                  </a>
                ) : null}
              </article>
            ) : null}

            {/* Print sheet: all cards */}
            <div className="album-print-only" aria-hidden="true">
              {cards.map((card) => (
                <article key={`print-${card.id}`} className="album-print-card">
                  <h3>{card.title}</h3>
                  {card.photoSrc ? (
                    <img src={card.photoSrc} alt={card.photoAlt} />
                  ) : null}
                  <p>
                    {card.savedLabel ?? card.mediaLabel ?? 'Saved photo'} · {card.fact}
                  </p>
                  {card.photoCaption && <p>{card.photoCaption}</p>}
                  {card.contextNote && <p>{card.contextNote}</p>}
                  {card.observationNote && <p>{card.observationNote}</p>}
                  {card.photoSourceUrl && <p>{card.photoSourceUrl}</p>}
                  {card.sourceUrl && <p>{card.sourceUrl}</p>}
                  <p>
                    {card.photoCredit} · {card.sourceLabel}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
