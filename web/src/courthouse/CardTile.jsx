export default function CardTile({ card, filed, onOpen }) {
  return (
    <button type="button" className={`pt-card ${filed ? "is-filed" : ""}`} onClick={() => onOpen(card)}>
      <span className="pt-card-art" style={{ backgroundImage: `url(${card.image})` }} />
      <span className="pt-card-meta">
        <span className={`pt-rarity ${card.rarity}`}>{card.rarity}</span>
        <span className="pt-faction">{card.faction}</span>
      </span>
      <strong>{card.name}</strong>
      <em>
        {card.copies} cop{card.copies === 1 ? "y" : "ies"} · {card.type}
      </em>
      {filed ? <span className="pt-wax">FILED</span> : !card.chase ? <span className="pt-binder-only">Binder only</span> : null}
    </button>
  );
}
