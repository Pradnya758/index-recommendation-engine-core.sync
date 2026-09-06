export default function DevelopedByView() {
  const members = [
    { name: "Pradnya Lakshmi J R", registerNumber: "25BCE5165" },
    { name: "Rindhu Anchuri", registerNumber: "25BCE1800" },
  ];

  return (
    <div className="credits-view">
      <div className="credits-inner">
        <header className="credits-header">
          <div className="eyebrow">Database Intelligence Lab</div>
          <h1>Developed By</h1>
        </header>

        <section className="credits-roster" aria-label="Project team">
          {members.map((member, index) => (
            <article className="credits-profile" key={member.registerNumber}>
              <div className="credits-avatar" aria-label={`Photo placeholder for ${member.name}`}>
                <span>Photo</span>
              </div>
              <div className="credits-member-index">0{index + 1}</div>
              <h2>{member.name}</h2>
              <p>{member.registerNumber}</p>
            </article>
          ))}
        </section>

        <section className="guide-block">
          <div className="eyebrow">Guided By</div>
          <h2>Dr. Swaminathan A</h2>
          <p>Assistant Professor</p>
        </section>
      </div>
    </div>
  );
}