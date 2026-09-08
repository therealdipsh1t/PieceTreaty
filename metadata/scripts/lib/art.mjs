/**
 * Procedural SVG mime portraits - no external image tools required.
 * Traits drive colors, props, and expression shapes.
 */

const OUTFIT_COLORS = {
  "Classic Mime": { body: "#f5f5f5", trim: "#111111", stripe: true },
  "Legal Robe": { body: "#1a1a2e", trim: "#c9a227", stripe: false },
  "Pinstripe Suit": { body: "#2c3340", trim: "#e8e8e8", stripe: true },
  Tuxedo: { body: "#111111", trim: "#f5f5f5", stripe: false },
  "High-Vis Vest": { body: "#2a2a2a", trim: "#ffcc00", stripe: false },
  "Barrister Wig": { body: "#2a2038", trim: "#e8dcc8", stripe: false },
  "Paralegal Chic": { body: "#3a2a4a", trim: "#7c6af7", stripe: false },
  "Shadow Counsel": { body: "#0a0a0a", trim: "#4de1c1", stripe: false },
  "Mime Clerk": { body: "#ececec", trim: "#333333", stripe: true },
  "Judge Robes (Unofficial)": { body: "#1a1020", trim: "#b8860b", stripe: false },
};

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mouthPath(expression) {
  switch (expression) {
    case "Silent Shock":
    case "Objection!":
      return `<ellipse cx="200" cy="268" rx="14" ry="18" fill="none" stroke="#111" stroke-width="4"/>`;
    case "Side-Eye":
    case "Cross-Examine":
      return `<path d="M175 265 Q200 280 225 265" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
    case "Smug":
    case "Overruled Smile":
      return `<path d="M175 270 Q200 255 225 270" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
    case "Plead":
    case "Sustained Silence":
      return `<path d="M178 275 Q200 290 222 275" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
    case "Mic Drop":
    case "Rest My Case":
      return `<line x1="180" y1="268" x2="220" y2="268" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
    default:
      return `<path d="M180 270 Q200 278 220 270" fill="none" stroke="#111" stroke-width="4"/>`;
  }
}

function eyesSvg(expression) {
  const sideEye = expression === "Side-Eye" || expression === "Cross-Examine";
  if (sideEye) {
    return `
      <ellipse cx="168" cy="220" rx="10" ry="12" fill="#111"/>
      <ellipse cx="232" cy="220" rx="10" ry="12" fill="#111"/>
      <circle cx="171" cy="218" r="3" fill="#fff"/>
      <circle cx="235" cy="218" r="3" fill="#fff"/>
      <path d="M150 200 Q168 192 186 200" fill="none" stroke="#111" stroke-width="3"/>
      <path d="M214 200 Q232 192 250 200" fill="none" stroke="#111" stroke-width="3"/>
    `;
  }
  return `
    <ellipse cx="168" cy="222" rx="9" ry="11" fill="#111"/>
    <ellipse cx="232" cy="222" rx="9" ry="11" fill="#111"/>
    <circle cx="170" cy="219" r="2.5" fill="#fff"/>
    <circle cx="234" cy="219" r="2.5" fill="#fff"/>
  `;
}

