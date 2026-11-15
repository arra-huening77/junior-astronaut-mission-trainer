type ClassroomPauseProps = {
  sol: number;
  question: string;
  teacherNote?: string;
  showTeacherNotes?: boolean;
  onContinue: () => void;
};

/** Projector-friendly discussion pause. Advances only when the teacher presses Continue. */
export function ClassroomPause({
  sol,
  question,
  teacherNote,
  showTeacherNotes = false,
  onContinue,
}: ClassroomPauseProps) {
  return (
    <section className="teacher-pause" aria-label={`Sol ${sol} discussion pause`}>
      <p className="teacher-pause__eyebrow">Pause for discussion · Sol {sol}</p>
      <h2 className="teacher-pause__question">{question}</h2>
      {showTeacherNotes && teacherNote ? (
        <aside className="teacher-pause__notes">
          <h3>Teacher note</h3>
          <p>{teacherNote}</p>
        </aside>
      ) : null}
      <button type="button" className="ui-btn ui-btn--cta" onClick={onContinue}>
        Continue
      </button>
    </section>
  );
}
