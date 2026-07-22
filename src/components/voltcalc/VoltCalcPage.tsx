import { useMemo, useState } from 'react';
import { CombustionInputs } from './CombustionInputs';
import { MetricCard } from '../common/MetricCard';
import {
  calculateVoltCalc,
  getEvConsumption,
  type EvMode,
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
  const [distance, setDistance] = useState(15000);
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [evMode, setEvMode] = useState<EvMode>('wltp');
  const [electricityPrice, setElectricityPrice] = useState(0.19);

  const [fuelSettings, setFuelSettings] = useState<FuelSettings>({
    petrol: {
      label: 'Petrol car',
      consumption: 5.9,
      price: 1.69,
    },
    diesel: {
      label: 'Diesel car',
      consumption: 4.8,
      price: 1.55,
    },
    hybrid: {
      label: 'Hybrid car',
      consumption: 3.8,
      price: 1.69,
    },
  });

  const evConsumption = useMemo(() => getEvConsumption(evMode), [evMode]);

function updateFuelSetting(
  type: FuelType,
  field: 'consumption' | 'price',
  value: number
) {
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

  return (
    <div className="page-section">
      <section className="hero-card">
        <span className="badge ev">Running cost comparison</span>
        <h2>How much will you save yearly with an EV?</h2>
        <p>
          Compare annual EV running costs against petrol, diesel, or hybrid
          driving based on your actual yearly mileage and local energy prices.
        </p>
      </section>

      <section className="card stack">
        <div className="row">
          <div>
            <div className="field-label">Annual distance driven</div>
            <div className="field-note">
              Use the slider to match your real yearly mileage.
            </div>
          </div>
          <div className="slider-value">
            {distance.toLocaleString('en-US')} km/year
          </div>
        </div>

        <div className="slider-wrap">
          <input
            type="range"
            min={5000}
            max={50000}
            step={500}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            aria-label="Annual distance driven"
          />
          <div className="slider-labels">
            <span>5,000 km</span>
            <span>50,000 km</span>
          </div>
        </div>
      </section>

      <div className="card-grid">
        <section className="card card-subtle">
          <div className="stack">
            <div className="row">
              <h3>Combustion vehicle</h3>
              <span className="badge fuel">{selectedFuel.label}</span>
            </div>

            <div className="field">
              <label htmlFor="fuelType">Comparison type</label>
              <select
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <CombustionInputs
            consumptionId={`${fuelType}Consumption`}
            priceId={`${fuelType}Price`}
            consumptionValue={selectedFuel.consumption}
            priceValue={selectedFuel.price}
            onConsumptionChange={(value) =>
                updateFuelSetting(fuelType, 'consumption', value)
            }
            onPriceChange={(value) =>
                updateFuelSetting(fuelType, 'price', value)
            }
            />
            
            <hr className="divider" />

            <MetricCard
              label="Annual oil-service cost"
              value={formatEuro(results.annualOilChangeCost, 2)}
              tone="fuel"
            />
          </div>
        </section>

        <section className="card card-subtle">
          <div className="stack">
            <div className="row">
              <h3>Electric vehicle</h3>
              <span className="badge ev">EV</span>
            </div>

            <div className="field">
              <label htmlFor="evMode">Consumption mode</label>
              <select
                id="evMode"
                value={evMode}
                onChange={(e) => setEvMode(e.target.value as EvMode)}
              >
                <option value="wltp">WLTP</option>
                <option value="90">90 km/h</option>
                <option value="120">120 km/h</option>
              </select>
            </div>

            <MetricCard
              label="Consumption"
              value={`${evConsumption} kWh/100km`}
              tone="ev"
            />

            <div className="field">
              <label htmlFor="electricityPrice">Electricity price (€/kWh)</label>
              <input
                id="electricityPrice"
                type="number"
                step="0.01"
                value={electricityPrice}
                onChange={(e) =>
                  setElectricityPrice(clamp(Number(e.target.value), 0, 5))
                }
              />
            </div>
          </div>
        </section>
      </div>

      <section className="results-card">
        <div className="row">
          <div>
            <span className="badge ev">Results</span>
            <h3 className="results-title">Annual running-cost breakdown</h3>
          </div>
          <div className="slider-value">{selectedFuel.label} vs EV</div>
        </div>

        <div className="metrics-grid">
          <MetricCard
            label={`${selectedFuel.label} cost / 100 km`}
            value={formatEuro(results.fuelCostPer100, 2)}
            tone="fuel"
          />

          <MetricCard
            label="EV cost / 100 km"
            value={formatEuro(results.evCostPer100, 2)}
            tone="ev"
          />

          <MetricCard
            label={`${selectedFuel.label} fuel cost only / year`}
            value={formatEuro(results.annualFuelCostBase, 0)}
            tone="fuel"
          />

          <MetricCard
            label={`${selectedFuel.label} total incl. oil / year`}
            value={formatEuro(results.annualFuelCost, 0)}
            tone="fuel"
          />

          <MetricCard
            label="EV annual cost"
            value={formatEuro(results.annualEvCost, 0)}
            tone="ev"
          />

          <MetricCard
            label="EV electricity used / year"
            value={`${results.annualEvEnergy.toLocaleString('en-US')} kWh`}
            tone="primary"
          />

          <MetricCard
            label="Annual savings"
            value={formatEuro(results.annualSavings, 0)}
            tone="ev"
          />

          <MetricCard
            label="Monthly savings"
            value={formatEuro(results.monthlySavings, 0)}
            tone="primary"
          />

          <MetricCard
            label="5-year savings"
            value={formatEuro(results.savingsFiveYears, 0)}
            tone="ev"
          />
        </div>
      </section>
    </div>
  );
}