function propSvg(prop, accent) {
  switch (prop) {
    case "Gavel":
      return `
        <g transform="translate(268,200) rotate(25)">
          <rect x="0" y="20" width="8" height="50" rx="2" fill="#8B5A2B"/>
          <rect x="-10" y="8" width="28" height="16" rx="3" fill="#A0673B"/>
        </g>`;
    case "Briefcase":
    case "Legal Brief":
      return `
        <g transform="translate(255,250)">
          <rect x="0" y="10" width="48" height="36" rx="4" fill="#3d2914" stroke="${accent}" stroke-width="2"/>
          <rect x="18" y="4" width="12" height="10" rx="2" fill="#5a3d1a"/>
          <line x1="0" y1="24" x2="48" y2="24" stroke="${accent}" stroke-width="1.5"/>
        </g>`;
    case "Red Balloon":
      return `
        <g transform="translate(270,120)">
          <line x1="18" y1="40" x2="18" y2="100" stroke="#ccc" stroke-width="1.5"/>
          <ellipse cx="18" cy="28" rx="20" ry="26" fill="#e63946"/>
          <path d="M18 54 L14 60 L22 60 Z" fill="#e63946"/>
        </g>`;
    case "Subpoena Scroll":
    case "Contempt Citation":
      return `
        <g transform="translate(258,230)">
          <path d="M0 40 Q8 10 20 8 Q32 10 40 40 Q32 55 20 52 Q8 55 0 40 Z" fill="#f4e4bc" stroke="#c4a574" stroke-width="1.5"/>
          <line x1="10" y1="22" x2="30" y2="22" stroke="#8a7040" stroke-width="1"/>
          <line x1="10" y1="30" x2="28" y2="30" stroke="#8a7040" stroke-width="1"/>
          <line x1="10" y1="38" x2="26" y2="38" stroke="#8a7040" stroke-width="1"/>
        </g>`;
    case "Golden Scale":
      return `
        <g transform="translate(260,180)">
          <line x1="24" y1="10" x2="24" y2="70" stroke="${accent}" stroke-width="3"/>
          <line x1="4" y1="20" x2="44" y2="20" stroke="${accent}" stroke-width="3"/>
          <circle cx="4" cy="32" r="10" fill="none" stroke="${accent}" stroke-width="2"/>
          <circle cx="44" cy="32" r="10" fill="none" stroke="${accent}" stroke-width="2"/>
        </g>`;
    case "Stamp of Approval":
      return `
        <g transform="translate(265,240)">
          <circle cx="22" cy="22" r="20" fill="none" stroke="#c0392b" stroke-width="3"/>
          <text x="22" y="26" text-anchor="middle" font-size="10" fill="#c0392b" font-family="monospace">OK</text>
        </g>`;
    case "Exhibit A":
      return `
        <g transform="translate(260,235)">
          <rect x="0" y="0" width="44" height="56" rx="2" fill="#f8f4e8" stroke="#888" stroke-width="1.5"/>
          <text x="22" y="32" text-anchor="middle" font-size="14" font-weight="bold" fill="#333" font-family="serif">A</text>
        </g>`;
    case "Pocket Constitution":
      return `
        <g transform="translate(262,245)">
          <rect x="0" y="0" width="36" height="48" rx="2" fill="#1a3a5c" stroke="${accent}" stroke-width="1.5"/>
          <text x="18" y="28" text-anchor="middle" font-size="9" fill="#f0d78c" font-family="serif">§</text>
        </g>`;
    case "Invisible Box":
    default:
      return `
        <g transform="translate(250,200)" opacity="0.85">
          <rect x="0" y="0" width="70" height="70" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="6 4"/>
          <circle cx="0" cy="0" r="3" fill="${accent}"/>
          <circle cx="70" cy="0" r="3" fill="${accent}"/>
          <circle cx="0" cy="70" r="3" fill="${accent}"/>
          <circle cx="70" cy="70" r="3" fill="${accent}"/>
        </g>`;
  }
}

function backgroundLayers(bgName, palette, stripes) {
  const { bg, accent, floor } = palette;
  let extra = "";
  if (bgName === "Jail Stripe" || stripes) {
    extra += Array.from({ length: 8 }, (_, i) => {
      const x = 20 + i * 48;
      return `<rect x="${x}" y="0" width="18" height="400" fill="${accent}" opacity="0.06"/>`;
    }).join("");
  }
  if (bgName.includes("Stage") || bgName.includes("Neon") || bgName.includes("Night")) {
    extra += `
      <circle cx="80" cy="60" r="40" fill="${accent}" opacity="0.12"/>
      <circle cx="320" cy="80" r="50" fill="${accent}" opacity="0.1"/>
    `;
  }
  if (bgName.includes("Library") || bgName.includes("Courtroom") || bgName.includes("Notary")) {
    extra += `
      <rect x="30" y="80" width="50" height="200" fill="${accent}" opacity="0.08" rx="4"/>
      <rect x="320" y="80" width="50" height="200" fill="${accent}" opacity="0.08" rx="4"/>
    `;
  }
  return { bg, accent, floor, extra };
}

