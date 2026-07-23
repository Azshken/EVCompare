import { useMemo } from 'react';
import { formatEuro } from '../../utils/format';
import { calculateMonthlyPayment } from '../../utils/finance';
import { MetricCard } from '../common/MetricCard';

interface LoanCalcPageProps {
  price: number;
  downPayment: number;
  months: number;
  apr: number;
  onPriceChange: (value: number) => void;
  onDownPaymentChange: (value: number) => void;
  onMonthsChange: (value: number) => void;
  onAprChange: (value: number) => void;
}

export function LoanCalcPage({
  price,
  downPayment,
  months,
  apr,
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

  return (
    <div className="page-section loancalc-page">
      <section className="loan-grid">
        <article className="vehicle-card">
          <div className="vehicle-header">
            <span className="mini-chip primary">Loan setup</span>
          </div>
          <div className="vehicle-body">
            <div className="control-stack">
              <label className="control-label" htmlFor="vehiclePrice">Vehicle price</label>
              <input
                id="vehiclePrice"
                className="text-input"
                type="number"
                step="500"
                value={price}
                onChange={(e) => onPriceChange(Number(e.target.value))}
              />

              <label className="control-label" htmlFor="downPayment">Down payment</label>
              <input
                id="downPayment"
                className="text-input"
                type="number"
                step="500"
                value={downPayment}
                onChange={(e) => onDownPaymentChange(Number(e.target.value))}
              />

              <div className="metric-card">
                <div className="metric-label">Amount financed</div>
                <div className="metric-value primary">{formatEuro(principal, 0)}</div>
              </div>
            </div>
          </div>
        </article>

        <article className="vehicle-card ev-card">
          <div className="vehicle-header">
            <span className="ev-chip">Monthly plan</span>
          </div>
          <div className="vehicle-body">
            <div className="control-stack">
              <label className="control-label" htmlFor="loanTerm">Loan term (months)</label>
              <select
                id="loanTerm"
                className="select-input"
                value={months}
                onChange={(e) => onMonthsChange(Number(e.target.value))}
              >
                {[24, 36, 48, 60, 72, 84, 96].map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>

              <label className="control-label" htmlFor="apr">APR (%)</label>
              <input
                id="apr"
                className="text-input"
                type="number"
                step="0.1"
                value={apr}
                onChange={(e) => onAprChange(Number(e.target.value))}
              />

              <div className="loan-note">
                Loan payment is calculated using a standard amortizing loan model.
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card loan-results-card">
        <div className="loan-highlight">
          <div className="loan-highlight-label">Estimated monthly payment</div>
          <div className="loan-highlight-value">
            {formatEuro(monthlyPayment, 0)}
            <span>/ month</span>
          </div>
        </div>

        <div className="loan-results-spacer" />

        <div className="metrics-grid">
          <MetricCard
            label="Amount financed"
            value={formatEuro(principal, 0)}
            tone="primary"
          />
          <MetricCard
            label="Monthly payment"
            value={formatEuro(monthlyPayment, 0)}
            tone="ev"
          />
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
        </div>
      </section>
    </div>
  );
}