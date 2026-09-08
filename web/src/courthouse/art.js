/**
 * Illustration lookup used by the live card viewer.
 * Unique portraits override; everything else is a tile on collector-set-NN.png.
 * Card `number` is the catalog id (1…N), not a random trait roll.
 */
const UNIQUE = {
  31: { url: "/art/bjc-live-card.jpg", width: 2034, height: 1620 },
  200: { url: "/art/legally-mime-card.png", width: 1254, height: 1254 },
};

const SHEETS = [
  ...Array.from({ length: 9 }, (_, i) => ({
    sheet: i + 1,
    first: i * 16 + 1,
    last: (i + 1) * 16,
    columns: 4,
    rows: 4,
  })),
  { sheet: 10, first: 145, last: 154, columns: 5, rows: 2 },
  { sheet: 11, first: 155, last: 158, columns: 2, rows: 2 },
  { sheet: 12, first: 159, last: 168, columns: 5, rows: 2 },
  { sheet: 13, first: 169, last: 173, columns: 3, rows: 2 },
  { sheet: 14, first: 174, last: 175, columns: 2, rows: 1 },
  { sheet: 15, first: 176, last: 181, columns: 3, rows: 2 },
  { sheet: 16, first: 182, last: 187, columns: 3, rows: 2 },
  { sheet: 17, first: 188, last: 189, columns: 2, rows: 1 },
  { sheet: 18, first: 190, last: 196, columns: 4, rows: 2 },
  { sheet: 19, first: 197, last: 197, columns: 1, rows: 1 },
  { sheet: 20, first: 198, last: 199, columns: 2, rows: 1 },
];

export function illustration(number) {
  const unique = UNIQUE[number];
  if (unique) {
    return {
      url: unique.url,
      size: "100% 100%",
      position: "0% 0%",
      tileAspect: unique.width / unique.height,
    };
  }
  const sheet = SHEETS.find((s) => number >= s.first && number <= s.last);
  if (!sheet) return null;
  const { columns, rows, first } = sheet;
  const slot = number - first;
  const pad = String(sheet.sheet).padStart(2, "0");
  return {
    url: `/art/collector-set-${pad}.png`,
    size: `${columns * 100}% ${rows * 100}%`,
    position: `${columns === 1 ? 0 : (slot % columns) / (columns - 1) * 100}% ${
      rows === 1 ? 0 : Math.floor(slot / columns) / (rows - 1) * 100
    }%`,
    tileAspect: 1,
  };
}

export function artStyle(number) {
  const art = illustration(number);
  if (!art) return {};
  return {
    backgroundImage: `url(${art.url})`,
    backgroundSize: art.size,
    backgroundPosition: art.position,
    backgroundRepeat: "no-repeat",
    aspectRatio: String(art.tileAspect),
  };
}
