import { useI18n } from "../../i18n";
import { cars, type EvModel } from "./CarSelectPage";

interface CarDetailsPageProps {
  carId: string | null;
  onBack: () => void;
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CarDetailsPage({ carId, onBack }: CarDetailsPageProps) {
  const { t } = useI18n();
  const car = cars.find((item: EvModel) => item.id === carId) ?? null;
  const specs = car?.specs;

  return (
    <div className="car-details-page">
      <button type="button" className="car-back-btn" onClick={onBack}>
        ← {t("backToModels")}
      </button>

      <section className="surface-card car-details-card">
        <div className="car-details-header">
          {car?.imageUrl && (
            <img className="car-details-image" src={car.imageUrl} alt="" />
          )}
          <h2>
            {car
              ? `${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ""}`
              : t("carDetails")}
          </h2>
        </div>

        {!specs ? (
          <p className="car-details-placeholder">{t("detailsComingSoon")}</p>
        ) : (
          <div className="spec-sections">
            <section className="spec-section">
              <h3>{t("specsTitle")}</h3>
              <SpecRow label={t("drive")} value={specs.drive ?? "–"} />
              <SpecRow label={t("peakPower")} value={specs.peakPower ?? "–"} />
              <SpecRow label={t("power30min")} value={specs.power30min ?? "–"} />
              <SpecRow label={t("topSpeed")} value={specs.topSpeed ?? "–"} />
              <SpecRow label={t("acceleration")} value={specs.acceleration ?? "–"} />
              <SpecRow label={t("turningCircle")} value={specs.turningCircle ?? "–"} />
            </section>

            <section className="spec-section">
              <h3>{t("batteryCharging")}</h3>
              <SpecRow label={t("batteryType")} value={specs.batteryType ?? "–"} />
              <SpecRow label={t("batteryCapacity")} value={specs.batteryNetGross ?? "–"} />
              <SpecRow label={t("dcMax")} value={specs.dcMax ?? "–"} />
              <SpecRow label={t("dcTime")} value={specs.dcTime ?? "–"} />
              <SpecRow label={t("acTime")} value={specs.acTime ?? "–"} />
            </section>

            <section className="spec-section">
              <h3>{t("consumption")}</h3>
              <SpecRow label={t("combinedConsumption")} value={specs.consumption ?? "–"} />
              <SpecRow label={t("combinedRange")} value={specs.range ?? "–"} />
            </section>

            <section className="spec-section">
              <SpecRow label={t("curbWeight")} value={specs.weight ?? "–"} />
              <SpecRow label={t("heatPump")} value={specs.heatPump ?? "–"} />
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
