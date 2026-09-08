import { artStyle } from "./art";
import { RARITY_MARK } from "./catalog";

export default function PrintedCard({ card, copy, filed, small }) {
  const finish = copy?.finish || "standard";
  const stamped = filed || copy?.filed;
  return (
    <article
      className={`cv-card cv-finish-${finish} ${small ? "is-small" : ""}`}
      data-faction={card.faction}
      data-rarity={card.rarity}
      style={{
        "--card-team-tint": tint(card.faction),
        "--card-rarity-ink": rarityInk(card.rarity),
      }}
    >
      <div className="cv-card-edition">
        <span>First edition</span>
        <span className="card-rarity-symbol">{RARITY_MARK[card.rarity]}</span>
      </div>
      <div className="cv-card-name">
        <b>
          <span>{card.cost}</span>
        </b>
        <h3>{card.name}</h3>
      </div>
      <div className="cv-card-art" style={artStyle(card.id)}>
        {stamped && <span className="pt-wax">FILED</span>}
      </div>
      <div className="cv-card-type">
        <span className="card-faction-label">{card.faction}</span>
        <span>{card.type}</span>
      </div>
      <div className="cv-card-text">
        <p className="card-effect-text">{card.text}</p>
      </div>
      <div className="cv-card-stats">
        {card.kind === "unit" ? (
          <>
            <span>
              <b>{card.atk}</b> ATK
            </span>
            <span>
              <b>{card.hp}</b> HP
            </span>
          </>
        ) : (
          <span>
            <b>—</b> {card.kind}
          </span>
        )}
        <span className="card-rarity-label">{card.rarity}</span>
      </div>
      <footer>
        <span>{copy ? copy.uid.slice(-10) : `No. ${card.id}`}</span>
        <span>{stamped ? "Title deed" : copy?.tradable ? "Tradable copy" : "Starter keepsake"}</span>
      </footer>
    </article>
  );
}

function tint(faction) {
  if (faction === "Corporate") return "#9aa7b8";
  if (faction === "Franchisees") return "#9aaa6e";
  if (faction === "Legal") return "#b5a3d1";
  return "#cf9d54";
}

function rarityInk(rarity) {
  if (rarity === "legendary") return "#8a5a12";
  if (rarity === "rare") return "#305b99";
  return "#476263";
}
