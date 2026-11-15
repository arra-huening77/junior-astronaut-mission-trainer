import { getMediaCatalog } from '../../content/media-catalog';
import { CREDITS, DATASET_SOURCES } from './menu/fixtureCopy';

type SourcesScreenProps = {
  onClose?: () => void;
};

/** Sources & Credits — fixture rows until Member 3 finalizes attributions. */
export function SourcesScreen({ onClose }: SourcesScreenProps) {
  return (
    <div className="menu-shell">
      <div className="menu-frame" role="dialog" aria-labelledby="sources-title">
        <header className="menu-top">
          <h1 id="sources-title">Sources & Credits</h1>
          {onClose ? (
            <button
              type="button"
              className="menu-close"
              aria-label="Close sources"
              onClick={onClose}
            >
              ✕
            </button>
          ) : null}
        </header>

        <section className="menu-card">
          <h2>Datasets</h2>
          <ul className="sources-list">
            {DATASET_SOURCES.map((row) => (
              <li key={row.id}>
                <div className="sources-list__head">
                  <strong>{row.name}</strong>
                  <span className="sources-pill">{row.status}</span>
                </div>
                <p>{row.note}</p>
                <a href={row.url} target="_blank" rel="noreferrer">
                  Open source
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="menu-card">
          <h2>Photos</h2>
          <ul className="sources-list">
            {Object.entries(getMediaCatalog().photos).map(([id, row]) => (
              <li key={id}>
                <div className="sources-list__head">
                  <strong>{row.subject}</strong>
                  <span className="sources-pill sources-pill--photo">
                    {row.savedLabel}
                  </span>
                </div>
                <p>{row.credit}</p>
                <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                  Attribution link
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="menu-card">
          <h2>Credits</h2>
          <ul className="credits-list">
            {CREDITS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
