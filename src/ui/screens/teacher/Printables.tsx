import '../../../styles/learning-printables.css';
import { useState } from 'react';
import { getMediaCatalog } from '../../../content/media-catalog';
import {
  DISCUSSION_SAMPLES,
  LESSON_GOALS,
  LESSON_PLAN_STEPS,
  VOCABULARY,
} from './fixtureCopy';

const STUDENT_ACTIVITIES = [
  'Suggest supplies and explain one reason for packing them.',
  'Choose cargo together. Predict what the three meters will do.',
  'Explain a choice and listen to another idea. Record a result in the Mission Log.',
  'Compare the cost of a choice with its benefit. Read a Real Mars card together.',
  'Share one discovery and one change to try on another mission.',
];

export function LessonPlanPrint() {
  return (
    <section className="teacher-print lesson-plan" id="print-lesson-plan">
      <header className="teacher-print__toolbar no-print">
        <h2>Lesson plan</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <p className="no-print lesson-print-hint">
        Two clear A4 pages: teaching plan, then discussion and reflection. Use
        Print to print or save as PDF.
      </p>
      <article className="teacher-print__sheet lesson-sheet">
        <section className="lesson-page" aria-label="Lesson plan page 1">
          <header className="lesson-heading">
            <span className="lesson-kicker">TINY HABITAT · TEACHER GUIDE</span>
            <h3>Mars Mission Survival</h3>
            <p>Plan a mission. Make a choice. Discover the science.</p>
          </header>
          <div className="lesson-meta">
            <p>
              <strong>Teacher</strong>
              <span>____________________</span>
            </p>
            <p>
              <strong>Class / date</strong>
              <span>____________________</span>
            </p>
            <p>
              <strong>Ages</strong>
              <span>7–12</span>
            </p>
            <p>
              <strong>Suggested time</strong>
              <span>20–30 minutes</span>
            </p>
          </div>
          <div className="lesson-two-col">
            <section className="lesson-block">
              <h4>01 · Learning goals</h4>
              <ul>
                {LESSON_GOALS.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </section>
            <section className="lesson-block">
              <h4>02 · Materials &amp; setup</h4>
              <ul>
                <li>A browser with the mission open.</li>
                <li>A shared screen or projector for group play.</li>
                <li>Mission Log worksheets and pencils.</li>
                <li>
                  Optional: turn on Classroom presentation for discussion
                  pauses, bigger text, sound off and reduced motion.
                </li>
              </ul>
            </section>
          </div>
          <section className="lesson-block lesson-procedure">
            <h4>03 · Teaching &amp; learning activities</h4>
            <div className="lesson-table-wrap">
              <table className="lesson-table">
                <thead>
                  <tr>
                    <th scope="col">Step / time</th>
                    <th scope="col">Teacher guides</th>
                    <th scope="col">Children explore</th>
                  </tr>
                </thead>
                <tbody>
                  {LESSON_PLAN_STEPS.map((step, index) => (
                    <tr key={step.title}>
                      <th scope="row">{step.title}</th>
                      <td>{step.body}</td>
                      <td>{STUDENT_ACTIVITIES[index]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <aside className="lesson-callout">
            <strong>Keep the pace comfortable.</strong> Pause for reading and
            discussion. If the full ten-sol mission needs longer, continue it in
            another session using the same browser.
          </aside>
          <footer className="lesson-page-number">
            Mars Mission Survival · Teaching plan <span>1 / 2</span>
          </footer>
        </section>
        <section className="lesson-page" aria-label="Lesson plan page 2">
          <header className="lesson-heading">
            <span className="lesson-kicker">
              TINY HABITAT · DISCOVER TOGETHER
            </span>
            <h3>Discuss, reflect &amp; try again</h3>
            <p>
              Use these prompts as conversation starters, not a scored quiz.
            </p>
          </header>
          <section className="lesson-block">
            <h4>04 · Talk about the mission</h4>
            <div className="lesson-prompts">
              {[
                DISCUSSION_SAMPLES[0],
                DISCUSSION_SAMPLES[4],
                DISCUSSION_SAMPLES[5],
              ].map((item) => (
                <div key={item.sol}>
                  <strong>
                    Sol {item.sol} · {item.event}
                  </strong>
                  <p>{item.question}</p>
                  <small>{item.followUp}</small>
                </div>
              ))}
            </div>
          </section>
          <div className="lesson-two-col">
            <section className="lesson-block">
              <h4>05 · Look &amp; listen</h4>
              <ul>
                <li>Can children name a resource their choice used?</li>
                <li>Can they explain a benefit and a cost?</li>
                <li>
                  Can they share one real-world connection from a NASA card?
                </li>
              </ul>
              <p>No marks are needed. Listen for explanations and curiosity.</p>
            </section>
            <section className="lesson-block">
              <h4>06 · Support &amp; extend</h4>
              <ul>
                <li>Read dialogue aloud; let children point to the meters.</li>
                <li>Pair readers and invite different ideas.</li>
                <li>
                  For an extra challenge, compare two cargo plans and explain
                  their tradeoffs.
                </li>
              </ul>
            </section>
          </div>
          <section className="lesson-block">
            <h4>07 · Useful mission words</h4>
            <dl className="lesson-vocab">
              {VOCABULARY.map((word) => (
                <div key={word.term}>
                  <dt>{word.term}</dt>
                  <dd>{word.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="lesson-block lesson-reflection">
            <h4>08 · Teacher reflection</h4>
            <p>
              What sparked curiosity?
              <span />
            </p>
            <p>
              What needed another explanation?
              <span />
            </p>
            <p>
              What would we try next time?
              <span />
            </p>
          </section>
          <footer className="lesson-page-number">
            Mars Mission Survival · Reflection guide <span>2 / 2</span>
          </footer>
        </section>
      </article>
    </section>
  );
}

export function DiscussionPrint() {
  const pages = [DISCUSSION_SAMPLES.slice(0, 5), DISCUSSION_SAMPLES.slice(5)];
  return (
    <section className="teacher-print lesson-plan" id="print-discussion">
      <header className="teacher-print__toolbar no-print">
        <h2>Discussion questions</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <article className="teacher-print__sheet lesson-sheet">
        {pages.map((questions, index) => (
          <section
            key={index}
            className="lesson-page discussion-page"
            aria-label={`Discussion questions page ${index + 1}`}
          >
            <header className="lesson-heading">
              <span className="lesson-kicker">
                TINY HABITAT · TALK TOGETHER
              </span>
              <h3>Mission discussion cards</h3>
              <p>
                Sols {index === 0 ? '1–5' : '6–10'} · Share ideas, listen and
                discover. No quiz or score.
              </p>
            </header>
            <div className="discussion-cards">
              {questions.map((item) => (
                <section key={item.sol} className="discussion-card">
                  <header>
                    <span className="discussion-sol">SOL {item.sol}</span>
                    <h4>{item.event}</h4>
                  </header>
                  <div className="discussion-question">
                    <span>Talk about it</span>
                    <p>{item.question}</p>
                  </div>
                  <div className="discussion-follow">
                    <span>Explore a little more</span>
                    <p>{item.followUp}</p>
                  </div>
                </section>
              ))}
            </div>
            <aside className="lesson-callout">
              <strong>For the group:</strong> Ask one main question at a pause.
              Use the second prompt if children want to explore further. There
              is no required written answer.
            </aside>
            <footer className="lesson-page-number">
              Mars Mission Survival · Discussion questions{' '}
              <span>{index + 1} / 2</span>
            </footer>
          </section>
        ))}
      </article>
    </section>
  );
}

export function VocabularyPrint() {
  return (
    <section className="teacher-print lesson-plan" id="print-vocabulary">
      <header className="teacher-print__toolbar no-print">
        <h2>Vocabulary</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <article className="teacher-print__sheet lesson-sheet">
        <section
          className="lesson-page vocabulary-page"
          aria-label="Printable mission vocabulary"
        >
          <header className="lesson-heading">
            <span className="lesson-kicker">TINY HABITAT · MISSION WORDS</span>
            <h3>Words for your Mars adventure</h3>
            <p>A small guide to the big ideas you meet during the mission.</p>
          </header>
          <dl className="vocabulary-cards">
            {VOCABULARY.map((entry, index) => (
              <div key={entry.term} className="vocabulary-card">
                <span className="vocabulary-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <dt>{entry.term}</dt>
                <dd>{entry.meaning}</dd>
              </div>
            ))}
          </dl>
          <aside className="lesson-callout">
            <strong>Try it together:</strong> Point to something in the mission
            that matches a word. Explain it in your own words or draw a picture.
          </aside>
          <footer className="lesson-page-number">
            Mars Mission Survival · Vocabulary guide <span>1 / 1</span>
          </footer>
        </section>
      </article>
    </section>
  );
}

export function MissionLogPrint() {
  return (
    <section className="teacher-print lesson-plan" id="print-mission-log">
      <header className="teacher-print__toolbar no-print">
        <h2>Mission log worksheet</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <article className="teacher-print__sheet lesson-sheet">
        {[0, 1].map((page) => (
          <section
            key={page}
            className="lesson-page mission-log-page"
            aria-label={`Mission log page ${page + 1}`}
          >
            <header className="lesson-heading">
              <span className="lesson-kicker">
                TINY HABITAT · MY MISSION JOURNAL
              </span>
              <h3>My Mars mission log</h3>
              <p>
                Sols {page === 0 ? '1–5' : '6–10'} · Record your discoveries,
                one sol at a time.
              </p>
            </header>
            <div className="lesson-meta">
              <p>
                <strong>Name / team</strong>
                <span>____________________</span>
              </p>
              <p>
                <strong>Date</strong>
                <span>____________________</span>
              </p>
            </div>
            <div className="mission-log-key">
              <span>
                <strong>Life Support</strong> · air &amp; water
              </span>
              <span>
                <strong>Power</strong> · stored energy
              </span>
              <span>
                <strong>Shielding</strong> · protection
              </span>
            </div>
            <div className="lesson-table-wrap">
              <table className="mission-journal-table">
                <thead>
                  <tr>
                    <th scope="col">Sol</th>
                    <th scope="col">My prediction</th>
                    <th scope="col">Choice</th>
                    <th scope="col">Meters before → after</th>
                    <th scope="col">Why? What happened?</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }, (_, i) => page * 5 + i + 1).map(
                    (sol) => (
                      <tr key={sol}>
                        <th scope="row">{sol}</th>
                        <td>
                          <div className="journal-writing-lines" />
                        </td>
                        <td>
                          <span className="journal-choice-line" />
                        </td>
                        <td className="journal-meter-lines">
                          <p>Life: ____ → ____</p>
                          <p>Power: ____ → ____</p>
                          <p>Shield: ____ → ____</p>
                        </td>
                        <td>
                          <div className="journal-writing-lines" />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <section className="lesson-block journal-discovery">
              <h4>
                {page === 0
                  ? 'A discovery I want to remember'
                  : 'One thing I would try differently next time'}
              </h4>
              <div className="journal-reflection-line" />
              <div className="journal-reflection-line" />
            </section>
            <footer className="lesson-page-number">
              Mars Mission Survival · Mission Log <span>{page + 1} / 2</span>
            </footer>
          </section>
        ))}
      </article>
    </section>
  );
}

export function AlbumPrint({
  albumIds = [],
}: {
  albumIds?: readonly string[];
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(
    () => new Set(),
  );
  const catalog = getMediaCatalog();
  const cards = [...new Set(albumIds)].flatMap((id) => {
    const moment = catalog.realMoments[id];
    return moment
      ? [{ id, moment, photo: catalog.photos[moment.photoId] }]
      : [];
  });
  return (
    <section className="teacher-print" id="print-album">
      <header className="teacher-print__toolbar no-print">
        <h2>Collected NASA photo cards</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          disabled={!cards.length}
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <article className="teacher-print__sheet">
        <h3>Mission Album</h3>
        {!cards.length && (
          <p>
            No cards collected yet. Explore the Real Mars cards during the
            mission, then return here to print them.
          </p>
        )}
        <div className="teacher-album-grid">
          {cards.map(({ id, moment, photo }) => (
            <figure key={id} className="teacher-album-card">
              <img
                src={photo.src}
                alt={photo.altText}
                className="teacher-album-card__photo"
                loading="lazy"
              />
              <figcaption>
                <h4>{moment.title}</h4>
                <p>
                  {photo.savedLabel}
                  {photo.captureDate
                    ? ` · Captured ${photo.captureDate}`
                    : photo.publishedDate
                      ? ` · Published ${photo.publishedDate}`
                      : ''}
                </p>
                <div
                  id={`album-copy-${id}`}
                  className={`teacher-album-copy${expandedCards.has(id) ? ' is-expanded' : ''}`}
                  tabIndex={expandedCards.has(id) ? 0 : undefined}
                >
                  <p className="teacher-album-caption">{photo.caption}</p>
                  <div className="teacher-album-context">
                    {moment.contextNote && <p>{moment.contextNote}</p>}
                    {photo.contextNote &&
                      photo.contextNote !== moment.contextNote && (
                        <p>{photo.contextNote}</p>
                      )}
                  </div>
                  <p className="teacher-album-credit">Credit: {photo.credit}</p>
                </div>
                {(moment.contextNote ||
                  photo.contextNote ||
                  photo.caption.length > 100 ||
                  photo.credit.length > 40) && (
                  <button
                    type="button"
                    className="teacher-album-more no-print"
                    aria-expanded={expandedCards.has(id)}
                    aria-controls={`album-copy-${id}`}
                    onClick={() =>
                      setExpandedCards((current) => {
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  >
                    {expandedCards.has(id) ? 'See less' : 'See more'}
                    <span className="teacher-album-sr-only">
                      {' '}
                      about {moment.title}
                    </span>
                  </button>
                )}
                <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                  NASA source
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </article>
    </section>
  );
}
