export function formatEuro(value: number, decimals = 0) {
  return (
    '€' +
    value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}