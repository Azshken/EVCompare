import { useI18n } from "../../i18n";
import { cars, type EvModel } from "./CarSelectPage";

interface CarDetailsPageProps {
  carId: string | null;
  onBack: () => void;
}

export function CarDetailsPage({ carId, onBack }: CarDetailsPageProps) {
  const { t } = useI18n();
  const car = cars.find((item: EvModel) => item.id === carId) ?? null;

  return (
    <div className="car-details-page">
      <button type="button" className="car-back-btn" onClick={onBack}>
        ← {t("backToModels")}
      </button>

      <section className="surface-card car-details-card">
        <div className="car-details-header">
          <h2>
            {car
              ? `${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ""}`
              : t("carDetails")}
          </h2>
        </div>
        <p className="car-details-placeholder">{t("detailsComingSoon")}</p>
      </section>
    </div>
  );
}
