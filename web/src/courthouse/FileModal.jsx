import { useState } from "react";
import { artStyle } from "./art";

export default function FileModal({ card, filed, busy, onClose, onFile, onUnfile }) {
  const [stamping, setStamping] = useState(false);

  if (!card) return null;

  async function file() {
    setStamping(true);
    await wait(900);
    onFile(card);
    setStamping(false);
  }

  return (
    <div className="pt-modal-back" onClick={onClose} role="presentation">
      <div
        className={`pt-modal ${stamping ? "is-stamping" : ""}`}
        role="dialog"
        aria-labelledby="pt-file-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-modal-art" style={artStyle(card.id)}>
          {filed && <span className="pt-wax lg">FILED</span>}
          {stamping && <span className="pt-stamp-burst" aria-hidden />}
        </div>
        <div className="pt-modal-body">
          <p className="pt-stamp">THE CLERK</p>
          <h2 id="pt-file-title">{card.name}</h2>
          <p className="pt-card-line">
            {card.rarity} · {card.faction} · {card.type}
          </p>
          <p>{card.text}</p>
          {card.chase ? (
            filed ? (
              <>
                <p className="pt-ok">This copy is a title deed. It can leave the binder and trade for real.</p>
                <button type="button" className="pt-ghost" onClick={() => onUnfile(card)} disabled={busy}>
                  Return to binder-only
                </button>
              </>
            ) : (
              <>
                <p>File this chase card with the mime clerk. The catalog, stats and art stay in the game. The stamp is the deed.</p>
                <button type="button" onClick={file} disabled={busy || stamping}>
                  {stamping ? "Stamping…" : "File at the courthouse"}
                </button>
              </>
            )
          ) : (
            <p className="pt-warn">Starter copies stay in the binder. Filing is for chase cards only — not the whole 600-card catalog.</p>
          )}
          <button type="button" className="pt-back" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
