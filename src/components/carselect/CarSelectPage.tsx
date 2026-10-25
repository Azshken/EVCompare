import { useMemo, useState } from "react";
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
};

const cars = evModels as EvModel[];

type ViewMode = "tiles" | "list";
type SortKey = "range" | "efficiency" | "price";
type SortDir = "asc" | "desc";

function consumption(car: EvModel): number | null {
  if (car.wltp && car.wltp > 0) return car.wltp;
  if (car.range && car.battery && car.range > 0) return (car.battery / car.range) * 100;
  return null;
}

function minMax(values: number[]) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return { min: 0, max: 1 };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return { min, max: max === min ? min + 1 : max };
}

function norm(value: number, min: number, max: number, invert: boolean) {
  const ratio = (value - min) / (max - min);
  const clamped = Math.min(1, Math.max(0, ratio));
  return invert ? 1 - clamped : clamped;
}

function computeScores(list: EvModel[]) {
  const prices = list.map((c) => c.price ?? Infinity);
  const ranges = list.map((c) => c.range ?? 0);
  const consumptions = list.map((c) => consumption(c) ?? Infinity);
  const priceMm = minMax(prices.filter((v) => v !== Infinity));
  const rangeMm = minMax(ranges);
  const consMm = minMax(consumptions.filter((v) => v !== Infinity));

  const map = new Map<string, number>();
  for (const car of list) {
    const priceScore =
      car.price == null ? 0 : norm(car.price, priceMm.min, priceMm.max, true);
    const rangeScore =
      car.range == null ? 0 : norm(car.range, rangeMm.min, rangeMm.max, false);
    const cons = consumption(car);
    const efficiencyScore =
      cons == null ? 0 : norm(cons, consMm.min, consMm.max, true);
    const score = 0.33 * priceScore + 0.34 * rangeScore + 0.33 * efficiencyScore;
    map.set(car.id, Math.round(score * 100) / 10);
  }
  return map;
}

interface CarSelectPageProps {
  onSelectConsumption: (kwh: number) => void;
}

export function CarSelectPage({ onSelectConsumption }: CarSelectPageProps) {
  const { t, locale } = useI18n();
  const [brand, setBrand] = useState("all");
  const [type, setType] = useState("all");
  const [ecoMin, setEcoMin] = useState(0);
  const [view, setView] = useState<ViewMode>("tiles");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scores = useMemo(() => computeScores(cars), []);

  const brands = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.brand))).sort()],
    [],
  );
  const types = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.type))).sort()],
    [],
  );

  const filtered = useMemo(() => {
    const result = cars.filter((c) => {
      if (brand !== "all" && c.brand !== brand) return false;
      if (type !== "all" && c.type !== type) return false;
      if ((scores.get(c.id) ?? 0) < ecoMin) return false;
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
  }, [brand, type, ecoMin, search, sortBy, sortDir, scores]);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir(key === "price" ? "asc" : "desc");
  }

  function selectCar(car: EvModel) {
    if (selectedId === car.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(car.id);
    if (car.wltp && car.wltp > 0) onSelectConsumption(car.wltp);
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
        <label className="eco-filter">
          {t("ecoMin")} {ecoMin}
          <input
            type="range"
            min={0}
            max={10}
            value={ecoMin}
            onChange={(e) => setEcoMin(Number(e.target.value))}
          />
        </label>
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
        </div>
      </div>

      <p className="result-count">{filtered.length} {t("carsCount")}</p>

      <div className={view === "tiles" ? "car-tiles" : "car-list"}>
        {filtered.map((car) => {
          const selected = selectedId === car.id;
          const score = scores.get(car.id) ?? 0;
          return (
            <article key={car.id} className={`car-card ${selected ? "is-selected" : ""}`}>
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
                  <span className="eco-badge">Eco {score.toFixed(1)}</span>
                  {car.recommended && <span className="recommend-label">{t("recommended")}</span>}
                  <span className={`heatpump-mark ${car.heatPump ? "is-on" : "is-off"}`} title="TČ">
                    TČ
                  </span>
                </div>
                <div className="car-stats">
                  <span>{car.range ?? "–"} km</span>
                  <span>{car.battery ?? "–"} kWh</span>
                  {car.wltp != null && <span>{car.wltp.toFixed(1)} kWh/100km</span>}
                  <span>{car.power ?? "–"} kW</span>
                </div>
                <div className="car-price">{formatPrice(car.price)}</div>
                <div className="car-actions">
                  <button
                    type="button"
                    className={`select-car-btn ${selected ? "is-active" : ""}`}
                    onClick={() => selectCar(car)}
                  >
                    {selected ? t("selected") : t("select")}
                  </button>
                  {selected && car.priceListUrl && (
                    <a className="car-link-btn" href={car.priceListUrl} target="_blank" rel="noopener noreferrer">
                      {t("priceList")}
                    </a>
                  )}
                  {selected && car.affiliateUrl && (
                    <a className="car-link-btn" href={car.affiliateUrl} target="_blank" rel="noopener noreferrer">
                      {t("configurator")}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
