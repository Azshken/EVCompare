import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "sk" | "en";

const DICT = {
  heroTitle: {
    en: "Compare EV savings and monthly cost in one place",
    sk: "Porovnajte úspory EV a mesačné náklady na jednom mieste",
  },
  heroIntro: {
    en: "Use the same result flow to compare yearly EV running costs, then switch into financing without losing your numbers or leaving the page.",
    sk: "Porovnajte ročné prevádzkové náklady EV a potom prejdite na financovanie bez straty čísel.",
  },
  tabRunning: { en: "Running costs", sk: "Prevádzkové náklady" },
  tabFinancing: { en: "Financing", sk: "Financovanie" },
  tabModels: { en: "EV models", sk: "Modely" },
  switchToEn: { en: "Switch to English", sk: "Prepnúť na angličtinu" },
  switchToSk: { en: "Switch to Slovak", sk: "Prepnúť na slovenčinu" },
  searchPlaceholder: { en: "Search brand or model…", sk: "Hľadať značku alebo model…" },
  allBrands: { en: "All brands", sk: "Všetky značky" },
  allTypes: { en: "All types", sk: "Všetky typy" },
  ecoMin: { en: "Eco ≥", sk: "Eko ≥" },
  sortRange: { en: "Range", sk: "Dojazd" },
  sortEfficiency: { en: "Efficiency", sk: "Účinnosť" },
  sortPrice: { en: "Price", sk: "Cena" },
  tiles: { en: "Tiles", sk: "Dlaždice" },
  list: { en: "List", sk: "Zoznam" },
  carsCount: { en: "cars", sk: "áut" },
  select: { en: "Select", sk: "Vybrať" },
  selected: { en: "Selected", sk: "Vybrané" },
  recommended: { en: "Recommended", sk: "Odporúčam" },
  priceList: { en: "Price list", sk: "Cenník" },
  configurator: { en: "Configurator", sk: "Konfigurátor" },
  financingTitle: { en: "Financing", sk: "Financovanie" },
  financingSubtitle: { en: "Adjust the down payment and term", sk: "Upravte akontáciu a dobu splácania" },
  vehiclePrice: { en: "Vehicle price", sk: "Cena vozidla" },
  downPayment: { en: "Down payment", sk: "Akontácia" },
  loanTerm: { en: "Loan term", sk: "Doba splácania" },
  years: { en: "years", sk: "rokov" },
  apr: { en: "APR (%)", sk: "Úrok (%)" },
  loanNote: {
    en: "Loan payment is calculated using a standard amortizing loan model.",
    sk: "Splátka je vypočítaná štandardným amortizačným modelom úveru.",
  },
  estimatedPayment: { en: "Estimated loan payment", sk: "Odhadovaná splátka" },
  perMonth: { en: "/ month", sk: "/ mesiac" },
  afterEvSavings: { en: "after EV savings", sk: "po úsporách EV" },
  totalInterest: { en: "Total interest", sk: "Celkové úroky" },
  totalPaid: { en: "Total paid", sk: "Celkom zaplatené" },
  trueCost: { en: "True cost after EV savings", sk: "Skutočné náklady po úsporách EV" },
  annualDistance: { en: "Annual distance driven", sk: "Ročný nájazd" },
  kmPerYear: { en: "km / year", sk: "km / rok" },
  annualComparison: { en: "Annual cost comparison", sk: "Ročné porovnanie nákladov" },
  combustion: { en: "Combustion vehicle", sk: "Spaľovacie vozidlo" },
  electric: { en: "Electric", sk: "Elektrické" },
  recommendedChip: { en: "Recommended", sk: "Odporúčané" },
  avgConsumption: { en: "Avg. consumption", sk: "Priem. spotreba" },
  fuelPrice: { en: "Fuel price", sk: "Cena paliva" },
  electricityPrice: { en: "Electricity price", sk: "Cena elektriny" },
  costPer100: { en: "Cost per 100 km", sk: "Náklad na 100 km" },
  perYear: { en: "EUR/year", sk: "EUR/rok" },
  includesOil: { en: "Includes oil service", sk: "Vrátane výmeny oleja" },
  nextStep: { en: "Next step", sk: "Ďalší krok" },
  getMatched: { en: "Get matched offers", sk: "Získať ponuky" },
  leadIntro: {
    en: "Leave your details and we will connect you with relevant EV or financing options based on your calculation.",
    sk: "Zanechajte údaje a prepojíme vás s relevantnými EV alebo finančnými ponukami podľa vášho výpočtu.",
  },
  sendResult: { en: "Send my result", sk: "Odoslať výsledok" },
  capturedResult: { en: "Captured result", sk: "Zachytený výsledok" },
  fullName: { en: "Full name", sk: "Celé meno" },
  email: { en: "Email", sk: "E-mail" },
  phone: { en: "Phone", sk: "Telefón" },
  consent: {
    en: "I agree to be contacted about EV and financing offers.",
    sk: "Súhlasím s kontaktovaním ohľadom EV a finančných ponúk.",
  },
  thanks: { en: "Thanks — we will be in touch.", sk: "Ďakujeme — ozveme sa." },
  evOffers: { en: "EV offers", sk: "EV ponuky" },
  financingLeads: { en: "Financing leads", sk: "Finančné dopyty" },
  browse: { en: "Browse", sk: "Prehliadať" },
  filterBy: { en: "Filter by", sk: "Filtrovať podľa" },
  filterHint: { en: "brand, type, eco rating", sk: "značka, typ, eko hodnotenie" },
  euModels: { en: "EU EV models", sk: "EU EV modely" },
  months: { en: "months", sk: "mesiacov" },
  estimatedMonthly: { en: "Estimated monthly payment", sk: "Odhadovaná mesačná splátka" },
  annualSavings: { en: "Annual savings", sk: "Ročné úspory" },
  monthlySavings: { en: "Monthly savings", sk: "Mesačné úspory" },
  petrol: { en: "Petrol", sk: "Benzín" },
  diesel: { en: "Diesel", sk: "Nafta" },
  hybrid: { en: "Hybrid", sk: "Hybrid" },
} as const;

export type DictKey = keyof typeof DICT;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
  locale: string;
};

const I18nContext = createContext<I18nValue | null>(null);

function readLang(): Lang {
  if (typeof window === "undefined") return "sk";
  const saved = window.localStorage.getItem("evcompare-lang");
  return saved === "en" ? "en" : "sk";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    window.localStorage.setItem("evcompare-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value: I18nValue = {
    lang,
    setLang: setLangState,
    t: (key) => DICT[key][lang],
    locale: lang === "sk" ? "sk-SK" : "en-GB",
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
