import { useMemo } from "react";
import { calculateVoltCalc } from "../../utils/voltcalc";
import { formatEuro } from "../../utils/format";
import { useI18n } from "../../i18n";

type FuelConfig = {
  labelKey: "petrol" | "diesel" | "hybrid";
  consumption: number;
  price: number;
};

interface VoltCalcPageProps {
  distance: number;
  fuelType: "petrol" | "diesel" | "hybrid";
  fuelSettings: Record<"petrol" | "diesel" | "hybrid", FuelConfig>;
  evConsumption: number;
  electricityPrice: number;
  onDistanceChange: (value: number) => void;
  onFuelTypeChange: (value: "petrol" | "diesel" | "hybrid") => void;
  onFuelSettingChange: (
    type: "petrol" | "diesel" | "hybrid",
    field: "consumption" | "price",
    value: number,
  ) => void;
  onEvConsumptionChange: (value: number) => void;
  onElectricityPriceChange: (value: number) => void;
}

export function VoltCalcPage({
  distance,
  fuelType,
  fuelSettings,
  evConsumption,
  electricityPrice,
  onDistanceChange,
  onFuelSettingChange,
  onEvConsumptionChange,
  onElectricityPriceChange,
}: VoltCalcPageProps) {
  const { t, locale } = useI18n();
  const selectedFuel = fuelSettings[fuelType];

  const results = useMemo(() => {
    return calculateVoltCalc({
      distance,
      selectedFuel,
      evConsumption,
      electricityPrice,
    });
  }, [distance, selectedFuel, evConsumption, electricityPrice]);

  const safeSliderPercent = ((distance - 5000) / (50000 - 5000)) * 100;

  return (
    <div className="page-section voltcalc-page">
      <section className="surface-card distance-card">
        <div className="distance-header">
          <div className="distance-copy">
            <span className="distance-label">{t("annualDistance")}</span>
          </div>
          <div className="distance-value">
            {distance.toLocaleString(locale)} {t("kmPerYear")}
          </div>
        </div>

        <div className="slider-wrap">
          <div className="slider-track">
            <div
              className="slider-fill"
              style={{ width: `${safeSliderPercent}%` }}
            />
            <input
              className="range-input"
              type="range"
              min={5000}
              max={50000}
              step={500}
              value={distance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              aria-label={t("annualDistance")}
            />
          </div>
          <div className="slider-labels">
            <span>5 000 km</span>
            <span>50 000 km</span>
          </div>
        </div>
      </section>

      <div className="section-kicker">{t("annualComparison")}</div>

      <section className="comparison-grid">
        <article className="vehicle-card">
          <div className="vehicle-header">
            <span className="mini-chip fuel">{t("combustion")}</span>
          </div>

          <div className="vehicle-body">
            <div className="control-stack">
              <div className="control-row">
                <span className="control-label">{t("avgConsumption")}</span>
                <div className="stepper" aria-label={t("fuelConsumptionAdjuster")}>
                  <button
                    type="button"
                    onClick={() =>
                      onFuelSettingChange(
                        fuelType,
                        "consumption",
                        selectedFuel.consumption - 0.1,
                      )
                    }
                    aria-label={t("decreaseFuelConsumption")}
                  >
                    −
                  </button>
                  <span className="stepper-value">
                    {selectedFuel.consumption.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onFuelSettingChange(
                        fuelType,
                        "consumption",
                        selectedFuel.consumption + 0.1,
                      )
                    }
                    aria-label={t("increaseFuelConsumption")}
                  >
                    +
                  </button>
                </div>
                <span className="unit-label">L/100km</span>
              </div>

              <div className="price-row">
                <span className="price-label">{t("fuelPrice")}</span>
                <div className="price-input-wrap">
                  <input
                    className="price-input"
                    type="number"
                    step="0.01"
                    value={selectedFuel.price}
                    onChange={(e) =>
                      onFuelSettingChange(
                        fuelType,
                        "price",
                        Number(e.target.value),
                      )
                    }
                    aria-label={t("fuelPrice")}
                  />
                  <span className="price-unit">EUR/L</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">{t("costPer100")}</span>
                <span className="stat-value-inline fuel">
                  {formatEuro(results.fuelCostPer100, 2)}
                </span>
              </div>

              <div className="total-row">
                <span className="total-amount fuel">
                  {formatEuro(results.annualFuelCost, 2)}
                </span>
                <span className="total-unit">{t("perYear")}</span>
              </div>

              <div className="subcost-row">
                <span className="subcost-label">{t("includesOil")} </span>
                <span className="subcost-value">
                  {formatEuro(results.annualOilChangeCost, 2)}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="vehicle-card ev-card">
          <div className="vehicle-header">
            <span className="ev-chip">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {t("electric")}
            </span>
            <span className="recommended-label">✦ {t("recommendedChip")}</span>
          </div>

          <div className="vehicle-body">
            <div className="control-stack">
              <div className="control-row">
                <span className="control-label">{t("avgConsumption")}</span>
                <div className="stepper" aria-label={t("evConsumptionAdjuster")}>
                  <button
                    type="button"
                    onClick={() => onEvConsumptionChange(evConsumption - 0.5)}
                    aria-label={t("decreaseEvConsumption")}
                  >
                    −
                  </button>
                  <span className="stepper-value">
                    {evConsumption.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEvConsumptionChange(evConsumption + 0.5)}
                    aria-label={t("increaseEvConsumption")}
                  >
                    +
                  </button>
                </div>
                <span className="unit-label">kWh/100km</span>
              </div>

              <div className="price-row">
                <span className="price-label">{t("electricityPrice")}</span>
                <div className="price-input-wrap">
                  <input
                    className="price-input"
                    type="number"
                    step="0.001"
                    value={electricityPrice}
                    onChange={(e) =>
                      onElectricityPriceChange(Number(e.target.value))
                    }
                    aria-label={t("electricityPrice")}
                  />
                  <span className="price-unit">EUR/kWh</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">{t("costPer100")}</span>
                <span className="stat-value-inline ev">
                  {formatEuro(results.evCostPer100, 2)}
                </span>
              </div>

              <div className="total-row">
                <span className="total-amount ev">
                  {formatEuro(results.annualEvCost, 2)}
                </span>
                <span className="total-unit">{t("perYear")}</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="banner">
        <div className="banner-copy">
          <div className="banner-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
            >
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="banner-label">{t("annualEvSavingsBanner")}</div>
            <div className="banner-sub">
              {t("versusCombustion")} · {distance.toLocaleString(locale)}{" "}
              {t("kmPerYear")}
            </div>
          </div>
        </div>
        <div className="banner-amount">
          {formatEuro(results.annualSavings, 2)} EUR
        </div>
      </section>

      <div className="section-kicker">{t("runningCostStats")}</div>

      <section className="surface-card stats-card">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="metric-value ev">
              {formatEuro(results.monthlySavings, 2)}
            </div>
            <div className="metric-label">{t("monthlyEvSaving")}</div>
          </div>
          <div className="stat-box">
            <div className="metric-value primary">
              {results.annualEvEnergy.toLocaleString(locale)} kWh
            </div>
            <div className="metric-label">{t("totalKwhPerYear")}</div>
          </div>
          <div className="stat-box">
            <div className="metric-value ev">
              {formatEuro(results.savingsFiveYears, 2)}
            </div>
            <div className="metric-label">{t("fiveYearSavings")}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
