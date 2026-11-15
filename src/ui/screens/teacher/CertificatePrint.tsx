import { useState } from 'react';
import '../../../styles/learning-printables.css';

type CertificatePrintProps = {
  defaultName?: string;
  missionCompleted?: boolean;
};
/** The name stays only in this mounted component; the supplied artwork is unchanged. */
export function CertificatePrint({ defaultName = '' }: CertificatePrintProps) {
  const [name, setName] = useState(defaultName);
  const fontSize = `${Math.min(4, 95 / Math.max(name.trim().length, 20))}cqw`;
  return (
    <section
      className="teacher-print teacher-cert teacher-cert--art"
      id="print-certificate"
    >
      <header className="teacher-print__toolbar no-print">
        <h2>Junior Commander certificate</h2>
        <button
          type="button"
          className="ui-btn ui-btn--cta"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <label className="teacher-cert__name-field no-print">
        Commander name (not saved)
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="Type a name for printing"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <article
        className="teacher-cert__sheet"
        aria-label="Printable certificate"
      >
        <img
          className="teacher-cert__art"
          src="/teacher/certificate.png"
          alt="Junior Astronaut Certificate, celebrating completion of the Mars mission"
        />
        <span className="teacher-cert__art-name" style={{ fontSize }}>
          {name.trim()}
        </span>
      </article>
      <p className="teacher-print__note no-print">
        Prints on one landscape page. Leave the name blank to write it by hand;
        the date and signature lines are ready for handwriting.
      </p>
    </section>
  );
}