/**
 * @param {{ tokenId: number, seriesName: string, traits: Record<string,string>, palette: object }} opts
 */
export function renderSvg({ tokenId, seriesName, traits, paletteMap }) {
  const bgName = traits.Background;
  const palette = paletteMap[bgName] || { bg: "#12101c", accent: "#7c6af7", floor: "#1a1630" };
  const layers = backgroundLayers(bgName, palette, false);
  const outfit = OUTFIT_COLORS[traits.Outfit] || OUTFIT_COLORS["Classic Mime"];
  const rarity = traits.Rarity || "Common";
  const rarityColor =
    rarity === "Legendary" ? "#f0b429" : rarity === "Rare" ? "#7c6af7" : rarity === "Uncommon" ? "#4de1c1" : "#9b95b3";

  const stripeOverlay = outfit.stripe
    ? `<g opacity="0.15">
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${155 + i * 8}" y="300" width="3" height="70" fill="#111"/>`).join("")}
      </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Legally Mime #${tokenId}">
  <defs>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${layers.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${layers.bg}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${layers.bg}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="${layers.bg}"/>
  <rect width="400" height="400" fill="url(#glow)"/>
  <rect width="400" height="400" fill="url(#spot)"/>
  ${layers.extra}
  <rect x="0" y="320" width="400" height="80" fill="${layers.floor}"/>
  <line x1="0" y1="320" x2="400" y2="320" stroke="${layers.accent}" stroke-width="2" opacity="0.4"/>

  <!-- body -->
  <ellipse cx="200" cy="340" rx="70" ry="28" fill="${outfit.body}" stroke="${outfit.trim}" stroke-width="3"/>
  <rect x="145" y="300" width="110" height="55" rx="8" fill="${outfit.body}" stroke="${outfit.trim}" stroke-width="3"/>
  ${stripeOverlay}

  <!-- neck -->
  <rect x="185" y="275" width="30" height="30" fill="#f2e6d8"/>

  <!-- head -->
  <circle cx="200" cy="230" r="58" fill="#f7efe4" stroke="#111" stroke-width="3"/>
  <!-- mime white face oval -->
  <ellipse cx="200" cy="235" rx="48" ry="50" fill="#ffffff" opacity="0.92"/>

  <!-- beret / hair mark -->
  <path d="M150 200 Q200 155 250 200" fill="${outfit.trim}" opacity="0.9"/>
  <ellipse cx="200" cy="188" rx="42" ry="16" fill="${outfit.trim}"/>

  ${eyesSvg(traits.Expression)}
  ${mouthPath(traits.Expression)}

  <!-- rosy cheeks -->
  <circle cx="160" cy="245" r="8" fill="#f5a9b8" opacity="0.35"/>
  <circle cx="240" cy="245" r="8" fill="#f5a9b8" opacity="0.35"/>

  ${propSvg(traits.Prop, layers.accent)}

  <!-- frame + labels -->
  <rect x="12" y="12" width="376" height="376" fill="none" stroke="${layers.accent}" stroke-width="2" opacity="0.5" rx="12"/>
  <text x="24" y="40" fill="${layers.accent}" font-family="ui-monospace, monospace" font-size="14" font-weight="600">#${tokenId}</text>
  <text x="376" y="40" text-anchor="end" fill="${rarityColor}" font-family="ui-monospace, monospace" font-size="12">${escapeXml(rarity)}</text>
  <text x="200" y="382" text-anchor="middle" fill="#ffffff" opacity="0.55" font-family="ui-monospace, monospace" font-size="11">${escapeXml(seriesName)}</text>
</svg>
`;
}
