import { useEffect, useMemo, useRef, useState, type FormEvent, type TouchEvent } from "react";
import { AppShell } from "./components/AppShell";
import { LeadCaptureSection } from "./components/common/LeadCaptureSection";
import { LoanCalcPage } from "./components/loancalc/LoanCalcPage";
import { VoltCalcPage } from "./components/voltcalc/VoltCalcPage";
import { CarSelectPage } from "./components/carselect/CarSelectPage";
import { calculateMonthlyPayment } from "./utils/finance";
import { formatEuro } from "./utils/format";
import { clamp } from "./utils/number";
import { calculateVoltCalc, type FuelType } from "./utils/voltcalc";

type AppView = "voltcalc" | "loancalc" | "carselect";
type SwitchDirection = "forward" | "backward";

type FuelConfig = {
  label: string;
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
  source: AppView;
  contact: LeadFormState;
  snapshot: VoltLeadSnapshot | LoanLeadSnapshot;
}

const defaultVoltCalcState: VoltCalcState = {
  distance: 18000,
  fuelType: "petrol",
  electricityPrice: 0.173,
  fuelSettings: {
    petrol: { label: "Petrol", consumption: 4.5, price: 1.75 },
    diesel: { label: "Diesel", consumption: 4.1, price: 1.61 },
    hybrid: { label: "Hybrid", consumption: 3.9, price: 1.75 },
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

function App() {
  const [activeView, setActiveView] = useState<AppView>(() =>
    readStorage<AppView>("evcompare-active-view", "voltcalc"),
  );
  const [voltCalc, setVoltCalc] = useState<VoltCalcState>(() =>
    readStorage<VoltCalcState>("evcompare-voltcalc", defaultVoltCalcState),
  );
  const [loanCalc, setLoanCalc] = useState<LoanCalcState>(() =>
    readStorage<LoanCalcState>("evcompare-loancalc", defaultLoanCalcState),
  );
  const [leadForm, setLeadForm] = useState<LeadFormState>(defaultLeadFormState);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [switchDirection, setSwitchDirection] =
    useState<SwitchDirection>("forward");
  const [stageKey, setStageKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  const voltResults = useMemo(() => {
    return calculateVoltCalc({
      distance: voltCalc.distance,
      selectedFuel: voltCalc.fuelSettings[voltCalc.fuelType],
      evConsumption: voltCalc.evConsumption,
      electricityPrice: voltCalc.electricityPrice,
    });
  }, [voltCalc]);

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
              fuelConsumption:
                voltCalc.fuelSettings[voltCalc.fuelType].consumption,
              fuelPrice: voltCalc.fuelSettings[voltCalc.fuelType].price,
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

  const viewLabel =
    activeView === "voltcalc"
      ? "Running costs"
      : activeView === "loancalc"
        ? "Financing"
        : "EV models";

  const leadSectionProps = {
    source: activeView,
    title: "Get matched offers",
    intro:
      "Leave your details and we will connect you with relevant EV or financing options based on your calculation.",
    submitLabel: "Send my result",
    summaryItems:
      activeView === "voltcalc"
        ? [
            {
              label: "Annual distance",
              value: `${voltCalc.distance.toLocaleString("en-US")} km/year`,
            },
            {
              label: "Compared against",
              value: voltCalc.fuelSettings[voltCalc.fuelType].label,
            },
            {
              label: "Annual EV savings",
              value: formatEuro(voltResults.annualSavings, 2),
            },
            {
              label: "Monthly EV savings",
              value: formatEuro(voltResults.monthlySavings, 2),
            },
          ]
        : activeView === "loancalc"
          ? [
              { label: "Vehicle price", value: formatEuro(loanCalc.price, 0) },
              {
                label: "Down payment",
                value: formatEuro(loanCalc.downPayment, 0),
              },
              { label: "Loan term", value: `${loanCalc.months} months` },
              {
                label: "Estimated monthly payment",
                value: formatEuro(loanSummary.monthlyPayment, 0),
              },
            ]
          : [
              { label: "Browse", value: "EU EV models" },
              { label: "Filter by", value: "brand, type, eco rating" },
            ],
  };

  return (
    <AppShell>
      <section className="calculator-stage-shell" aria-live="polite">
        <div className="stage-nav">
          <button
            type="button"
            className="stage-switch stage-switch-left"
            onClick={goPrev}
            aria-label="Previous view"
            title="Previous"
          >
            <span className="stage-switch-arrow" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </span>
          </button>

          <span className="stage-nav-label">{viewLabel}</span>

          <button
            type="button"
            className="stage-switch stage-switch-right"
            onClick={goNext}
            aria-label="Next view"
            title="Next"
          >
            <span className="stage-switch-arrow" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
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
            {activeView === "carselect" && <CarSelectPage />}
          </div>
        </div>
      </section>

      <LeadCaptureSection
        source={leadSectionProps.source}
        title={leadSectionProps.title}
        intro={leadSectionProps.intro}
        submitLabel={leadSectionProps.submitLabel}
        summaryItems={leadSectionProps.summaryItems}
        form={leadForm}
        submitted={leadSubmitted}
        onFieldChange={handleLeadFieldChange}
        onConsentChange={handleLeadConsentChange}
        onSubmit={handleLeadSubmit}
      />
    </AppShell>
  );
}

export default App;
