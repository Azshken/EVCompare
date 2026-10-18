import { useMemo } from "react";
import { formatEuro } from "../../utils/format";
import { calculateMonthlyPayment } from "../../utils/finance";
import { MetricCard } from "../common/MetricCard";

interface LoanCalcPageProps {
  price: number;
  downPayment: number;
  months: number;
  apr: number;
  monthlySavings?: number;
  onPriceChange: (value: number) => void;
  onDownPaymentChange: (value: number) => void;
  onMonthsChange: (value: number) => void;
  onAprChange: (value: number) => void;
}

const DOWN_PAYMENT_OPTIONS = [0, 10, 20, 30] as const;
const TERM_YEARS = [3, 4, 5, 6] as const;

export function LoanCalcPage({
  price,
  downPayment,
  months,
  apr,
  monthlySavings = 0,
  onPriceChange,
  onDownPaymentChange,
  onMonthsChange,
  onAprChange,
}: LoanCalcPageProps) {
  const principal = Math.max(price - downPayment, 0);

  const monthlyPayment = useMemo(() => {
    return calculateMonthlyPayment(principal, apr, months);
  }, [principal, apr, months]);

  const totalPaid = monthlyPayment * months + downPayment;
  const totalInterest = monthlyPayment * months - principal;
  const totalEvSavings = monthlySavings * months;
  const trueCost = totalPaid - totalEvSavings;
  const monthlyCostAfterSavings = Math.max(monthlyPayment - monthlySavings, 0);

  const activeDownPercent = useMemo(() => {
    if (price <= 0) return 0;
    const pct = Math.round((downPayment / price) * 100);
    return DOWN_PAYMENT_OPTIONS.includes(pct as (typeof DOWN_PAYMENT_OPTIONS)[number])
      ? pct
      : null;
  }, [downPayment, price]);

  const activeYears = months / 12;

  function selectDownPercent(percent: number) {
    onDownPaymentChange(Math.round((price * percent) / 100));
  }

  function selectYears(years: number) {
    onMonthsChange(years * 12);
  }

  return (
    <div className="page-section loancalc-page">
      <section className="loan-setup-card surface-card">
        <div className="loan-setup-header">
          <h2 className="loan-setup-title">Financing</h2>
          <p className="loan-setup-subtitle">Adjust the down payment and term</p>
        </div>

        <div className="loan-controls">
          <div className="loan-control-group">
            <label className="control-label" htmlFor="vehiclePrice">
              Vehicle price
            </label>
            <input
              id="vehiclePrice"
              className="text-input"
              type="text"
              inputMode="numeric"
              value={price === 0 ? "" : String(price)}
              placeholder="0"
              onChange={(e) => {
                const cleaned = e.target.value
                  .replace(/[^\d]/g, "")
                  .replace(/^0+(?=\d)/, "");
                onPriceChange(cleaned === "" ? 0 : Number(cleaned));
              }}
            />
          </div>

          <div className="loan-control-group">
            <span className="control-label">Down payment</span>
            <div className="loan-option-group" role="group" aria-label="Down payment percentage">
              {DOWN_PAYMENT_OPTIONS.map((percent) => {
                const amount = Math.round((price * percent) / 100);
                const isActive = activeDownPercent === percent;
                return (
                  <button
                    key={percent}
                    type="button"
                    className={`loan-option-btn ${isActive ? "is-active" : ""}`}
                    onClick={() => selectDownPercent(percent)}
                    aria-pressed={isActive}
                  >
                    <span className="loan-option-percent">{percent}%</span>
                    <span className="loan-option-amount">{formatEuro(amount, 0)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="loan-control-group">
            <span className="control-label">Loan term</span>
            <div className="loan-option-group" role="group" aria-label="Loan term in years">
              {TERM_YEARS.map((years) => {
                const isActive = activeYears === years;
                return (
                  <button
                    key={years}
                    type="button"
                    className={`loan-option-btn loan-option-btn-year ${isActive ? "is-active" : ""}`}
                    onClick={() => selectYears(years)}
                    aria-pressed={isActive}
                  >
                    <span className="loan-option-percent">{years}</span>
                    <span className="loan-option-amount">years</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="loan-control-group loan-apr-group">
            <label className="control-label" htmlFor="apr">
              APR (%)
            </label>
            <input
              id="apr"
              className="text-input loan-apr-input"
              type="text"
              inputMode="decimal"
              value={apr === 0 ? "" : String(apr)}
              placeholder="0"
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^\d.]/g, "");
                const parts = cleaned.split(".");
                if (parts.length > 2) {
                  cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
                }
                cleaned = cleaned.replace(/^0+(?=\d)/, "");
                onAprChange(cleaned === "" || cleaned === "." ? 0 : Number(cleaned));
              }}
            />
          </div>
        </div>

        <div className="loan-note">
          Loan payment is calculated using a standard amortizing loan model.
        </div>
      </section>

      <section className="surface-card loan-results-card">
        <div className="loan-highlight">
          <div className="loan-highlight-copy">
            <div className="loan-highlight-label">Estimated loan payment</div>
          </div>

          <div className="loan-highlight-value">
            <div className="loan-highlight-amount">
              {formatEuro(monthlyPayment, 0)}
              <span>/ month</span>
            </div>
            <div className="loan-highlight-note">
              {formatEuro(monthlyCostAfterSavings, 0)} after EV savings
            </div>
          </div>
        </div>

        <div className="loan-results-spacer" />

        <div className="metrics-grid">
          <MetricCard
            label="Total interest"
            value={formatEuro(totalInterest, 0)}
            tone="fuel"
          />
          <MetricCard
            label="Total paid"
            value={formatEuro(totalPaid, 0)}
            tone="primary"
          />
          <MetricCard
            label="True cost after EV savings"
            value={formatEuro(trueCost, 0)}
            tone="ev"
          />
        </div>
      </section>
    </div>
  );
}
