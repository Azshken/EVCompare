import { useMemo, useState } from 'react';
import {
  calculateVoltCalc,
  type FuelType,
} from '../../utils/voltcalc';
import { formatEuro } from '../../utils/format';
import { clamp } from '../../utils/number';

type FuelConfig = {
  label: string;
  consumption: number;
  price: number;
};

type FuelSettings = Record<FuelType, FuelConfig>;

export function VoltCalcPage() {
  const [distance, setDistance] = useState(18000);
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [electricityPrice, setElectricityPrice] = useState(0.173);
  

  const [fuelSettings, setFuelSettings] = useState<FuelSettings>({
    petrol: { label: 'Petrol', consumption: 4.5, price: 1.75 },
    diesel: { label: 'Diesel', consumption: 4.1, price: 1.61 },
    hybrid: { label: 'Hybrid', consumption: 3.9, price: 1.75 },
  });

  const [evConsumption, setEvConsumption] = useState(17.0);

  function updateFuelSetting(type: FuelType, field: 'consumption' | 'price', value: number) {
    const max = field === 'consumption' ? 30 : 10;
    setFuelSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: clamp(value, 0, max),
      },
    }));
  }

  const selectedFuel = fuelSettings[fuelType];

  const results = useMemo(() => {
    return calculateVoltCalc({
      distance,
      selectedFuel,
      evConsumption,
      electricityPrice,
    });
  }, [distance, selectedFuel, evConsumption, electricityPrice]);

  const sliderPercent = ((distance - 5000) / (50000 - 5000)) * 100;

  return (
    <div className="page-section voltcalc-page">
      <section className="hero">
        <h1>How much will you save yearly with an EV?</h1>
        <p>
          Compare annual running costs of an electric vehicle vs a petrol or diesel car
          based on your actual driving distance and local energy prices.
        </p>
      </section>

      <section className="surface-card distance-card">
        <div className="distance-header">
          <div className="distance-copy">
            <span className="distance-label">Annual distance driven</span>
          </div>
          <div className="distance-value">{distance.toLocaleString('en-US')} km / year</div>
        </div>

        <div className="slider-wrap">
          <div className="slider-track">
            <div className="slider-fill" style={{ width: `${sliderPercent}%` }} />
            <input
              className="range-input"
              type="range"
              min={5000}
              max={50000}
              step={500}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              aria-label="Annual distance driven"
            />
          </div>
          <div className="slider-labels">
            <span>5 000 km</span>
            <span>50 000 km</span>
          </div>
        </div>
      </section>

      <div className="section-kicker">Annual cost comparison</div>

      <section className="comparison-grid">
        <article className="vehicle-card">
          <div className="vehicle-header">
            <div className="inline-tabs" role="tablist" aria-label="Fuel type comparison">
              {(['petrol', 'diesel', 'hybrid'] as FuelType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`inline-tab ${fuelType === type ? 'active' : ''}`}
                  onClick={() => setFuelType(type)}
                  aria-pressed={fuelType === type}
                >
                  {fuelSettings[type].label}
                </button>
              ))}
            </div>
          </div>

          <div className="vehicle-body">
            <div className="control-stack">
              <div className="control-row">
                <span className="control-label">Avg. consumption</span>
                <div className="stepper" aria-label="Fuel consumption adjuster">
                  <button
                    type="button"
                    onClick={() => updateFuelSetting(fuelType, 'consumption', selectedFuel.consumption - 0.1)}
                    aria-label="Decrease combustion consumption"
                  >
                    −
                  </button>
                  <span className="stepper-value">{selectedFuel.consumption.toFixed(1)}</span>
                  <button
                    type="button"
                    onClick={() => updateFuelSetting(fuelType, 'consumption', selectedFuel.consumption + 0.1)}
                    aria-label="Increase combustion consumption"
                  >
                    +
                  </button>
                </div>
                <span className="unit-label">L/100km</span>
              </div>

              <div className="price-row">
                <span className="price-label">Fuel price</span>
                <div className="price-input-wrap">
                  <input
                    className="price-input"
                    type="number"
                    step="0.01"
                    value={selectedFuel.price}
                    onChange={(e) => updateFuelSetting(fuelType, 'price', Number(e.target.value))}
                    aria-label="Fuel price"
                  />
                  <span className="price-unit">EUR/L</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Cost per 100 km</span>
                <span className="stat-value-inline fuel">{formatEuro(results.fuelCostPer100, 2)}</span>
              </div>

              <div className="total-row">
                <span className="total-amount fuel">{formatEuro(results.annualFuelCost, 2)}</span>
                <span className="total-unit">EUR/year</span>
              </div>
            </div>
          </div>
        </article>

        <article className="vehicle-card ev-card">
          <div className="vehicle-header">
            <span className="ev-chip">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Electric
            </span>
            <span className="recommended-label">✦ Recommended</span>
          </div>

          <div className="vehicle-body">
            <div className="control-stack">
              <div className="control-row">
                <span className="control-label">Avg. consumption</span>
                <div className="stepper" aria-label="EV consumption adjuster">
                  <button
                    type="button"
                    onClick={() => setEvConsumption((v) => clamp(Math.max(7, v - 0.5), 7, 40))}
                    aria-label="Decrease EV consumption"
                  >
                    −
                  </button>
                  <span className="stepper-value">{evConsumption.toFixed(1)}</span>
                  <button
                    type="button"
                    onClick={() => setEvConsumption((v) => clamp(Math.min(40, v + 0.5), 7, 40))}
                    aria-label="Increase EV consumption"
                  >
                    +
                  </button>
                </div>
                <span className="unit-label">kWh/100km</span>
              </div>

              <div className="price-row">
                <span className="price-label">Electricity price</span>
                <div className="price-input-wrap">
                  <input
                    className="price-input"
                    type="number"
                    step="0.001"
                    value={electricityPrice}
                    onChange={(e) => setElectricityPrice(clamp(Number(e.target.value), 0, 5))}
                    aria-label="Electricity price"
                  />
                  <span className="price-unit">EUR/kWh</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Cost per 100 km</span>
                <span className="stat-value-inline ev">{formatEuro(results.evCostPer100, 2)}</span>
              </div>

              <div className="total-row">
                <span className="total-amount ev">{formatEuro(results.annualEvCost, 2)}</span>
                <span className="total-unit">EUR/year</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="banner">
        <div className="banner-copy">
          <div className="banner-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="banner-label">Annual savings with an electric vehicle</div>
            <div className="banner-sub">vs. {selectedFuel.label} · {distance.toLocaleString('en-US')} km/year</div>
          </div>
        </div>
        <div className="banner-amount">{formatEuro(results.annualSavings, 2)} EUR</div>
      </section>

      <div className="section-kicker">Running cost stats</div>

      <section className="surface-card stats-card">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="metric-value ev">{formatEuro(results.monthlySavings, 2)}</div>
            <div className="metric-label">Monthly EV saving</div>
          </div>
          <div className="stat-box">
            <div className="metric-value primary">{results.annualEvEnergy.toLocaleString('en-US')} kWh</div>
            <div className="metric-label">Total kWh used/year</div>
          </div>
          <div className="stat-box">
            <div className="metric-value ev">{formatEuro(results.savingsFiveYears, 2)}</div>
            <div className="metric-label">5-year total savings</div>
          </div>
        </div>
      </section>
    </div>
  );
}