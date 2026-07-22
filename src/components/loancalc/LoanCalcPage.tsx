import { useMemo, useState } from 'react';
import { MetricCard } from '../common/MetricCard';
import { formatEuro } from '../../utils/format';
import { clamp } from '../../utils/number';
import { calculateMonthlyPayment } from '../../utils/finance';

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
    <div className="page-section">
      <section className="hero-card loan-hero">
        <span className="badge primary">Financing calculator</span>
        <h2>Estimate your monthly EV loan cost</h2>
        <p>
          Compare loan size, interest, and repayment term to see what your next
          EV really costs each month and over the full financing period.
        </p>
      </section>

      <div className="card-grid">
        <section className="card card-subtle">
          <div className="stack">
            <div className="row">
              <h3>Vehicle & deposit</h3>
              <span className="badge">Loan setup</span>
            </div>

            <div className="field">
              <label htmlFor="vehiclePrice">Vehicle price</label>
              <input
                id="vehiclePrice"
                type="number"
                step="500"
                value={price}
                onChange={(e) =>
                  setPrice(clamp(Number(e.target.value), 0, 250000))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="downPayment">Down payment</label>
              <input
                id="downPayment"
                type="number"
                step="500"
                value={downPayment}
                onChange={(e) =>
                  setDownPayment(clamp(Number(e.target.value), 0, price))
                }
              />
            </div>

            <MetricCard
              label="Amount financed"
              value={formatEuro(principal, 0)}
              tone="primary"
            />
          </div>
        </section>

        <section className="card card-subtle">
          <div className="stack">
            <div className="row">
              <h3>Loan terms</h3>
              <span className="badge ev">Monthly plan</span>
            </div>

            <div className="field">
              <label htmlFor="loanTerm">Loan term (months)</label>
              <input
                id="loanTerm"
                type="number"
                step="12"
                value={months}
                onChange={(e) =>
                  setMonths(clamp(Number(e.target.value), 12, 120))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="apr">APR (%)</label>
              <input
                id="apr"
                type="number"
                step="0.1"
                value={apr}
                onChange={(e) => setApr(clamp(Number(e.target.value), 0, 30))}
              />
            </div>

            <div className="loan-note">
              Loan payment is calculated using a standard amortizing loan model.
            </div>
          </div>
        </section>
      </div>

      <section className="results-card loan-results">
        <div className="row">
          <div>
            <span className="badge ev">Results</span>
            <h3 className="results-title">Loan cost breakdown</h3>
          </div>
          <div className="slider-value">{months} months</div>
        </div>

        <div className="loan-highlight">
          <div className="loan-highlight-label">Estimated monthly payment</div>
          <div className="loan-highlight-value">
            {formatEuro(monthlyPayment, 0)}
            <span>/ month</span>
          </div>
        </div>

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