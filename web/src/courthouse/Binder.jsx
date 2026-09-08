import { useMemo, useState } from "react";
import { CATALOG, CATALOG_SIZE_HINT, byId, FINISH_LABEL } from "./catalog";
import { clearSession, fileCopy, toggleDeck, unfileCopy } from "./session";
import PrintedCard from "./PrintedCard";
import Inspect from "./Inspect";

export default function Binder({ session, onSession, onSignOut }) {
  const [tab, setTab] = useState("binder");
  const [openId, setOpenId] = useState(null);

  const ownedIds = useMemo(() => [...new Set(session.copies.map((c) => c.card))], [session.copies]);
  const openCard = openId ? byId[openId] : null;
  const openCopies = session.copies.filter((c) => c.card === openId);
  const filed = session.copies.filter((c) => c.filed);
  const tradable = session.copies.filter((c) => c.tradable && !c.filed);

  return (
    <main className="binder-shell">
      <header className="suite-header">
        <strong>Card binder</strong>
        <nav>
          <span className="suite-player">{session.name}</span>
          <code title="Embedded wallet">{short(session.wallet)}</code>
          <button type="button" className="suite-text" onClick={() => { clearSession(); onSignOut(); }}>
            Sign out
          </button>
        </nav>
      </header>

      <section className="binder-heading">
        <h1>{session.name}’s binder</h1>
        <div className="binder-count">
          <strong>
            {ownedIds.length}
            <span> / {CATALOG_SIZE_HINT}</span>
          </strong>
          <span>different cards in the live catalog</span>
        </div>
      </section>

      <div className="binder-nav">
        {[
          ["binder", "Collection"],
          ["decks", "Build a deck"],
          ["trades", "Trading table"],
        ].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <span className="binder-tickets">{filed.length} filed · {tradable.length} tradable unfiled</span>
      </div>

      {tab === "binder" && (
        <>
          <section className="binder-showcase">
            <div>
              <h2>Your pride and joy</h2>
              <p>Pin chase copies. Filing turns one into a title deed without leaving this binder.</p>
            </div>
            <div className="showcase-slots">
              {session.copies
                .filter((c) => c.filed || c.finish !== "standard")
                .slice(0, 3)
                .map((c) => (
                  <button key={c.uid} type="button" onClick={() => setOpenId(c.card)}>
                    <PrintedCard card={byId[c.card]} copy={c} filed={c.filed} small />
                    <span>{c.filed ? "Filed" : FINISH_LABEL[c.finish]}</span>
                  </button>
                ))}
            </div>
          </section>
          <section className="binder-grid" aria-label="Collection">
            {CATALOG.map((card) => {
              const copies = session.copies.filter((c) => c.card === card.id);
              const owned = copies.length > 0;
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`binder-slot ${owned ? "" : "unowned"}`}
                  onClick={() => owned && setOpenId(card.id)}
                >
                  <PrintedCard card={card} copy={copies[0]} filed={copies.some((c) => c.filed)} small />
                  <div className="binder-slot-label">
                    <strong>{card.name}</strong>
                    <span>
                      {owned
                        ? `${copies.length} ${copies.length === 1 ? "copy" : "copies"}${copies.some((c) => c.filed) ? " · filed" : ""}`
                        : card.chase
                          ? "Missing"
                          : "Starter"}
                    </span>
                  </div>
                </button>
              );
            })}
            <div className="binder-more">
              <strong>+{CATALOG_SIZE_HINT - CATALOG.length}</strong>
              <span>more identities live in the real binder and keep their existing art</span>
            </div>
          </section>
        </>
      )}

      {tab === "decks" && (
        <section className="deck-pane">
          <header>
            <span className="db-eyebrow">THE TRADING TABLE</span>
            <h2>Bring your best twenty.</h2>
            <p>Exactly 20 copies. Serials matter. A copy locked in a trade or unfiled starter still plays; only filed copies are title deeds.</p>
            <div className="db-count">
              <strong>
                {session.deck.length}
                <span>/20</span>
              </strong>
            </div>
          </header>
          <ol className="db-twenty">
            {Array.from({ length: 20 }, (_, i) => {
              const uid = session.deck[i];
              const copy = session.copies.find((c) => c.uid === uid);
              const card = copy ? byId[copy.card] : null;
              return (
                <li key={i} className={copy ? "filled" : ""}>
                  {card ? (
                    <button type="button" onClick={() => setOpenId(card.id)}>
                      <b>{card.cost}</b> {card.name}
                      <small>
                        {copy.uid.slice(-8)}
                        {copy.filed ? " · filed" : ""}
                      </small>
                    </button>
                  ) : (
                    <span>{String(i + 1).padStart(2, "0")}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {tab === "trades" && (
        <section className="trade-pane">
          <h2>Put something on the table.</h2>
          <p>Offer filed copies. Starter keepsakes cannot leave the account. Both collectors confirm; the deed transfers with the copy.</p>
          <div className="trade-row">
            {session.copies
              .filter((c) => c.filed)
              .map((c) => (
                <button key={c.uid} type="button" onClick={() => setOpenId(c.card)}>
                  <PrintedCard card={byId[c.card]} copy={c} filed small />
                  <span>Ready to trade · {c.uid.slice(-8)}</span>
                </button>
              ))}
            {filed.length === 0 && (
              <p className="empty">Nothing filed yet. Open a chase copy in the collection and stamp it.</p>
            )}
          </div>
        </section>
      )}

      <footer className="suite-foot">
        <span>Owned deck format · 20 cards · filing is optional</span>
        <a href="#desk">Owner mint desk</a>
      </footer>

      {openCard && (
        <Inspect
          card={openCard}
          copies={openCopies}
          deck={session.deck}
          onClose={() => setOpenId(null)}
          onFile={(uid) => onSession(fileCopy(session, uid))}
          onUnfile={(uid) => onSession(unfileCopy(session, uid))}
          onToggleDeck={(uid) => onSession(toggleDeck(session, uid))}
        />
      )}
    </main>
  );
}

function short(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
