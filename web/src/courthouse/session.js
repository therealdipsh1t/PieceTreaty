import { CATALOG } from "./catalog";

const KEY = "piece-treaty-session-v2";

const DEMO_COPIES = [
  { uid: "PT-200-H1", card: 200, finish: "holographic", tradable: true, filed: false },
  { uid: "PT-031-F1", card: 31, finish: "foil", tradable: true, filed: false },
  { uid: "PT-001-S1", card: 1, finish: "standard", tradable: true, filed: false },
  { uid: "PT-113-F1", card: 113, finish: "foil", tradable: true, filed: false },
  { uid: "PT-039-S1", card: 39, finish: "standard", tradable: true, filed: false },
  { uid: "PT-087-H1", card: 87, finish: "holographic", tradable: true, filed: false },
  { uid: "PT-002-S1", card: 2, finish: "standard", tradable: false, filed: false },
  { uid: "PT-002-S2", card: 2, finish: "standard", tradable: false, filed: false },
  { uid: "PT-003-S1", card: 3, finish: "standard", tradable: false, filed: false },
  { uid: "PT-003-F1", card: 3, finish: "foil", tradable: true, filed: false },
];

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.email || !Array.isArray(s.copies)) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export async function walletForEmail(email) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`piece-treaty:${email.toLowerCase()}`));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex.slice(0, 40)}`;
}

export function createSession(email, wallet) {
  const now = Date.now();
  const session = {
    email: email.trim().toLowerCase(),
    name: email.split("@")[0] || "Builder",
    wallet,
    memberVerified: true,
    filerVerified: false,
    legalName: "",
    copies: DEMO_COPIES.map((c) => ({ ...c })),
    deck: [],
    createdAt: now,
    walletCreatedAt: now,
  };
  saveSession(session);
  return session;
}

export function verifyFiler(session, legalName) {
  const next = {
    ...session,
    filerVerified: true,
    legalName: legalName.trim(),
    filerVerifiedAt: Date.now(),
  };
  saveSession(next);
  return next;
}

export function fileCopy(session, uid) {
  if (!session.filerVerified) return session;
  const copies = session.copies.map((c) => {
    if (c.uid !== uid) return c;
    const def = CATALOG.find((d) => d.id === c.card);
    if (!def?.chase) return c;
    return { ...c, filed: true, tradable: true };
  });
  const next = { ...session, copies };
  saveSession(next);
  return next;
}

export function unfileCopy(session, uid) {
  const copies = session.copies.map((c) => (c.uid === uid ? { ...c, filed: false } : c));
  const next = { ...session, copies };
  saveSession(next);
  return next;
}

export function toggleDeck(session, uid) {
  const inDeck = session.deck.includes(uid);
  const deck = inDeck ? session.deck.filter((id) => id !== uid) : session.deck.length < 20 ? [...session.deck, uid] : session.deck;
  const next = { ...session, deck };
  saveSession(next);
  return next;
}
