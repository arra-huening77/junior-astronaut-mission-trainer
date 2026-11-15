type RealMarsCardProps = {
  title: string;
  fact: string;
  sourceLabel: string;
  sourceUrl?: string;
  photoSrc?: string;
  photoAlt?: string;
  photoCredit?: string;
  savedPhoto?: boolean;
  mediaLabel?: string;
  /** Catalog label, e.g. "Saved photo" / "Saved illustration". */
  savedLabel?: string;
  photoSourceUrl?: string;
  photoCaption?: string;
  contextNote?: string;
  observationNote?: string;
  observationSourceUrl?: string;
  collapsed?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
};

export function RealMarsCard({
  title,
  fact,
  sourceLabel,
  sourceUrl,
  photoSrc,
  photoAlt = 'Saved NASA image',
  photoCredit,
  savedPhoto = true,
  mediaLabel = 'Saved photo',
  savedLabel,
  photoSourceUrl,
  photoCaption,
  contextNote,
  observationNote,
  observationSourceUrl,
  collapsed = true,
  onOpen,
  onClose,
  showCloseButton = true,
}: RealMarsCardProps) {
  const tag = savedLabel || (savedPhoto ? mediaLabel : '');

  if (collapsed) {
    return (
      <button type="button" className="ui-real-mars-badge" onClick={onOpen}>
        Real Mars, tap to read
      </button>
    );
  }

  return (
    <article className="ui-real-mars" aria-label={title}>
      <header className="ui-real-mars__header">
        <h2>{title}</h2>
        {tag ? <span className="ui-real-mars__tag">{tag}</span> : null}
      </header>
      {photoSrc ? (
        <figure className="ui-real-mars__figure">
          <img src={photoSrc} alt={photoAlt} />
          {photoCredit ? <figcaption>{photoCredit}</figcaption> : null}
        </figure>
      ) : (
        <p className="ui-real-mars__missing">Photo not bundled yet.</p>
      )}
      <p className="ui-real-mars__fact">{fact}</p>
      {observationNote ? <p>{observationNote}</p> : null}
      {contextNote ? <p className="ui-real-mars__note">{contextNote}</p> : null}
      <section className="ui-real-mars__sources" aria-label="Photo and sources">
        <h3>About this photo</h3>
        {photoCaption ? <p>{photoCaption}</p> : null}
        <p className="ui-real-mars__source">{sourceLabel}</p>
        {observationSourceUrl ? (
          <p>
            <a href={observationSourceUrl} target="_blank" rel="noreferrer">
              Mission solar observation source
            </a>
          </p>
        ) : null}
        {sourceUrl ? (
          <p>
            <a
              className="ui-real-mars__link"
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open source
            </a>
          </p>
        ) : null}
        {photoSourceUrl && photoSourceUrl !== sourceUrl ? (
          <p>
            <a href={photoSourceUrl} target="_blank" rel="noreferrer">
              Image source
            </a>
          </p>
        ) : null}
      </section>
      {showCloseButton && (
        <button type="button" className="ui-btn" onClick={onClose}>
          Close
        </button>
      )}
    </article>
  );
}
