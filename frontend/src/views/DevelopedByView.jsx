import pradnyaPhoto from "../assets/pradnya-lakshmi-j-r.png";
import rindhuPhoto from "../assets/rindhu-anchuri.png";

export default function DevelopedByView() {
  const members = [
    {
      name: "Pradnya Lakshmi J R",
      registerNumber: "25BCE5165",
      photo: pradnyaPhoto,
      photoClassName: "credits-photo-pradnya",
    },
    {
      name: "Rindhu Anchuri",
      registerNumber: "25BCE1800",
      photo: rindhuPhoto,
      photoClassName: "credits-photo-rindhu",
    },
  ];

  return (
    <div className="credits-view">
      <div className="credits-inner">
        <header className="credits-header">
          <div className="eyebrow">Database Intelligence Lab</div>
          <h1>Developed By</h1>
          <div className="credits-team-name">CORE SYNC</div>
        </header>

        <section className="credits-roster" aria-label="Project team">
          {members.map((member, index) => (
            <article
              className="credits-profile"
              data-index={String(index + 1).padStart(2, "0")}
              key={member.registerNumber}
            >
              <div className="credits-avatar">
                <img
                  className={member.photoClassName}
                  src={member.photo}
                  alt={`${member.name}, project developer`}
                />
              </div>
              <h2>{member.name}</h2>
              <p className="credits-register">{member.registerNumber}</p>
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