import { useState } from 'react';
import { useClassroomSettings } from '../../services/classroom-settings';
import { CertificatePrint } from './teacher/CertificatePrint';
import {
  AlbumPrint,
  DiscussionPrint,
  LessonPlanPrint,
  MissionLogPrint,
  VocabularyPrint,
} from './teacher/Printables';
import { LESSON_GOALS, LESSON_PLAN_STEPS } from './teacher/fixtureCopy';

type TeacherTab =
  | 'hub'
  | 'lesson'
  | 'discussion'
  | 'vocabulary'
  | 'worksheet'
  | 'album'
  | 'certificate';

type TeachersScreenProps = {
  classroomMode?: boolean;
  onClassroomModeChange?: (enabled: boolean) => void;
  onClose?: () => void;
  albumIds?: readonly string[];
  missionCompleted?: boolean;
};

const NAV: { id: TeacherTab; label: string; icon: string }[] = [
  { id: 'hub', label: 'Overview', icon: '📘' },
  { id: 'lesson', label: 'Lesson Plan', icon: '💡' },
  { id: 'discussion', label: 'Discussion', icon: '💬' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '✨' },
  { id: 'worksheet', label: 'Mission Log', icon: '📋' },
  { id: 'album', label: 'Photo cards', icon: '🖼' },
  { id: 'certificate', label: 'Certificate', icon: '⭐' },
];

/**
 * Teachers hub inspired by the Teacher Pack reference frame.
 * Uses collected mission cards and the shared classroom setting.
 */
export function TeachersScreen({
  classroomMode,
  onClassroomModeChange,
  onClose,
  albumIds = [],
  missionCompleted = false,
}: TeachersScreenProps) {
  const [tab, setTab] = useState<TeacherTab>('hub');
  const { settings, setClassroom, saveWarning } = useClassroomSettings();
  const classroom = classroomMode ?? settings.classroomMode;
  function changeClassroom(enabled: boolean) {
    setClassroom(enabled);
    onClassroomModeChange?.(enabled);
  }
  const descriptions: Record<TeacherTab, string> = {
    hub: '',
    lesson:
      'Prepare the group, guide play and reflect on the mission together.',
    discussion:
      'Two questions for each sol. Invite ideas rather than score answers.',
    vocabulary: 'Simple meanings for words children meet during the mission.',
    worksheet: '',
    album:
      'Print the NASA cards collected in this mission, with captions and credits.',
    certificate: '',
  };

  return (
    <div
      className={
        classroom
          ? 'tn-shell learn-shell tn-shell--classroom'
          : 'tn-shell learn-shell'
      }
    >
      <div className="tn-frame" role="region" aria-labelledby="tn-title">
        <header className="learn-heading no-print">
          <button
            type="button"
            className="learn-back"
            onClick={onClose}
            aria-label="Back to game"
          >
            Back to game
          </button>
          <h1 id="tn-title">Your Mars Learning</h1>
          <p>
            Explore the science behind your mission, one discovery at a time.
          </p>
        </header>

        <div className="tn-body">
          <nav className="tn-side no-print" aria-label="Teacher materials">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? 'tn-side__btn tn-side__btn--active'
                    : 'tn-side__btn'
                }
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                <span className="tn-side__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="tn-main" key={tab}>
            {descriptions[tab] && (
              <p className="tn-description no-print">{descriptions[tab]}</p>
            )}
            {tab === 'hub' ? (
              <section className="tn-panel no-print">
                <div className="learn-intro">
                  <h2>Explore Mars together</h2>
                </div>

                <div className="tn-grid">
                  <article className="tn-card">
                    <header>Learning Goals</header>
                    <ul className="tn-list">
                      {LESSON_GOALS.map((goal) => (
                        <li key={goal}>{goal}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="tn-card">
                    <header>Suggested Activities</header>
                    <ul className="tn-list">
                      {LESSON_PLAN_STEPS.slice(0, 3).map((step) => (
                        <li key={step.title}>
                          <strong>{step.title}</strong> — {step.body}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="tn-card tn-card--wide">
                    <header>How to use this pack</header>
                    <ul className="tn-list tn-list--checks">
                      <li>
                        Before playing: introduce Life Support, Power and
                        Shielding
                      </li>
                      <li>
                        During play: ask children to explain their choices
                      </li>
                      <li>
                        After playing: discuss what helped the outpost survive
                      </li>
                    </ul>
                    <div className="tn-fun">
                      <span aria-hidden="true">💡</span>
                      <p>
                        Fun fact: a sol is a Martian day — a little longer than
                        a day on Earth.
                      </p>
                    </div>
                  </article>
                </div>
              </section>
            ) : null}

            {tab === 'lesson' ? <LessonPlanPrint /> : null}
            {tab === 'discussion' ? <DiscussionPrint /> : null}
            {tab === 'vocabulary' ? <VocabularyPrint /> : null}
            {tab === 'worksheet' ? <MissionLogPrint /> : null}
            {tab === 'album' ? <AlbumPrint albumIds={albumIds} /> : null}
            {tab === 'certificate' ? (
              <CertificatePrint missionCompleted={missionCompleted} />
            ) : null}
          </div>
        </div>

        <footer className="tn-foot no-print">
          <div className="tn-classroom">
            <label className="tn-toggle">
              <input
                type="checkbox"
                checked={classroom}
                onChange={(e) => changeClassroom(e.target.checked)}
              />
              Classroom presentation &amp; discussion pauses
            </label>
            {onClose && (
              <button type="button" className="tn-action" onClick={onClose}>
                Back to game
              </button>
            )}
            {saveWarning && <p role="status">{saveWarning}</p>}
          </div>
        </footer>
      </div>
    </div>
  );
}
