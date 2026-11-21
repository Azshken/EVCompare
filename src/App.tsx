import { useEffect, useMemo, useRef, useState, type FormEvent, type TouchEvent } from "react";
import { AppShell } from "./components/AppShell";
import { LeadCaptureSection } from "./components/common/LeadCaptureSection";
import { LoanCalcPage } from "./components/loancalc/LoanCalcPage";
import { VoltCalcPage } from "./components/voltcalc/VoltCalcPage";
import { CarSelectPage } from "./components/carselect/CarSelectPage";
import { CarDetailsPage } from "./components/carselect/CarDetailsPage";
import { PrivacyPage } from "./components/common/PrivacyPage";
import { PartnersPage } from "./components/common/PartnersPage";
import { calculateMonthlyPayment } from "./utils/finance";
import { formatEuro } from "./utils/format";
import { clamp } from "./utils/number";
import { calculateVoltCalc, type FuelType } from "./utils/voltcalc";
import { useI18n } from "./i18n";

type AppView = "voltcalc" | "loancalc" | "carselect";
type SwitchDirection = "forward" | "backward";
type LeadSource = "voltcalc" | "loancalc" | "carselect";
type ElectricityMode = "home" | "public";

type FuelConfig = {
  labelKey: "petrol" | "diesel" | "hybrid";
  consumption: number;
  price: number;
};

type FuelSettings = Record<FuelType, FuelConfig>;

interface VoltCalcState {
  distance: number;
  fuelType: FuelType;
  electricityMode: ElectricityMode;
  electricitySettings: Record<ElectricityMode, { price: number }>;
  fuelSettings: FuelSettings;
  evConsumption: number;
}

interface LoanCalcState {
  price: number;
  downPayment: number;
  months: number;
  apr: number;
}

interface LeadFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}

interface VoltLeadSnapshot {
  distance: number;
  fuelType: FuelType;
  fuelConsumption: number;
  fuelPrice: number;
  evConsumption: number;
  electricityPrice: number;
  annualSavings: number;
  monthlySavings: number;
}

interface LoanLeadSnapshot {
  vehiclePrice: number;
  downPayment: number;
  months: number;
  apr: number;
  amountFinanced: number;
  monthlyPayment: number;
}

interface LeadSubmission {
  submittedAt: string;
  source: LeadSource;
  contact: LeadFormState;
  snapshot: {
    running: VoltLeadSnapshot;
    financing: LoanLeadSnapshot;
    models: {
      selected: string | null;
      checked: string[];
    };
  };
}

const defaultVoltCalcState: VoltCalcState = {
  distance: 18000,
  fuelType: "petrol",
  electricityMode: "home",
  electricitySettings: {
    home: { price: 0.173 },
    public: { price: 0.40 },
  },
  fuelSettings: {
    petrol: { labelKey: "petrol", consumption: 5.5, price: 1.834 },
    diesel: { labelKey: "diesel", consumption: 4.5, price: 1.988 },
    hybrid: { labelKey: "hybrid", consumption: 3.9, price: 1.834 },
  },
  evConsumption: 17,
};

const defaultLoanCalcState: LoanCalcState = {
  price: 20000,
  downPayment: 0,
  months: 48,
  apr: 7.5,
};

const defaultLeadFormState: LeadFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
  consent: false,
};

