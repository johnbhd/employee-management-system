const philippinePesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPhilippinePeso(amount: number) {
  return philippinePesoFormatter.format(amount);
}
