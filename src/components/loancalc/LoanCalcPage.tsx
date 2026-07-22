import { useMemo, useState } from 'react';
import { formatEuro } from '../../utils/format';
import { clamp } from '../../utils/number';
import { calculateMonthlyPayment } from '../../utils/finance';
import { MetricCard } from '../common/MetricCard';

export function LoanCalcPage() {
  const [price, setPrice] = useState(20000);
  const [downPayment, setDownPayment] = useState(0);
  const [months, setMonths] = useState(48);
  const [apr, setApr] = useState(7.5);

  const principal = Math.max(price - downPayment, 0);

  const monthlyPayment = useMemo(() => {
    return calculateMonthlyPayment(principal, apr, months);
  }, [principal, apr, months]);

  const totalPaid = monthlyPayment * months + downPayment;
  const totalInterest = monthlyPayment * months - principal;

  return (
    <div className="page-section loancalc-page">
      <section className="hero">
        <h2>Estimate your monthly EV loan cost</h2>
        <p>
          Compare loan size, interest, and repayment term to see what your next EV
          really costs each month and over the full financing period.
        </p>
      </section>

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
                onChange={(e) => setPrice(clamp(Number(e.target.value), 0, 250000))}
              />

              <label className="control-label" htmlFor="downPayment">Down payment</label>
              <input
                id="downPayment"
                className="text-input"
                type="number"
                step="500"
                value={downPayment}
                onChange={(e) => setDownPayment(clamp(Number(e.target.value), 0, price))}
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
                onChange={(e) => setMonths(clamp(Number(e.target.value), 12, 120))}
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
                onChange={(e) => setApr(clamp(Number(e.target.value), 0, 30))}
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

        <div style={{ height: '0.9rem' }} />

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