const VIEW_ORDER: AppView[] = ["voltcalc", "loancalc", "carselect"];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normaliseVoltCalcState(value: unknown): VoltCalcState {
  const fallback = defaultVoltCalcState;
  if (!value || typeof value !== "object") return fallback;

  const input = value as Partial<VoltCalcState>;
  const fuelType: FuelType =
    input.fuelType === "diesel" || input.fuelType === "hybrid"
      ? input.fuelType
      : "petrol";

  const source = input.fuelSettings;
  const previousPetrolConsumption = 4.5;
  const previousDieselConsumption = 4.1;
  const petrolConsumption = Number(source?.petrol?.consumption ?? fallback.fuelSettings.petrol.consumption);
  const dieselConsumption = Number(source?.diesel?.consumption ?? fallback.fuelSettings.diesel.consumption);

  const fuelSettings: FuelSettings = {
    petrol: {
      labelKey: "petrol",
      consumption: petrolConsumption === previousPetrolConsumption
        ? fallback.fuelSettings.petrol.consumption
        : petrolConsumption,
      price: Number(source?.petrol?.price ?? fallback.fuelSettings.petrol.price),
    },
    diesel: {
      labelKey: "diesel",
      consumption: dieselConsumption === previousDieselConsumption
        ? fallback.fuelSettings.diesel.consumption
        : dieselConsumption,
      price: Number(source?.diesel?.price ?? fallback.fuelSettings.diesel.price),
    },
    hybrid: {
      labelKey: "hybrid",
      consumption: Number(source?.hybrid?.consumption ?? fallback.fuelSettings.hybrid.consumption),
      price: Number(source?.hybrid?.price ?? fallback.fuelSettings.hybrid.price),
    },
  };

  const elecSource = (input as any).electricitySettings;
  const electricitySettings: Record<ElectricityMode, { price: number }> = {
    home: { price: Number(elecSource?.home?.price ?? fallback.electricitySettings.home.price) },
    public: { price: Number(elecSource?.public?.price ?? fallback.electricitySettings.public.price) },
  };
  const electricityMode: ElectricityMode = (input as any).electricityMode === "public" ? "public" : "home";

  return {
    distance: Number(input.distance ?? fallback.distance),
    fuelType,
    electricityMode,
    electricitySettings,
    fuelSettings,
    evConsumption: Number(input.evConsumption ?? fallback.evConsumption),
  };
}

function getCarIdFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/car\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function App() {
  const { t, locale } = useI18n();
  const [activeView, setActiveView] = useState<AppView>(() =>
    readStorage<AppView>("evcompare-active-view", "voltcalc"),
  );
  const [voltCalc, setVoltCalc] = useState<VoltCalcState>(() =>
    normaliseVoltCalcState(
      readStorage<unknown>("evcompare-voltcalc", defaultVoltCalcState),
    ),
  );
  const [loanCalc, setLoanCalc] = useState<LoanCalcState>(() =>
    readStorage<LoanCalcState>("evcompare-loancalc", defaultLoanCalcState),
  );
  const [leadForm, setLeadForm] = useState<LeadFormState>(defaultLeadFormState);
  const [selectedCar, setSelectedCar] = useState<{
    id: string;
    label: string;
    price: number | null;
  } | null>(null);
  const [checkedCars, setCheckedCars] = useState<
    { id: string; label: string; price: number | null }[]
  >(() => readStorage("evcompare-checked-cars", []));
  const [compareMode, setCompareMode] = useState(() =>
    readStorage("evcompare-compare-mode", false),
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    readStorage("evcompare-compare-ids", []),
  );
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [switchDirection, setSwitchDirection] =
    useState<SwitchDirection>("forward");
  const [stageKey, setStageKey] = useState(0);
  const [carId, setCarId] = useState<string | null>(() => getCarIdFromPath());
  const [page, setPage] = useState<"main" | "privacy" | "partners">(() => {
    if (typeof window === "undefined") return "main";
    if (window.location.pathname === "/privacy") return "privacy";
    if (window.location.pathname === "/partners") return "partners";
    return "main";
  });
  const [leadSending, setLeadSending] = useState(false);
  const [leadError, setLeadError] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    function handlePopState() {
      setCarId(getCarIdFromPath());
      const path = window.location.pathname;
      if (path === "/privacy") setPage("privacy");
      else if (path === "/partners") setPage("partners");
      else setPage("main");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "evcompare-active-view",
      JSON.stringify(activeView),
    );
  }, [activeView]);

  useEffect(() => {
    window.localStorage.setItem("evcompare-voltcalc", JSON.stringify(voltCalc));
  }, [voltCalc]);

  useEffect(() => {
    window.localStorage.setItem("evcompare-loancalc", JSON.stringify(loanCalc));
  }, [loanCalc]);

  useEffect(() => {
    window.localStorage.setItem(
      "evcompare-checked-cars",
      JSON.stringify(checkedCars),
    );
  }, [checkedCars]);

  useEffect(() => {
    window.localStorage.setItem(
      "evcompare-compare-mode",
      JSON.stringify(compareMode),
    );
  }, [compareMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "evcompare-compare-ids",
      JSON.stringify(compareIds),
    );
  }, [compareIds]);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "evcompare-fuel-prices-slovnaft";
    const dayMs = 24 * 60 * 60 * 1000;

    async function loadFuelPrices() {
      try {
        const cachedRaw = window.localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as {
            fetchedAt?: number;
            petrol?: number;
            diesel?: number;
          };
          if (
            cached.fetchedAt &&
            Date.now() - cached.fetchedAt < dayMs &&
            typeof cached.petrol === "number" &&
            typeof cached.diesel === "number"
          ) {
            applyFuelPrices(cached.petrol, cached.diesel);
            return;
          }
        }

        const response = await fetch(
          "/api/fuel-prices",
        );
        if (!response.ok) return;
        const payload = await response.json();
        const petrol = Number(payload?.petrol);
        const diesel = Number(payload?.diesel);
        if (!Number.isFinite(petrol) || !Number.isFinite(diesel)) return;

        window.localStorage.setItem(
          cacheKey,
          JSON.stringify({ fetchedAt: Date.now(), petrol, diesel }),
        );
        if (!cancelled) applyFuelPrices(petrol, diesel);
      } catch {
        // Keep the latest stored or default prices if the feed is unavailable.
      }
    }

    function applyFuelPrices(petrol: number, diesel: number) {
      setVoltCalc((prev) => ({
        ...prev,
        fuelSettings: {
          ...prev.fuelSettings,
          petrol: { ...prev.fuelSettings.petrol, price: petrol },
          diesel: { ...prev.fuelSettings.diesel, price: diesel },
          hybrid: { ...prev.fuelSettings.hybrid, price: petrol },
        },
      }));
    }

    void loadFuelPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFuel = voltCalc.fuelSettings[voltCalc.fuelType];

  const selectedElectricity = voltCalc.electricitySettings[voltCalc.electricityMode];

  const voltResults = useMemo(() => {
    return calculateVoltCalc({
      distance: voltCalc.distance,
      selectedFuel: {
        label: t(selectedFuel.labelKey),
        consumption: selectedFuel.consumption,
        price: selectedFuel.price,
      },
      evConsumption: voltCalc.evConsumption,
      electricityPrice: selectedElectricity.price,
    });
  }, [voltCalc, selectedFuel, selectedElectricity, t]);

  const loanSummary = useMemo(() => {
    const principal = Math.max(loanCalc.price - loanCalc.downPayment, 0);
    const monthlyPayment = calculateMonthlyPayment(
      principal,
      loanCalc.apr,
      loanCalc.months,
    );
    const totalInterest = monthlyPayment * loanCalc.months - principal;
    const totalPaid = monthlyPayment * loanCalc.months + loanCalc.downPayment;

    return {
      principal,
      monthlyPayment,
      totalInterest,
      totalPaid,
    };
  }, [loanCalc]);

  function switchTo(view: AppView, direction: SwitchDirection) {
    if (view === activeView) return;
    setSwitchDirection(direction);
    setActiveView(view);
    setLeadSubmitted(false);
    setStageKey((current) => current + 1);
  }

  function openCar(nextCarId: string) {
    setCarId(nextCarId);
    window.history.pushState({}, "", `/car/${encodeURIComponent(nextCarId)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeCar() {
    setCarId(null);
    window.history.pushState({}, "", "/");
  }

  function goNext() {
    const idx = VIEW_ORDER.indexOf(activeView);
    const next = VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
    switchTo(next, "forward");
  }

  function goPrev() {
    const idx = VIEW_ORDER.indexOf(activeView);
    const prev = VIEW_ORDER[(idx - 1 + VIEW_ORDER.length) % VIEW_ORDER.length];
    switchTo(prev, "backward");
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length !== 1) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 120;
    const isMostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.8;
    if (isMostlyHorizontal && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function handleDistanceChange(value: number) {
    setVoltCalc((prev) => ({
      ...prev,
      distance: clamp(value, 5000, 50000),
    }));
  }

  function handleFuelTypeChange(type: FuelType) {
    setVoltCalc((prev) => ({
      ...prev,
      fuelType: type,
    }));
  }

  function handleFuelSettingChange(
    type: FuelType,
    field: "consumption" | "price",
    value: number,
  ) {
    const max = field === "consumption" ? 30 : 10;

    setVoltCalc((prev) => ({
      ...prev,
      fuelSettings: {
        ...prev.fuelSettings,
        [type]: {
          ...prev.fuelSettings[type],
          [field]: clamp(value, 0, max),
        },
      },
    }));
  }

  function handleEvConsumptionChange(value: number) {
    setVoltCalc((prev) => ({
      ...prev,
      evConsumption: clamp(value, 7, 40),
    }));
  }

  function handleElectricityModeChange(mode: ElectricityMode) {
    setVoltCalc((prev) => ({
      ...prev,
      electricityMode: mode,
    }));
  }

  function handleElectricityPriceChange(value: number) {
    setVoltCalc((prev) => ({
      ...prev,
      electricitySettings: {
        ...prev.electricitySettings,
        [prev.electricityMode]: {
          price: clamp(value, 0, 5),
        },
      },
    }));
  }

  function handlePriceChange(value: number) {
    const nextPrice = clamp(value, 0, 250000);

    setLoanCalc((prev) => ({
      ...prev,
      price: nextPrice,
      downPayment: Math.min(prev.downPayment, nextPrice),
    }));
  }

  function handleSelectCar(
    car: { id: string; label: string; price: number | null } | null,
  ) {
    setSelectedCar(car);
    if (car?.price != null) handlePriceChange(car.price);
  }

  function handleToggleChecked(car: {
    id: string;
    label: string;
    price: number | null;
  }) {
    setCheckedCars((prev) => {
      const exists = prev.some((item) => item.id === car.id);
      if (exists) return prev.filter((item) => item.id !== car.id);
      if (prev.length >= 5) return prev;
      return [...prev, car];
    });
  }

  function handleDownPaymentChange(value: number) {
    setLoanCalc((prev) => ({
      ...prev,
      downPayment: clamp(value, 0, prev.price),
    }));
  }

  function handleMonthsChange(value: number) {
    setLoanCalc((prev) => ({
      ...prev,
      months: clamp(value, 12, 120),
    }));
  }

  function handleAprChange(value: number) {
    setLoanCalc((prev) => ({
      ...prev,
      apr: clamp(value, 0, 30),
    }));
  }

  function handleLeadFieldChange(
    field: "name" | "email" | "phone" | "message",
    value: string,
  ) {
    setLeadForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setLeadSubmitted(false);
  }

  function handleLeadConsentChange(value: boolean) {
    setLeadForm((prev) => ({
      ...prev,
      consent: value,
    }));
    setLeadSubmitted(false);
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leadForm.consent || leadSending) return;

    setLeadSending(true);
    setLeadError(false);

    const payload: LeadSubmission = {
      submittedAt: new Date().toISOString(),
      source: activeView,
      contact: leadForm,
      snapshot: {
        running: {
          distance: voltCalc.distance,
          fuelType: voltCalc.fuelType,
          fuelConsumption: selectedFuel.consumption,
          fuelPrice: selectedFuel.price,
          evConsumption: voltCalc.evConsumption,
          electricityPrice: selectedElectricity.price,
          annualSavings: voltResults.annualSavings,
          monthlySavings: voltResults.monthlySavings,
        },
        financing: {
          vehiclePrice: loanCalc.price,
          downPayment: loanCalc.downPayment,
          months: loanCalc.months,
          apr: loanCalc.apr,
          amountFinanced: loanSummary.principal,
          monthlyPayment: loanSummary.monthlyPayment,
        },
        models: {
          selected: selectedCar?.label ?? null,
          checked: checkedCars.map((car) => car.label),
        },
      },
    };

    const existing = readStorage<LeadSubmission[]>("evcompare-leads", []);
    window.localStorage.setItem(
      "evcompare-leads",
      JSON.stringify([payload, ...existing]),
    );

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed");
      setLeadSubmitted(true);
      setLeadForm(defaultLeadFormState);
    } catch {
      setLeadError(true);
    } finally {
      setLeadSending(false);
    }
  }

  const viewTabs: { id: AppView; label: string }[] = [
    { id: "voltcalc", label: t("tabRunning") },
    { id: "loancalc", label: t("tabFinancing") },
    { id: "carselect", label: t("tabModels") },
  ];

  const modelNote =
    checkedCars.length > 0
      ? checkedCars.map((car) => car.label).join(", ")
      : selectedCar?.label ?? t("none");

  const leadSections = [
    {
      id: "running",
      title: t("runningResults"),
      items: [
        {
          label: t("annualDistance"),
          value: `${voltCalc.distance.toLocaleString(locale)} ${t("kmPerYear")}`,
        },
        {
          label: t("comparedAgainst"),
          value: t(selectedFuel.labelKey),
        },
        {
          label: t("annualEvSavings"),
          value: formatEuro(voltResults.annualSavings, 2),
        },
        {
          label: t("monthlyEvSavings"),
          value: formatEuro(voltResults.monthlySavings, 2),
        },
      ],
    },
    {
      id: "financing",
      title: t("financingResults"),
      items: [
        { label: t("vehiclePrice"), value: formatEuro(loanCalc.price, 0) },
        { label: t("downPayment"), value: formatEuro(loanCalc.downPayment, 0) },
        { label: t("loanTerm"), value: `${loanCalc.months} ${t("months")}` },
        {
          label: t("estimatedMonthly"),
          value: formatEuro(loanSummary.monthlyPayment, 0),
        },
        { label: t("carModel"), value: selectedCar?.label ?? t("none") },
      ],
    },
    {
      id: "models",
      title: t("modelResults"),
      items: [
        {
          label: checkedCars.length > 0 ? t("checkedCars") : t("selectedCar"),
          value: modelNote,
        },
      ],
    },
  ];

  function closePage() {
    setPage("main");
    window.history.pushState({}, "", "/");
  }

  return (
    <AppShell title={activeView === "carselect" && page === "main" && !carId ? t("heroTitleModels") : t("heroTitle")}>
      {page === "privacy" ? (
        <PrivacyPage onBack={closePage} />
      ) : page === "partners" ? (
        <PartnersPage onBack={closePage} />
      ) : carId ? (
        <CarDetailsPage carId={carId} onBack={closeCar} onNavigate={(id) => setCarId(id)} />
      ) : (
        <>
          <section className="calculator-stage-shell" aria-live="polite">
            <div className="stage-tabs" role="tablist">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeView === tab.id}
                  className={`stage-tab ${activeView === tab.id ? "is-active" : ""}`}
                  onClick={() =>
                    switchTo(
                      tab.id,
                      VIEW_ORDER.indexOf(tab.id) > VIEW_ORDER.indexOf(activeView)
                        ? "forward"
                        : "backward",
                    )
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="calculator-stage-frame"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                key={`${activeView}-${stageKey}`}
                className={`calculator-stage ${switchDirection === "forward" ? "enter-from-right" : "enter-from-left"}`}
              >
                {activeView === "voltcalc" && (
                  <VoltCalcPage
                    distance={voltCalc.distance}
                    fuelType={voltCalc.fuelType}
                    fuelSettings={voltCalc.fuelSettings}
                    evConsumption={voltCalc.evConsumption}
                    electricityMode={voltCalc.electricityMode}
                    electricityPrice={selectedElectricity.price}
                    onDistanceChange={handleDistanceChange}
                    onFuelTypeChange={handleFuelTypeChange}
                    onFuelSettingChange={handleFuelSettingChange}
                    onEvConsumptionChange={handleEvConsumptionChange}
                    onElectricityModeChange={handleElectricityModeChange}
                    onElectricityPriceChange={handleElectricityPriceChange}
                  />
                )}
                {activeView === "loancalc" && (
                  <LoanCalcPage
                    price={loanCalc.price}
                    downPayment={loanCalc.downPayment}
                    months={loanCalc.months}
                    apr={loanCalc.apr}
                    monthlySavings={voltResults.monthlySavings}
                    onPriceChange={handlePriceChange}
                    onDownPaymentChange={handleDownPaymentChange}
                    onMonthsChange={handleMonthsChange}
                    onAprChange={handleAprChange}
                  />
                )}
                {activeView === "carselect" && (
                  <CarSelectPage
                    onSelectConsumption={(kwh) => handleEvConsumptionChange(kwh)}
                    onOpenCar={openCar}
                    onSelectCar={handleSelectCar}
                    checkedIds={checkedCars.map((car) => car.id)}
                    onToggleChecked={handleToggleChecked}
                    compareMode={compareMode}
                    compareIds={compareIds}
                    onCompareModeChange={setCompareMode}
                    onCompareIdsChange={setCompareIds}
                  />
                )}
              </div>
            </div>
          </section>

          <LeadCaptureSection
            title={t("getMatched")}
            intro={t("leadIntro")}
            sections={leadSections}
            form={leadForm}
            submitted={leadSubmitted}
            sending={leadSending}
            error={leadError}
            onFieldChange={handleLeadFieldChange}
            onConsentChange={handleLeadConsentChange}
            onSubmit={handleLeadSubmit}
            defaultOpenId={
              activeView === "loancalc"
                ? "financing"
                : activeView === "carselect"
                  ? "models"
                  : "running"
            }
          />
        </>
      )}
    </AppShell>
  );
}

export default App;
