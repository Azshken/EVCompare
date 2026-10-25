import { useEffect, useMemo, useRef, useState, type FormEvent, type TouchEvent } from "react";
import { AppShell } from "./components/AppShell";
import { LeadCaptureSection } from "./components/common/LeadCaptureSection";
import { LoanCalcPage } from "./components/loancalc/LoanCalcPage";
import { VoltCalcPage } from "./components/voltcalc/VoltCalcPage";
import { CarSelectPage } from "./components/carselect/CarSelectPage";
import { CarDetailsPage } from "./components/carselect/CarDetailsPage";
import { calculateMonthlyPayment } from "./utils/finance";
import { formatEuro } from "./utils/format";
import { clamp } from "./utils/number";
import { calculateVoltCalc, type FuelType } from "./utils/voltcalc";
import { useI18n } from "./i18n";

type AppView = "voltcalc" | "loancalc" | "carselect";
type SwitchDirection = "forward" | "backward";
type LeadSource = "voltcalc" | "loancalc" | "carselect";

type FuelConfig = {
  labelKey: "petrol" | "diesel" | "hybrid";
  consumption: number;
  price: number;
};

type FuelSettings = Record<FuelType, FuelConfig>;

interface VoltCalcState {
  distance: number;
  fuelType: FuelType;
  electricityPrice: number;
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
  snapshot: VoltLeadSnapshot | LoanLeadSnapshot;
}

const defaultVoltCalcState: VoltCalcState = {
  distance: 18000,
  fuelType: "petrol",
  electricityPrice: 0.173,
  fuelSettings: {
    petrol: { labelKey: "petrol", consumption: 4.5, price: 1.75 },
    diesel: { labelKey: "diesel", consumption: 4.1, price: 1.61 },
    hybrid: { labelKey: "hybrid", consumption: 3.9, price: 1.75 },
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
  const fuelSettings: FuelSettings = {
    petrol: {
      labelKey: "petrol",
      consumption: Number(source?.petrol?.consumption ?? fallback.fuelSettings.petrol.consumption),
      price: Number(source?.petrol?.price ?? fallback.fuelSettings.petrol.price),
    },
    diesel: {
      labelKey: "diesel",
      consumption: Number(source?.diesel?.consumption ?? fallback.fuelSettings.diesel.consumption),
      price: Number(source?.diesel?.price ?? fallback.fuelSettings.diesel.price),
    },
    hybrid: {
      labelKey: "hybrid",
      consumption: Number(source?.hybrid?.consumption ?? fallback.fuelSettings.hybrid.consumption),
      price: Number(source?.hybrid?.price ?? fallback.fuelSettings.hybrid.price),
    },
  };

  return {
    distance: Number(input.distance ?? fallback.distance),
    fuelType,
    electricityPrice: Number(input.electricityPrice ?? fallback.electricityPrice),
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
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [switchDirection, setSwitchDirection] =
    useState<SwitchDirection>("forward");
  const [stageKey, setStageKey] = useState(0);
  const [carId, setCarId] = useState<string | null>(() => getCarIdFromPath());
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    function handlePopState() {
      setCarId(getCarIdFromPath());
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

  const selectedFuel = voltCalc.fuelSettings[voltCalc.fuelType];

  const voltResults = useMemo(() => {
    return calculateVoltCalc({
      distance: voltCalc.distance,
      selectedFuel: {
        label: t(selectedFuel.labelKey),
        consumption: selectedFuel.consumption,
        price: selectedFuel.price,
      },
      evConsumption: voltCalc.evConsumption,
      electricityPrice: voltCalc.electricityPrice,
    });
  }, [voltCalc, selectedFuel, t]);

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

  function handleElectricityPriceChange(value: number) {
    setVoltCalc((prev) => ({
      ...prev,
      electricityPrice: clamp(value, 0, 5),
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
    field: "name" | "email" | "phone",
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

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leadForm.consent) return;

    const payload: LeadSubmission = {
      submittedAt: new Date().toISOString(),
      source: activeView,
      contact: leadForm,
      snapshot:
        activeView === "voltcalc"
          ? {
              distance: voltCalc.distance,
              fuelType: voltCalc.fuelType,
              fuelConsumption: selectedFuel.consumption,
              fuelPrice: selectedFuel.price,
              evConsumption: voltCalc.evConsumption,
              electricityPrice: voltCalc.electricityPrice,
              annualSavings: voltResults.annualSavings,
              monthlySavings: voltResults.monthlySavings,
            }
          : {
              vehiclePrice: loanCalc.price,
              downPayment: loanCalc.downPayment,
              months: loanCalc.months,
              apr: loanCalc.apr,
              amountFinanced: loanSummary.principal,
              monthlyPayment: loanSummary.monthlyPayment,
            },
    };

    const existing = readStorage<LeadSubmission[]>("evcompare-leads", []);
    window.localStorage.setItem(
      "evcompare-leads",
      JSON.stringify([payload, ...existing]),
    );

    setLeadSubmitted(true);
    setLeadForm(defaultLeadFormState);
  }

  const viewTabs: { id: AppView; label: string }[] = [
    { id: "voltcalc", label: t("tabRunning") },
    { id: "loancalc", label: t("tabFinancing") },
    { id: "carselect", label: t("tabModels") },
  ];

  const leadSectionProps = {
    source: activeView,
    title: t("getMatched"),
    intro: t("leadIntro"),
    summaryItems:
      activeView === "voltcalc"
        ? [
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
          ]
        : activeView === "loancalc"
          ? [
              { label: t("vehiclePrice"), value: formatEuro(loanCalc.price, 0) },
              {
                label: t("downPayment"),
                value: formatEuro(loanCalc.downPayment, 0),
              },
              { label: t("loanTerm"), value: `${loanCalc.months} ${t("months")}` },
              {
                label: t("estimatedMonthly"),
                value: formatEuro(loanSummary.monthlyPayment, 0),
              },
            ]
          : [
              { label: t("browse"), value: t("euModels") },
              { label: t("filterBy"), value: t("filterHint") },
            ],
  };

  return (
    <AppShell>
      {carId ? (
        <CarDetailsPage carId={carId} onBack={closeCar} />
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
                    electricityPrice={voltCalc.electricityPrice}
                    onDistanceChange={handleDistanceChange}
                    onFuelTypeChange={handleFuelTypeChange}
                    onFuelSettingChange={handleFuelSettingChange}
                    onEvConsumptionChange={handleEvConsumptionChange}
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
                  />
                )}
              </div>
            </div>
          </section>

          <LeadCaptureSection
            source={leadSectionProps.source}
            title={leadSectionProps.title}
            intro={leadSectionProps.intro}
            summaryItems={leadSectionProps.summaryItems}
            form={leadForm}
            submitted={leadSubmitted}
            onFieldChange={handleLeadFieldChange}
            onConsentChange={handleLeadConsentChange}
            onSubmit={handleLeadSubmit}
          />
        </>
      )}
    </AppShell>
  );
}

export default App;
