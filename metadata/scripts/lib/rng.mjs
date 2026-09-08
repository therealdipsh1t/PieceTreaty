/**
 * Deterministic PRNG from a seed string (token id + series).
 * Same token always gets the same traits/art.
 */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...parts) {
  const s = parts.join(":");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickWeighted(rng, options) {
  const total = options.reduce((sum, o) => sum + (o.weight ?? 1), 0);
  let roll = rng() * total;
  for (const opt of options) {
    roll -= opt.weight ?? 1;
    if (roll <= 0) return opt.value;
  }
  return options[options.length - 1].value;
}
