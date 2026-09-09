/** All money values in the app are stored as ₹ lakhs. */
export function formatLakhs(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 100) {
    const cr = value / 100;
    const str = Number.isInteger(cr) ? cr.toFixed(0) : cr.toFixed(2).replace(/0$/, "");
    return `₹${str} Cr`;
  }
  const str = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0$/, "");
  return `₹${str} L`;
}

export function formatCompactLakhs(value: number): string {
  return formatLakhs(value).replace("₹", "₹ ");
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
