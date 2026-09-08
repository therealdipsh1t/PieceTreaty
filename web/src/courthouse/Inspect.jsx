import { useState } from "react";
import PrintedCard from "./PrintedCard";
import { FINISH_LABEL } from "./catalog";

export default function Inspect({
  card,
  copies,
  deck,
  filerVerified,
  onClose,
  onFile,
  onUnfile,
  onToggleDeck,
  onVerifyFiler,
}) {
  const [active, setActive] = useState(copies[0]?.uid || null);
  const copy = copies.find((c) => c.uid === active) || copies[0];
  const [stamping, setStamping] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [attest, setAttest] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  if (!card) return null;

  async function file() {
    if (!copy || !filerVerified) return;
    setStamping(true);
    await wait(800);
    onFile(copy.uid);
    setStamping(false);
  }

  function verify(e) {
    e.preventDefault();
    setVerifyError("");
    if (legalName.trim().length < 3) {
      setVerifyError("Put the name on this membership.");
      return;
    }
    if (!attest) {
      setVerifyError("Confirm this account is yours.");
      return;
    }
    onVerifyFiler(legalName.trim());
  }

  const inDeck = copy ? deck.includes(copy.uid) : false;

  return (
    <div className="cv-backdrop" onClick={onClose} role="presentation">
      <div className="cv-book" role="dialog" aria-labelledby="cv-title" onClick={(e) => e.stopPropagation()}>
        <header className="cv-binding">
          <div>
            <p className="cv-set-stamp">CARD BINDER · FIRST EDITION</p>
            <h2 id="cv-title">{card.name}</h2>
            <p>Inspect the printed face. File a chase copy to mint a title deed. Commons stay keepsakes.</p>
          </div>
          <button type="button" className="cv-close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="cv-book-spread">
          <div className="cv-felt">
            <div className={`cv-card-sleeve ${stamping ? "is-stamping" : ""}`}>
              <PrintedCard card={card} copy={copy} filed={copy?.filed} />
            </div>
            {copy && (
              <p className="cv-copy-caption">
                <strong>{FINISH_LABEL[copy.finish]}</strong>
                <code>{copy.uid}</code>
              </p>
            )}
          </div>
          <div className="cv-notebook">
            <div className="cv-page">
              <p className="cv-ink-label">Copies in this binder</p>
              <ul className="cv-copy-list">
                {copies.map((c) => (
                  <li key={c.uid}>
                    <div>
                      <b>{FINISH_LABEL[c.finish]}</b>
                      <code>{c.uid}</code>
                      <small>
                        {c.filed ? "Filed title deed" : c.tradable ? "Tradable copy" : "Starter keepsake · playable"}
                        {deck.includes(c.uid) ? " · in deck" : ""}
                      </small>
                    </div>
                    <button type="button" aria-pressed={active === c.uid} onClick={() => setActive(c.uid)}>
                      View
                    </button>
                  </li>
                ))}
              </ul>
              <dl className="cv-facts">
                <div>
                  <dt>Budget</dt>
                  <dd>{card.cost}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>
                    {card.kind} · {card.faction}
                  </dd>
                </div>
                <div>
                  <dt>On-chain</dt>
                  <dd>{copy?.filed ? "Filed (ERC-1155)" : card.chase ? "Not filed yet" : "Never — starter"}</dd>
                </div>
              </dl>
              <p className="cv-full-rules">{card.text}</p>
            </div>
            <div className="cv-context-tools">
              {copy && card.chase && !copy.filed && !filerVerified && (
                <form className="filer-verify" onSubmit={verify}>
                  <p>
                    You can play this copy now. Filing puts it on-chain, so we need a named member — not a
                    passport scan in this demo, just a person attached to the email.
                  </p>
                  <label>
                    Name on this membership
                    <input value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
                  </label>
                  <label className="filer-attest">
                    <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
                    This email account is mine. I am a real person, not a throwaway.
                  </label>
                  {verifyError && <p className="pt-alert">{verifyError}</p>}
                  <button type="submit" className="cv-file-btn">
                    Verify me to file
                  </button>
                </form>
              )}
              {copy && card.chase && !copy.filed && filerVerified && (
                <button type="button" className="cv-file-btn" onClick={file} disabled={stamping}>
                  {stamping ? "Stamping…" : "File this copy"}
                </button>
              )}
              {copy?.filed && (
                <button type="button" onClick={() => onUnfile(copy.uid)}>
                  Return to binder-only
                </button>
              )}
              {copy && (
                <button type="button" onClick={() => onToggleDeck(copy.uid)}>
                  {inDeck ? "Remove from 20-card deck" : "Sleeve into deck"}
                </button>
              )}
              {!card.chase && <p>Starter copies play. They do not file. That is how 600 cards stay a game instead of a mint.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
