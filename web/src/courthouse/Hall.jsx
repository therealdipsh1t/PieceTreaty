import { useMemo, useState } from "react";
import { CATALOG, CATALOG_SIZE_HINT } from "./catalog";
import { clearSession, fileCard, unfileCard } from "./session";
import CardTile from "./CardTile";
import FileModal from "./FileModal";

export default function Hall({ session, onSession, onSignOut }) {
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const filedCount = useMemo(
    () => CATALOG.filter((c) => (session.filed[c.id] || 0) > 0).length,
    [session]
  );
  const chase = CATALOG.filter((c) => c.chase);
  const commons = CATALOG.filter((c) => !c.chase);

  function file(card) {
    setBusy(true);
    onSession(fileCard(session, card.id));
    setBusy(false);
  }

  function unfile(card) {
    onSession(unfileCard(session, card.id));
  }

  function signOut() {
    clearSession();
    onSignOut();
  }

  return (
    <div className="pt-hall" style={{ backgroundImage: "url(/courthouse/hall.jpg)" }}>
      <div className="pt-hall-veil" />
      <header className="pt-top">
        <div>
          <p className="pt-stamp">THE COURTHOUSE</p>
          <h1>File a chase card.</h1>
        </div>
        <div className="pt-account">
          <span className="pt-email">{session.email}</span>
          <span className="pt-wallet" title="Embedded wallet bound to this email">
            {short(session.wallet)}
          </span>
          <button type="button" className="pt-text" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="pt-explain">
        <p>
          The binder already holds the catalog — about {CATALOG_SIZE_HINT} cards, decks, and trades.
          Commons never leave the game. Chase cards can be <strong>filed</strong>: same art, same
          stats, now a title deed on Monad.
        </p>
        <ul>
          <li>
            {filedCount} filed · {chase.length} chase in this drawer · {CATALOG_SIZE_HINT - CATALOG.length} more
            stay in-game
          </li>
          <li>No wallet popup on the door. The clerk attaches a wallet to your email the first time you file.</li>
        </ul>
      </section>

      <section className="pt-drawer">
        <div className="pt-drawer-head">
          <h2>Chase drawer</h2>
          <span>These can be filed</span>
        </div>
        <div className="pt-grid">
          {chase.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              filed={(session.filed[card.id] || 0) > 0}
              onOpen={setOpen}
            />
          ))}
        </div>
      </section>

      <section className="pt-drawer">
        <div className="pt-drawer-head">
          <h2>Starter copies</h2>
          <span>Playable. Not filed.</span>
        </div>
        <div className="pt-grid">
          {commons.map((card) => (
            <CardTile key={card.id} card={card} filed={false} onOpen={setOpen} />
          ))}
          <div className="pt-stack-card" aria-hidden>
            <strong>+{CATALOG_SIZE_HINT - CATALOG.length}</strong>
            <span>more cards live in the game binder and never mint</span>
          </div>
        </div>
      </section>

      <footer className="pt-foot">
        <span>Piece Treaty · filing hall</span>
        <a href="#desk">Owner mint desk</a>
      </footer>

      <FileModal
        card={open}
        filed={open ? (session.filed[open.id] || 0) > 0 : false}
        busy={busy}
        onClose={() => setOpen(null)}
        onFile={file}
        onUnfile={unfile}
      />
    </div>
  );
}

function short(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
