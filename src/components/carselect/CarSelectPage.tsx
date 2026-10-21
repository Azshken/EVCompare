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

export function CarSelectPage() {
  const [brand, setBrand] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [ecoMin, setEcoMin] = useState<number>(0);
  const [view, setView] = useState<ViewMode>("tiles");
  const [search, setSearch] = useState("");

  const brands = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.brand))).sort()],
    [],
  );
  const types = useMemo(
    () => ["all", ...Array.from(new Set(cars.map((c) => c.type))).sort()],
    [],
  );

  const filtered = useMemo(() => {
    return cars.filter((c) => {
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
  }, [brand, type, ecoMin, search]);

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
        <div className="view-toggle">
          <button
            className={view === "tiles" ? "active" : ""}
            onClick={() => setView("tiles")}
          >
            Tiles
          </button>
          <button
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
            {view === "tiles" && (
              <div className="car-image-placeholder">
                {car.imageUrl ? (
                  <img src={car.imageUrl} alt="" />
                ) : (
                  <span>{car.brand}</span>
                )}
              </div>
            )}
            <div className="car-info">
              <h3>
                {car.brand} {car.model}
                {car.variant ? ` ${car.variant}` : ""}
              </h3>
              <div className="car-stats">
                <span>{car.range ?? "–"} km</span>
                <span>{car.battery ?? "–"} kWh</span>
                <span>{car.power ?? "–"} kW</span>
                <span>{car.topSpeed ?? "–"} km/h</span>
                <span className="eco-badge">Eco {car.eco}</span>
              </div>
              <div className="car-price">
                from €{car.price?.toLocaleString("en-EU") ?? "–"}
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
