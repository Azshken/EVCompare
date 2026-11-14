import { useEffect, useMemo, useState } from "react";
import evModels from "../../data/evModels.json";
import { useI18n } from "../../i18n";

export type EvModel = {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  type: string;
  range: number | null;
  battery: number | null;
  power: number | null;
  topSpeed: number | null;
  price: number | null;
  eco: number;
  wltp: number | null;
  kwh90: number | null;
  kwh120: number | null;
  affiliateUrl: string | null;
  imageUrl: string | null;
  priceListUrl: string | null;
  heatPump: boolean;
  recommended: boolean;
  family?: string | null;
  specs?: {
    drive?: string;
    peakPower?: string;
    power30min?: string;
    batteryType?: string;
    batteryNetGross?: string;
    dcMax?: string;
    dcTime?: string;
    acTime?: string;
    weight?: string;
    topSpeed?: string;
    acceleration?: string;
    turningCircle?: string;
    consumption?: string;
    range?: string;
    heatPump?: string;
    v2l?: string;
  } | null;
};

export const cars = evModels as EvModel[];

type ViewMode = "tiles" | "list";
type SortKey = "range" | "efficiency" | "price";
type SortDir = "asc" | "desc";

function consumption(car: EvModel): number | null {
  if (car.wltp && car.wltp > 0) return car.wltp;
  if (car.range && car.battery && car.range > 0) return (car.battery / car.range) * 100;
  return null;
}




interface CarSelectPageProps {
  onSelectConsumption: (kwh: number) => void;
  onOpenCar: (carId: string) => void;
  onSelectCar: (car: { id: string; label: string; price: number | null } | null) => void;
  checkedIds: string[];
  onToggleChecked: (car: { id: string; label: string; price: number | null }) => void;
}

