import { BookOpen, ExternalLink, FileCode2 } from "lucide-react";

const REFERENCES = [
  {
    type: "Book",
    icon: BookOpen,
    title: "Database System Concepts",
    authors: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    publisher: "McGraw-Hill",
    usedFor: "Database indexing, query processing, B+ trees, and fundamental DBMS concepts.",
  },
  {
    type: "Official documentation",
    icon: FileCode2,
    title: "SQLite Query Planning",
    organization: "SQLite Documentation",
    url: "https://www.sqlite.org/queryplanner.html",
    usedFor: "Understanding how SQLite uses indexes, table scans, and query planning.",
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
                  <p className="reference-source">
                    {reference.authors || reference.organization}
                    {reference.publisher && <span>{reference.publisher}</span>}
                  </p>
                  <div className="reference-purpose">
                    <strong>Used for</strong>
                    <span>{reference.usedFor}</span>
                  </div>
                </div>
                {reference.url && (
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