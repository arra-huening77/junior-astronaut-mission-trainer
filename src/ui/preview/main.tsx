import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles/index.css';
import '../../styles/ui-components.css';
import '../../styles/minigames.css';
import '../../styles/teacher-print.css';
import '../../styles/report.css';
import '../../styles/menu.css';
import '../../styles/plan.css';
import '../../styles/prologue.css';
import '../../styles/album.css';
import { AlbumPreview } from './AlbumPreview';
import { PanelsPreview } from './PanelsPreview';
import { PlanPreview } from './PlanPreview';
import { ProloguePreview } from './ProloguePreview';
import { ReportPreview } from './ReportPreview';
import { RoverPreview } from './RoverPreview';
import { TeachersPreview } from './TeachersPreview';
import { TitlePreview } from './TitlePreview';
import { UiPreview } from './UiPreview';

const params = new URLSearchParams(window.location.search);
const game = params.get('game');
const screen = params.get('screen');

const view =
  screen === 'teachers' || game === 'teachers' ? (
    <TeachersPreview />
  ) : screen === 'report' || game === 'report' ? (
    <ReportPreview />
  ) : screen === 'title' || game === 'title' ? (
    <TitlePreview />
  ) : screen === 'plan' || game === 'plan' ? (
    <PlanPreview />
  ) : screen === 'prologue' || game === 'prologue' ? (
    <ProloguePreview />
  ) : screen === 'album' || game === 'album' ? (
    <AlbumPreview />
  ) : game === 'rover' ? (
    <RoverPreview />
  ) : game === 'panels' ? (
    <PanelsPreview />
  ) : (
    <UiPreview />
  );

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{view}</React.StrictMode>,
);
