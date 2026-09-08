const KEY = "piece-treaty-session";

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.email) return null;
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
  const session = {
    email: email.trim().toLowerCase(),
    wallet,
    filed: {},
    createdAt: Date.now(),
  };
  saveSession(session);
  return session;
}

export function fileCard(session, cardId, amount = 1) {
  const next = {
    ...session,
    filed: { ...session.filed, [cardId]: (session.filed[cardId] || 0) + amount },
  };
  saveSession(next);
  return next;
}

export function unfileCard(session, cardId) {
  const filed = { ...session.filed };
  delete filed[cardId];
  const next = { ...session, filed };
  saveSession(next);
  return next;
}
