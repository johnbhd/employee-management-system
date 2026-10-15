const philippinePesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPhilippinePeso(amount: number | string) {
  if (typeof amount === "number") {
    return philippinePesoFormatter.format(amount);
  }

  const normalized = amount.trim();
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d+))?$/);

  if (!match) {
    return "₱—";
  }

  const [, sign, integerPart, fractionPart = ""] = match;
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = `${fractionPart}00`.slice(0, 2);

  return `${sign ? "-" : ""}₱${groupedInteger}.${fraction}`;
}
