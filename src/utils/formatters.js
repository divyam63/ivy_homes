export function prettyMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function title(value) {
  return String(value || "—").replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

export function projectMoney(value) {
  return prettyMoney(Number(value || 0) * 10_000_000);
}
