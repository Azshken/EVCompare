export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
) {
  const monthlyRate = annualRate / 100 / 12;

  if (months <= 0) return 0;
  if (principal <= 0) return 0;

  if (monthlyRate === 0) {
    return principal / months;
  }

  return (
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}