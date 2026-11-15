import { useState } from 'react';
import { MissionAlbumScreen } from '../screens/MissionAlbumScreen';
import { FIXTURE_ALBUM } from '../screens/album/fixtureCopy';

/** Open /ui-preview.html?screen=album */
export function AlbumPreview() {
  const [empty, setEmpty] = useState(false);

  return (
    <div>
      <div className="ui-preview__dev" style={{ margin: '0.75rem', position: 'relative', zIndex: 2 }}>
        <strong>Album preview</strong>
        {' · '}
        <button type="button" onClick={() => setEmpty((v) => !v)}>
          {empty ? 'Show cards' : 'Empty album'}
        </button>
      </div>
      <MissionAlbumScreen
        cards={empty ? [] : FIXTURE_ALBUM}
        onClose={() => {
          window.location.href = '/ui-preview.html?screen=report';
        }}
      />
    </div>
  );
}
