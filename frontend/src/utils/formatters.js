export function normalizeValue(type, value) {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return value;
}

export function prettyLabel(name) {
  const s = name.replaceAll(".", " ").replaceAll("-", " ").replaceAll("_", " ");
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatPercent(prob) {
  if (prob === null || prob === undefined) return "—";
  return `${(prob * 100).toFixed(1)}%`;
}

export function formatNumber(n, digits = 4) {
  if (n === null || n === undefined) return "—";
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(digits);
}
