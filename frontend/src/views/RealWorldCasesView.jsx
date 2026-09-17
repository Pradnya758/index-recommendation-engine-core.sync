import { BarChart3, Building2, GraduationCap, Landmark, ShoppingCart } from "lucide-react";

const CASES = [
  {
    icon: ShoppingCart,
    title: "E-commerce order lookup",
    context: "A customer opens their paid orders, newest first.",
    query: "SELECT * FROM orders WHERE customer_id = 42 AND status = 'paid' ORDER BY order_date DESC;",
    index: "(customer_id, status, order_date)",
    reason: "Equality columns lead the index and the ordered date can reduce an extra sort.",
    caution: "Status alone may have low selectivity, so its position and the full workload matter.",
  },
  {
    icon: Landmark,
    title: "Bank account retrieval",
    context: "A service retrieves one account from a large customer table.",
    query: "SELECT * FROM accounts WHERE account_number = '12345678';",
    index: "(account_number)",
    reason: "A selective equality lookup can replace a full table scan with a B+ tree search.",
    caution: "No extra index is needed when account_number is already a primary or unique key.",
  },
  {
    icon: GraduationCap,
    title: "Student records by program",
    context: "An academic report filters students by program and enrollment year.",
    query: "SELECT * FROM students WHERE major = 'CSE' AND enrollment_year >= 2025;",
    index: "(major, enrollment_year)",
    reason: "The equality column comes before the range column, following the left-prefix rule.",
    caution: "For a small table or a major matching most students, a scan may still be cheaper.",
  },
  {
    icon: BarChart3,
    title: "Operational reporting",
    context: "A dashboard groups recent orders by status.",
    query: "SELECT status, COUNT(*) FROM orders WHERE order_date >= '2026-01-01' GROUP BY status;",
    index: "(order_date, status)",
    reason: "The index narrows the date range before supporting grouped access to status values.",
    caution: "Large result sets and frequent writes can outweigh the read benefit.",
  },
  {
    icon: Building2,
    title: "Large-scale application database",
    context: "A multi-tenant application retrieves recent activity for one organization.",
    query: "SELECT * FROM audit_events WHERE tenant_id = 84 ORDER BY created_at DESC;",
    index: "(tenant_id, created_at)",
    reason: "The tenant equality lookup narrows a large table before the ordered timestamp is read.",
    caution: "Retention volume, insert frequency, and an existing tenant prefix must be checked first.",
  },
];

export default function RealWorldCasesView() {
  return (
    <div className="cases-view">
      <div className="cases-inner">
        <header className="cases-header">
          <div className="eyebrow eyebrow-accent">Applied DBMS Learning</div>
          <h1>Real-World Cases</h1>
          <p>See how query shape, B+ tree access, selectivity, and existing keys affect practical index decisions.</p>
        </header>

        <div className="cases-concept-rail" aria-label="Index decision concepts">
          <span>Query predicate</span><i>+</i><span>Column order</span><i>+</i><span>Query plan</span><i>+</i><span>Read/write cost</span>
        </div>

        <section className="cases-grid">
          {CASES.map(({ icon: Icon, title, context, query, index, reason, caution }, caseNumber) => (
            <article className="case-study" key={title}>
              <div className="case-topline"><Icon size={22} /><span>CASE {String(caseNumber + 1).padStart(2, "0")}</span></div>
              <h2>{title}</h2>
              <p>{context}</p>
              <code>{query}</code>
              <div className="case-index"><small>Candidate index</small><strong>{index}</strong></div>
              <dl>
                <div><dt>Why it may help</dt><dd>{reason}</dd></div>
                <div><dt>Planner check</dt><dd>{caution}</dd></div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}