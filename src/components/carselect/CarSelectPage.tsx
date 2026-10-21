import { useMemo, useState } from "react";
import evModels from "../../data/evModels.json";

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
};

const cars = evModels as EvModel[];

type ViewMode = "tiles" | "list";
type SortKey = "range" | "efficiency" | "price";

function getEfficiency(car: EvModel): number {
  if (car.range && car.battery && car.battery > 0) {
    return car.range / car.battery;
  }
  if (car.wltp && car.wltp > 0) {
    return 100 / car.wltp;
  }
  return 0;
}

export function CarSelectPage() {
  const [brand, setBrand] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [ecoMin, setEcoMin] = useState<number>(0);
  const [view, setView] = useState<ViewMode>("tiles");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("price");

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
      if (c.eco < ecoMin) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.brand} ${c.model} ${c.variant ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "range") {
        return (b.range ?? 0) - (a.range ?? 0);
      }
      if (sortBy === "efficiency") {
        return getEfficiency(b) - getEfficiency(a);
      }
      // price: cheapest first
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    });

    return result;
  }, [brand, type, ecoMin, search, sortBy]);

  return (
    <div className="car-select-page">
      <div className="car-filters">
        <input
          className="text-input"
          placeholder="Search brand or model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select-input"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b === "all" ? "All brands" : b}
            </option>
          ))}
        </select>
        <select
          className="select-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All types" : t}
            </option>
          ))}
        </select>
        <label className="eco-filter">
          Eco ≥ {ecoMin}
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
          <button
            type="button"
            className={sortBy === "range" ? "active" : ""}
            onClick={() => setSortBy("range")}
          >
            Range
          </button>
          <button
            type="button"
            className={sortBy === "efficiency" ? "active" : ""}
            onClick={() => setSortBy("efficiency")}
          >
            Efficiency
          </button>
          <button
            type="button"
            className={sortBy === "price" ? "active" : ""}
            onClick={() => setSortBy("price")}
          >
            Price
          </button>
        </div>
        <div className="view-toggle">
          <button
            type="button"
            className={view === "tiles" ? "active" : ""}
            onClick={() => setView("tiles")}
          >
            Tiles
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      <p className="result-count">{filtered.length} cars</p>

      <div className={view === "tiles" ? "car-tiles" : "car-list"}>
        {filtered.map((car) => (
          <article key={car.id} className="car-card">
            <div className="car-image-placeholder">
              {car.imageUrl ? (
                <img src={car.imageUrl} alt="" />
              ) : (
                <span>{car.brand}</span>
              )}
            </div>
            <div className="car-info">
              <h3>
                {car.brand} {car.model}
                {car.variant ? ` ${car.variant}` : ""}
              </h3>
              <div className="car-meta">
                <span className="car-type">{car.type}</span>
                <span className="eco-badge">Eco {car.eco}</span>
              </div>
              <div className="car-stats">
                <span>{car.range ?? "–"} km</span>
                <span>{car.battery ?? "–"} kWh</span>
                <span>{car.power ?? "–"} kW</span>
                <span>{car.topSpeed ?? "–"} km/h</span>
              </div>
              <div className="car-price">
                €{car.price?.toLocaleString("en-EU") ?? "–"}
              </div>
              {car.affiliateUrl && (
                <a
                  className="affiliate-link"
                  href={car.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check deals
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
