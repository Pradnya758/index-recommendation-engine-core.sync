import { BookOpen, ExternalLink, FileCode2 } from "lucide-react";

const REFERENCES = [
  {
    type: "Book",
    icon: BookOpen,
    title: "Database System Concepts — 7th Edition",
    topic: "Chapter 4 — Intermediate SQL: Index Definition in SQL",
    url: "https://www.db-book.com/slides-dir/PDF-dir/ch4.pdf",
    usedFor: "Used to understand index creation, why indexes can avoid scanning all tuples, and how an index can efficiently locate records matching a specified value.",
  },
  {
    type: "Official documentation",
    icon: FileCode2,
    title: "SQLite EXPLAIN QUERY PLAN",
    organization: "SQLite Documentation",
    url: "https://sqlite.org/eqp.html",
    usedFor: "Understanding and visualizing SQLite query execution plans.",
  },
  {
    type: "Official documentation",
    icon: FileCode2,
    title: "SQLGlot Documentation",
    organization: "SQLGlot",
    url: "https://sqlglot.com/",
    usedFor: "SQL parsing and extracting query structure and features.",
  },
];

export default function ReferencesView() {
  return (
    <div className="references-view">
      <div className="references-inner">
        <header className="references-header">
          <div className="eyebrow">Academic Sources</div>
          <h1>References</h1>
          <p>Core sources used to ground the engine's database theory, query-plan interpretation, and SQL analysis.</p>
        </header>

        <div className="references-list">
          {REFERENCES.map((reference, index) => {
            const Icon = reference.icon;
            return (
              <article className="reference-entry" key={reference.title}>
                <div className="reference-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="reference-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.6} /></div>
                <div className="reference-copy">
                  <div className="reference-type">{reference.type}</div>
                  <h2>{reference.title}</h2>
                  {reference.topic ? (
                    <>
                      <p className="reference-source"><strong>Topic</strong><span>{reference.topic}</span></p>
                      <p className="reference-source">
                        <strong>Link</strong>
                        <a href={reference.url} target="_blank" rel="noreferrer">{reference.url}</a>
                      </p>
                    </>
                  ) : (
                    <p className="reference-source">
                      {reference.authors || reference.organization}
                      {reference.publisher && <span>{reference.publisher}</span>}
                    </p>
                  )}
                  <div className="reference-purpose">
                    <strong>Used for</strong>
                    <span>{reference.usedFor}</span>
                  </div>
                </div>
                {reference.url && !reference.topic && (
                  <a className="reference-link" href={reference.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={17} aria-hidden="true" />
                    <span>Open source</span>
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}