type PhotoFrameProps = {
  src: string;
  alt: string;
  credit?: string;
  /** Catalog label text, or true for the default "Saved photo". */
  savedLabel?: string | boolean;
  mediaLabel?: string;
};

export function PhotoFrame({
  src,
  alt,
  credit,
  savedLabel = true,
  mediaLabel = 'Saved photo',
}: PhotoFrameProps) {
  const tag =
    typeof savedLabel === 'string'
      ? savedLabel
      : savedLabel
        ? mediaLabel
        : null;

  return (
    <figure className="ui-photo-frame">
      <div className="ui-photo-frame__mat">
        <img src={src} alt={alt} draggable={false} />
        {tag ? <span className="ui-photo-frame__tag">{tag}</span> : null}
      </div>
      {credit ? (
        <figcaption className="ui-photo-frame__credit">{credit}</figcaption>
      ) : null}
    </figure>
  );
}
