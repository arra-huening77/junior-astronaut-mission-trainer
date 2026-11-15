import { GLOSSARY } from './menu/fixtureCopy';

type LearnScreenProps = {
  onClose?: () => void;
};

/** Kid glossary — presentation only; Member 3 owns final glossary.json. */
export function LearnScreen({ onClose }: LearnScreenProps) {
  return (
    <div className="menu-shell">
      <div className="menu-frame" role="dialog" aria-labelledby="learn-title">
        <header className="menu-top">
          <h1 id="learn-title">Learn</h1>
          {onClose ? (
            <button type="button" className="menu-close" aria-label="Close learn" onClick={onClose}>
              ✕
            </button>
          ) : null}
        </header>

        <p className="menu-lead">Words you will hear on the mission.</p>

        <dl className="learn-list">
          {GLOSSARY.map((item) => (
            <div key={item.term} className="learn-item">
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
