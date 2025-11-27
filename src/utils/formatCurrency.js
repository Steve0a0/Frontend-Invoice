export function formatCurrency(value = 0, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch (error) {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
}
