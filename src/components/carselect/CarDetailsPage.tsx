import { useRef, type TouchEvent } from "react";
import { useI18n, type DictKey } from "../../i18n";
import { cars, type EvModel } from "./CarSelectPage";

interface CarDetailsPageProps {
  carId: string | null;
  onBack: () => void;
  onNavigate: (id: string) => void;
}

function SpecRow({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { text: string; better: boolean } | null;
}) {
  return (
    <div className="spec-row">
      <span>{label}</span>
      <strong>
        {value}
        {delta && (
          <span className={`spec-delta ${delta.better ? "is-better" : "is-worse"}`}>
            {" "}
            {delta.text}
          </span>
        )}
      </strong>
    </div>
  );
}

function parseAccel(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/([\d.,]+)/);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

function deltaNum(
  current: number | null | undefined,
  previous: number | null | undefined,
  higherIsBetter: boolean,
  unit = "",
) {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    current === previous
  ) {
    return null;
  }
  const diff = current - previous;
  const better = higherIsBetter ? diff > 0 : diff < 0;
  const sign = diff > 0 ? "+" : "";
  const formatted =
    Math.abs(diff) >= 10 || Number.isInteger(diff)
      ? `${sign}${Math.round(diff)}`
      : `${sign}${diff.toFixed(1)}`;
  return { text: `(${formatted}${unit})`, better };
}

function VariantColumn({
  car,
  prev,
  formatPrice,
  t,
}: {
  car: EvModel;
  prev: EvModel | null;
  formatPrice: (v: number | null) => string;
  t: (k: DictKey) => string;
}) {
  const specs = car.specs;
  if (!specs) return null;

  const rangeDelta = deltaNum(car.range, prev?.range, true, " km");
  const priceDelta = deltaNum(car.price, prev?.price, false);
  const powerDelta = deltaNum(car.power, prev?.power, true, " kW");
  const batteryDelta = deltaNum(car.battery, prev?.battery, true, " kWh");
  const wltpDelta = deltaNum(car.wltp, prev?.wltp, false);
  const accelDelta = deltaNum(
    parseAccel(specs.acceleration),
    parseAccel(prev?.specs?.acceleration),
    false,
    " s",
  );

  return (
    <div className="variant-column">
      <div className="variant-column-header">
        <h3>{car.variant || car.model}</h3>
        <div className="variant-column-price">{formatPrice(car.price)}</div>
      </div>
      <div className="spec-sections compact">
        <SpecRow label={t("drive")} value={specs.drive ?? "–"} />
        <SpecRow label={t("peakPower")} value={specs.peakPower ?? "–"} delta={powerDelta} />
        <SpecRow label={t("power30min")} value={specs.power30min ?? "–"} />
        <SpecRow label={t("topSpeed")} value={specs.topSpeed ?? "–"} />
        <SpecRow label={t("acceleration")} value={specs.acceleration ?? "–"} delta={accelDelta} />
        <SpecRow label={t("turningCircle")} value={specs.turningCircle ?? "–"} />
        <SpecRow label={t("batteryType")} value={specs.batteryType ?? "–"} />
        <SpecRow label={t("batteryCapacity")} value={specs.batteryNetGross ?? "–"} delta={batteryDelta} />
        <SpecRow label={t("dcMax")} value={specs.dcMax ?? "–"} />
        <SpecRow label={t("dcTime")} value={specs.dcTime ?? "–"} />
        <SpecRow label={t("acTime")} value={specs.acTime ?? "–"} />
        <SpecRow label={t("combinedConsumption")} value={specs.consumption ?? "–"} delta={wltpDelta} />
        <SpecRow label={t("combinedRange")} value={specs.range ?? "–"} delta={rangeDelta} />
        <SpecRow label={t("curbWeight")} value={specs.weight ?? "–"} />
        <SpecRow label={t("heatPump")} value={specs.heatPump ?? "–"} />
        {priceDelta && (
          <SpecRow label={t("vehiclePrice")} value={formatPrice(car.price)} delta={priceDelta} />
        )}
      </div>
    </div>
  );
}

