import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../styles/index.css';
import '../../../styles/ui-components.css';
import '../../../styles/minigames.css';
import { LeakPreview } from './LeakPreview';
import { WiresPreview } from './WiresPreview';

const params = new URLSearchParams(window.location.search);
const game = params.get('game');

const view =
  game === 'wires' ? (
    <WiresPreview />
  ) : game === 'leak' ? (
    <LeakPreview />
  ) : (
    <div className="ui-preview mg-preview">
      <h1>Mini-game preview (Member 2)</h1>
      <ul>
        <li>
          <a href="?game=wires">Repair Wires</a>
        </li>
        <li>
          <a href="?game=leak">Patch Leak</a>
        </li>
      </ul>
    </div>
  );

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{view}</React.StrictMode>,
);