const RESPONSIBILITIES = [
  "Understanding the DBMS concepts and indexing principles",
  "Designing and deciding the system workflow",
  "Defining and validating the recommendation approach",
  "Testing the application and its outputs",
  "Reviewing and correcting AI-assisted code",
  "Final integration and project decisions",
];

const AI_TOOLS = [
  {
    name: "ChatGPT",
    use: "Prompting, project planning, debugging guidance, technical explanations, and directing coding tasks.",
    accent: "cyan",
  },
  {
    name: "Claude AI",
    use: "UI/UX design review, frontend design feedback, and design corrections.",
    accent: "coral",
  },
  {
    name: "OpenCode",
    use: "Repository-level coding assistance, implementation, debugging, and feature refinement.",
    accent: "mint",
  },
  {
    name: "Amazon Q Developer",
    use: "Coding assistance, debugging, frontend/backend implementation, and refinement.",
    accent: "gold",
  },
  {
    name: "GPT in VS Code / GitHub Copilot",
    use: "Direct coding assistance, bug fixes, UI corrections, testing support, and final code refinements.",
    accent: "blue",
  },
];

export default function AiUsageView() {
  return (
    <div className="au-view">
      <header className="au-hero">
        <p className="au-eyebrow">Project disclosure</p>
        <h1 className="au-hero-title">AI-Assisted Development</h1>
        <p className="au-hero-sub">Human-led design, implementation, and validation</p>
      </header>

      <section className="au-statement" aria-labelledby="ai-assistance-heading">
        <h2 id="ai-assistance-heading">Role of AI Assistance</h2>
        <p>
          AI tools were used as development assistants during the project for coding support,
          debugging, brainstorming, and technical guidance.
        </p>
        <p>
          The project requirements, system understanding, design decisions, recommendation
          methodology, validation, testing, integration, and final implementation were reviewed
          and controlled by the developers.
        </p>
        <p>
          AI-generated suggestions were treated as assistance only. The developers verified the
          functionality, corrected errors, refined the implementation, and are responsible for
          the final submitted system.
        </p>
      </section>

      <section className="au-tools" aria-labelledby="ai-tools-heading">
        <div className="au-tools-heading">
          <p className="au-section-number">Development toolkit</p>
          <h2 id="ai-tools-heading">AI Tools Used</h2>
        </div>
        <div className="au-tools-grid">
          {AI_TOOLS.map((tool, index) => (
            <article className={`au-tool-card au-tool-${tool.accent}`} key={tool.name}>
              <div className="au-tool-marker" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <h3>{tool.name}</h3>
                <p><span>Use:</span> {tool.use}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="au-tools-note">
          AI tools were used selectively at different stages as development assistants. The team
          defined the project requirements, DBMS concepts, system workflow, recommendation
          methodology, design direction, and final decisions, and reviewed and validated the
          resulting implementation.
        </p>
      </section>

      <section className="au-responsibility" aria-labelledby="developer-responsibility-heading">
        <div className="au-responsibility-heading">
          <p className="au-section-number">Core accountability</p>
          <h2 id="developer-responsibility-heading">Developer Responsibility</h2>
        </div>
        <ul className="au-responsibility-list">
          {RESPONSIBILITIES.map((responsibility) => (
            <li key={responsibility}>{responsibility}</li>
          ))}
        </ul>
      </section>

      <footer className="au-final-statement">
        AI was used as a supporting development tool; the final project was understood, tested,
        reviewed, and validated by the developers.
      </footer>
    </div>
  );
}