export function CarDetailsPage({ carId, onBack, onNavigate }: CarDetailsPageProps) {
  const { t, locale } = useI18n();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const initialCar = cars.find((item: EvModel) => item.id === carId) ?? null;
  const familyId = initialCar?.family;
  const familyCars = familyId
    ? cars
        .filter((c) => c.family === familyId)
        .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    : initialCar
      ? [initialCar]
      : [];

  const index = Math.max(0, familyCars.findIndex((c) => c.id === carId));
  const car = familyCars[index] ?? null;
  const prev = index > 0 ? familyCars[index - 1] : null;
  const specs = car?.specs;

  function goTo(next: number) {
    if (next < 0 || next >= familyCars.length) return;
    const nextCar = familyCars[next];
    if (!nextCar) return;
    window.history.replaceState({}, "", `/car/${encodeURIComponent(nextCar.id)}`);
    onNavigate(nextCar.id);
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 60;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
    if (isHorizontal && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) goTo(index + 1);
      else goTo(index - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function formatPrice(value: number | null) {
    if (value == null) return "–";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  const rangeDelta = deltaNum(car?.range, prev?.range, true, " km");
  const priceDelta = deltaNum(car?.price, prev?.price, false);
  const powerDelta = deltaNum(car?.power, prev?.power, true, " kW");
  const batteryDelta = deltaNum(car?.battery, prev?.battery, true, " kWh");
  const wltpDelta = deltaNum(car?.wltp, prev?.wltp, false);
  const accelDelta = deltaNum(
    parseAccel(specs?.acceleration),
    parseAccel(prev?.specs?.acceleration),
    false,
    " s",
  );

  if (!car) {
    return (
      <div className="car-details-page">
        <button type="button" className="car-back-btn" onClick={onBack}>
          ← {t("backToModels")}
        </button>
        <p>{t("detailsComingSoon")}</p>
      </div>
    );
  }

  const isFamily = familyCars.length > 1;
  const title = isFamily
    ? `${car.brand} ${car.model}`
    : `${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;

  return (
    <div
      className="car-details-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button type="button" className="car-back-btn" onClick={onBack}>
        ← {t("backToModels")}
      </button>

      <section className={`surface-card car-details-card${isFamily ? " has-family" : ""}`}>
        <div className="car-details-header">
          {car.imageUrl && (
            <img className="car-details-image" src={car.imageUrl} alt="" />
          )}
          <h2>{title}</h2>
          {!isFamily && <div className="car-details-price">{formatPrice(car.price)}</div>}
        </div>

        {/* Mobile / narrow: chips + single variant */}
        {isFamily && (
          <div className="variant-switcher" role="tablist">
            {familyCars.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`variant-chip ${i === index ? "is-active" : ""}`}
                onClick={() => goTo(i)}
              >
                <span className="variant-name">{variant.variant || variant.model}</span>
                <span className="variant-price">{formatPrice(variant.price)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="single-view">
          {!specs ? (
            <p className="car-details-placeholder">{t("detailsComingSoon")}</p>
          ) : (
            <div className="spec-sections">
              <section className="spec-section">
                <h3>{t("specsTitle")}</h3>
                <SpecRow label={t("drive")} value={specs.drive ?? "–"} />
                <SpecRow label={t("peakPower")} value={specs.peakPower ?? "–"} delta={powerDelta} />
                <SpecRow label={t("power30min")} value={specs.power30min ?? "–"} />
                <SpecRow label={t("topSpeed")} value={specs.topSpeed ?? "–"} />
                <SpecRow label={t("acceleration")} value={specs.acceleration ?? "–"} delta={accelDelta} />
                <SpecRow label={t("turningCircle")} value={specs.turningCircle ?? "–"} />
              </section>
              <section className="spec-section">
                <h3>{t("batteryCharging")}</h3>
                <SpecRow label={t("batteryType")} value={specs.batteryType ?? "–"} />
                <SpecRow label={t("batteryCapacity")} value={specs.batteryNetGross ?? "–"} delta={batteryDelta} />
                <SpecRow label={t("dcMax")} value={specs.dcMax ?? "–"} />
                <SpecRow label={t("dcTime")} value={specs.dcTime ?? "–"} />
                <SpecRow label={t("acTime")} value={specs.acTime ?? "–"} />
              </section>
              <section className="spec-section">
                <h3>{t("consumption")}</h3>
                <SpecRow label={t("combinedConsumption")} value={specs.consumption ?? "–"} delta={wltpDelta} />
                <SpecRow label={t("combinedRange")} value={specs.range ?? "–"} delta={rangeDelta} />
              </section>
              <section className="spec-section">
                <SpecRow label={t("curbWeight")} value={specs.weight ?? "–"} />
                <SpecRow label={t("heatPump")} value={specs.heatPump ?? "–"} />
              </section>
              {priceDelta && (
                <section className="spec-section">
                  <SpecRow label={t("vehiclePrice")} value={formatPrice(car.price)} delta={priceDelta} />
                </section>
              )}
            </div>
          )}
        </div>

        {/* Desktop: all variants side-by-side when they fit */}
        {isFamily && (
          <div className="desktop-comparison">
            {familyCars.map((variant, i) => (
              <VariantColumn
                key={variant.id}
                car={variant}
                prev={i > 0 ? familyCars[i - 1] : null}
                formatPrice={formatPrice}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