function readSelectState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("evcompare-carselect");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CarSelectPage({
  onSelectConsumption,
  onOpenCar,
  onSelectCar,
  checkedIds,
  onToggleChecked,
}: CarSelectPageProps) {
  const { t, locale } = useI18n();
  const saved = readSelectState();
  const [brand, setBrand] = useState(saved?.brand ?? "all");
  const [type, setType] = useState(saved?.type ?? "all");
  const [view, setView] = useState<ViewMode>(saved?.view === "list" ? "list" : "tiles");
  const [search, setSearch] = useState(saved?.search ?? "");
  const [sortBy, setSortBy] = useState<SortKey>(saved?.sortBy ?? "price");
  const [sortDir, setSortDir] = useState<SortDir>(saved?.sortDir === "desc" ? "desc" : "asc");
  const [selectedId, setSelectedId] = useState<string | null>(saved?.selectedId ?? null);
  const [compareOnly, setCompareOnly] = useState(false);

  const brands = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.brand))).sort()],
    [],
  );
  const types = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.type))).sort()],
    [],
  );

  useEffect(() => {
    window.localStorage.setItem(
      "evcompare-carselect",
      JSON.stringify({ brand, type, view, search, sortBy, sortDir, selectedId }),
    );
  }, [brand, type, view, search, sortBy, sortDir, selectedId]);

  const filtered = useMemo(() => {
    const result = cars.filter((c) => {
      if (compareOnly && !checkedIds.includes(c.id)) return false;
      if (brand !== "all" && c.brand !== brand) return false;
      if (type !== "all" && c.type !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.brand} ${c.model} ${c.variant ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortBy === "range") return ((a.range ?? 0) - (b.range ?? 0)) * dir;
      if (sortBy === "efficiency") {
        return ((consumption(a) ?? 999) - (consumption(b) ?? 999)) * dir;
      }
      return ((a.price ?? Infinity) - (b.price ?? Infinity)) * dir;
    });
    return result;
  }, [brand, type, search, sortBy, sortDir, compareOnly, checkedIds]);

  const displayCars = useMemo(() => {
    const byFamily = new Map<string, EvModel>();
    const singles: EvModel[] = [];
    for (const car of filtered) {
      if (car.family) {
        const existing = byFamily.get(car.family);
        if (!existing || (car.price ?? Infinity) < (existing.price ?? Infinity)) {
          byFamily.set(car.family, car);
        }
      } else {
        singles.push(car);
      }
    }
    // Preserve sort order of the representatives
    const representatives = [...byFamily.values(), ...singles];
    const dir = sortDir === "asc" ? 1 : -1;
    representatives.sort((a, b) => {
      if (sortBy === "range") return ((a.range ?? 0) - (b.range ?? 0)) * dir;
      if (sortBy === "efficiency") {
        return ((consumption(a) ?? 999) - (consumption(b) ?? 999)) * dir;
      }
      return ((a.price ?? Infinity) - (b.price ?? Infinity)) * dir;
    });
    return representatives;
  }, [filtered, sortBy, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir(key === "range" ? "desc" : "asc");
  }

  function selectCar(car: EvModel) {
    if (selectedId === car.id) {
      setSelectedId(null);
      onSelectCar(null);
      return;
    }
    setSelectedId(car.id);
    if (car.wltp && car.wltp > 0) onSelectConsumption(car.wltp);
    onSelectCar({
      id: car.id,
      label: carLabel(car),
      price: car.price,
    });
  }

  function carLabel(car: EvModel) {
    return `${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  }

  function handleCardClick(car: EvModel) {
    selectCar(car);
  }

  function handleInfoClick(event: React.MouseEvent, car: EvModel) {
    event.stopPropagation();
    onOpenCar(car.id);
  }

  function formatPrice(value: number | null) {
    if (value == null) return "–";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function sortArrow(key: SortKey) {
    if (sortBy !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  return (
    <div className="car-select-page">
      <div className="car-filters">
        <input
          className="text-input"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-input" value={brand} onChange={(e) => setBrand(e.target.value)}>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b === "all" ? t("allBrands") : b}
            </option>
          ))}
        </select>
        <select className="select-input" value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? t("allTypes") : item}
            </option>
          ))}
        </select>
</div>

      <div className="car-toolbar">
        <div className="sort-buttons">
          {(["range", "efficiency", "price"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={sortBy === key ? "active" : ""}
              onClick={() => toggleSort(key)}
            >
              {key === "range" ? t("sortRange") : key === "efficiency" ? t("sortEfficiency") : t("sortPrice")}
              <span className="sort-arrow" aria-hidden="true">{sortArrow(key)}</span>
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button type="button" className={view === "tiles" ? "active" : ""} onClick={() => setView("tiles")}>
            {t("tiles")}
          </button>
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            {t("list")}
          </button>
          <button
            type="button"
            className={`compare-btn ${compareOnly ? "active" : ""}`}
            onClick={() => setCompareOnly((current) => !current)}
          >
            {t("compare")}{checkedIds.length ? ` (${checkedIds.length})` : ""}
          </button>
        </div>
      </div>

      <p className="result-count">{displayCars.length} {t("carsCount")}</p>
      {compareOnly && displayCars.length === 0 && (
        <p className="compare-empty">{t("compareEmpty")}</p>
      )}

      <div className={view === "tiles" ? "car-tiles" : "car-list"}>
        {displayCars.map((car) => {
          const selected = selectedId === car.id;
          const checked = checkedIds.includes(car.id);
          return (
            <article
              key={car.id}
              className={`car-card ${selected ? "is-selected" : ""} ${checked ? "is-checked" : ""}`}
              onClick={() => handleCardClick(car)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCardClick(car);
                }
              }}
            >
              <div className="car-image-placeholder">
                {car.imageUrl ? <img src={car.imageUrl} alt="" /> : <span>{car.brand}</span>}
              </div>
              <div className="car-info">
                <h3>
                  {car.brand} {car.model}
                  {car.variant ? ` ${car.variant}` : ""}
                </h3>
                <div className="car-meta">
                  <span className="car-type">{car.type}</span>
                  <span className={`heatpump-mark ${car.heatPump ? "is-on" : "is-off"}`} title="TČ">
                    TČ
                  </span>
                </div>
                <div className="car-stats">
                  <span data-tip="Combined WLTP range">{car.range ?? "–"} km</span>
                  <span data-tip="Battery capacity">{car.battery ?? "–"} kWh</span>
                  {car.wltp != null && <span data-tip="Avg. consumption (WLTP)">{car.wltp.toFixed(1)} kWh/100km</span>}
                  <span data-tip="Peak power">{car.power ?? "–"} kW</span>
                </div>
                <div className="car-price">{formatPrice(car.price)}</div>
                <div className="car-actions">
                  <button
                    type="button"
                    className="car-link-btn car-info-btn"
                    onClick={(event) => handleInfoClick(event, car)}
                  >
                    {t("info")}
                  </button>
                  {car.priceListUrl && (
                    <a
                      className="car-link-btn"
                      href={car.priceListUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {t("priceList")}
                    </a>
                  )}
                  {car.affiliateUrl && (
                    <a
                      className="car-link-btn"
                      href={car.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {t("configurator")}
                    </a>
                  )}
                </div>
                <label
                  className="car-check"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onToggleChecked({
                        id: car.id,
                        label: carLabel(car),
                        price: car.price,
                      })
                    }
                    aria-label={t("checkedCars")}
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
