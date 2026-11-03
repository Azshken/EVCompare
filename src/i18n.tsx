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
  tabModels: { en: "EV models", sk: "EV modely" },
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
  recommended: { en: "Recommended", sk: "Odporúčame" },
  priceList: { en: "Price list", sk: "Cenník" },
  configurator: { en: "Configurator", sk: "Konfigurátor" },
  info: { en: "Info", sk: "Informácie" },
  carDetails: { en: "Car details", sk: "Detaily vozidla" },
  backToModels: { en: "Back to models", sk: "Späť na modely" },
  compare: { en: "Compare", sk: "Porovnať" },
  compareEmpty: {
    en: "Check cars to compare them.",
    sk: "Označte autá pre porovnanie.",
  },
  detailsComingSoon: {
    en: "Detailed information about this model is coming soon.",
    sk: "Podrobné informácie o tomto modeli budú čoskoro dostupné.",
  },
  specsTitle: { en: "Technical information", sk: "Technické informácie" },
  drive: { en: "Drive", sk: "Pohon" },
  peakPower: { en: "Peak power", sk: "Najvyšší menovitý výkon" },
  power30min: { en: "30-min power", sk: "Najvyšší 30-min výkon" },
  batteryCharging: { en: "Battery and charging", sk: "Batéria a nabíjanie" },
  batteryType: { en: "Type", sk: "Typ" },
  batteryCapacity: { en: "Rated capacity net (gross)", sk: "Menovitá kapacita netto (brutto)" },
  dcMax: { en: "Max. DC charging power", sk: "Max. DC nabíjací výkon" },
  dcTime: { en: "DC charging 10%–80% SoC", sk: "Nabíjanie DC 10%–80% SoC" },
  acTime: { en: "AC charging 11 kW 0%–100% SoC", sk: "Nabíjanie AC 11 kW 0%–100% SoC" },
  curbWeight: { en: "Weight (actual)", sk: "Hmotnosť (skutočná)" },
  topSpeed: { en: "Top speed", sk: "Max. rýchlosť" },
  acceleration: { en: "Acceleration 0–100 km/h", sk: "Akcelerácia 0–100 km/h" },
  turningCircle: { en: "Turning circle", sk: "Priemer otáčania" },
  consumption: { en: "Consumption", sk: "Spotreba" },
  combinedConsumption: { en: "Combined (WLTP)", sk: "Kombinovaná (WLTP)" },
  combinedRange: { en: "Combined range (WLTP)", sk: "Dojazd kombinovaný (WLTP)" },
  heatPump: { en: "Heat pump", sk: "Tepelné čerpadlo" },
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
  petrol: { en: "Petrol", sk: "Benzín" },
  diesel: { en: "Diesel", sk: "Nafta" },
  hybrid: { en: "Hybrid", sk: "Hybrid" },
  comparedAgainst: { en: "Compared against", sk: "Porovnané s" },
  annualEvSavings: { en: "Annual EV savings", sk: "Ročné úspory EV" },
  monthlyEvSavings: { en: "Monthly EV savings", sk: "Mesačné úspory EV" },
  annualEvSavingsBanner: {
    en: "Annual savings with an electric vehicle",
    sk: "Ročné úspory s elektrickým vozidlom",
  },
  versusCombustion: {
    en: "vs. combustion vehicle",
    sk: "oproti spaľovaciemu vozidlu",
  },
  runningCostStats: {
    en: "Running cost stats",
    sk: "Štatistiky prevádzkových nákladov",
  },
  monthlyEvSaving: {
    en: "Monthly EV saving",
    sk: "Mesačná úspora EV",
  },
  totalKwhPerYear: {
    en: "Total kWh used/year",
    sk: "Celková spotreba kWh/rok",
  },
  fiveYearSavings: {
    en: "5-year total savings",
    sk: "Úspory za 5 rokov",
  },
  fuelConsumptionAdjuster: {
    en: "Fuel consumption adjuster",
    sk: "Nastavenie spotreby paliva",
  },
  decreaseFuelConsumption: {
    en: "Decrease combustion consumption",
    sk: "Znížiť spotrebu spaľovacieho vozidla",
  },
  increaseFuelConsumption: {
    en: "Increase combustion consumption",
    sk: "Zvýšiť spotrebu spaľovacieho vozidla",
  },
  evConsumptionAdjuster: {
    en: "EV consumption adjuster",
    sk: "Nastavenie spotreby EV",
  },
  decreaseEvConsumption: {
    en: "Decrease EV consumption",
    sk: "Znížiť spotrebu EV",
  },
  increaseEvConsumption: {
    en: "Increase EV consumption",
    sk: "Zvýšiť spotrebu EV",
  },
  nextStep: { en: "Next step", sk: "Ďalší krok" },
  getMatched: { en: "Get matched offer", sk: "Získať ponuku" },
  leadIntro: {
    en: "Leave your details and we will connect you with relevant EV or financing options based on your calculation.",
    sk: "Zanechajte údaje a prepojíme vás s relevantnými EV alebo finančnými ponukami podľa vášho výpočtu.",
  },
  sendResult: { en: "Send my result", sk: "Odoslať výsledok" },
  capturedResult: { en: "Captured result", sk: "Zachytený výsledok" },
  fullName: { en: "Full name", sk: "Celé meno" },
  fullNamePlaceholder: { en: "Ján Novák", sk: "Ján Novák" },
  fullNameHint: {
    en: "So a dealer or lender knows who to contact.",
    sk: "Aby predajca alebo poskytovateľ financovania vedel, koho kontaktovať.",
  },
  email: { en: "Email", sk: "E-mail" },
  emailPlaceholder: { en: "name@example.com", sk: "meno@priklad.sk" },
  customMessage: { en: "Your note", sk: "Vaša poznámka" },
  customMessagePlaceholder: {
    en: "Anything else we should know…",
    sk: "Čokoľvek ďalšie, čo by sme mali vedieť…",
  },
  carModel: { en: "Car model", sk: "Model auta" },
  selectedCar: { en: "Selected car", sk: "Vybrané auto" },
  checkedCars: { en: "Checked cars", sk: "Označené autá" },
  none: { en: "None", sk: "Žiadne" },
  runningResults: { en: "Running costs", sk: "Prevádzkové náklady" },
  financingResults: { en: "Financing", sk: "Financovanie" },
  modelResults: { en: "EV models", sk: "EV modely" },
  emailHint: {
    en: "We send your result and relevant offer here.",
    sk: "Sem vám pošleme výsledok a relevantnú ponuku.",
  },
  phone: { en: "Phone", sk: "Telefón" },
  phoneOptional: { en: "(optional)", sk: "(nepovinné)" },
  phonePlaceholder: { en: "+421 …", sk: "+421 …" },
  phoneHint: {
    en: "Optional, but helps arrange a test drive or financing call faster.",
    sk: "Nepovinné, ale urýchli dohodnutie skúšobnej jazdy alebo financovania.",
  },
  consent: {
    en: "I agree that EVCompare may share my details with selected EV dealers and financing providers so they can contact me about relevant offers.",
    sk: "Súhlasím, že EVCompare môže poskytnúť moje údaje vybraným predajcom EV a poskytovateľom financovania, aby ma mohli kontaktovať ohľadom relevantných ponúk.",
  },
  consentPrivacy: {
    en: "Privacy policy",
    sk: "Zásady ochrany súkromia",
  },
  getPersonalisedOffers: {
    en: "Get my personalised EV offers",
    sk: "Získať personalizované EV ponuky",
  },
  leadSuccess: {
    en: "Thanks — your result has been saved and we will be in touch.",
    sk: "Ďakujeme — váš výsledok bol uložený a ozveme sa vám.",
  },
  thanks: { en: "Thanks — we will be in touch.", sk: "Ďakujeme — ozveme sa." },
  evOffers: { en: "EV offers", sk: "EV ponuky" },
  financingLeads: { en: "Financing leads", sk: "Finančné dopyty" },
  browse: { en: "Browse", sk: "Prehliadať" },
  filterBy: { en: "Filter by", sk: "Filtrovať podľa" },
  filterHint: { en: "brand, type, eco rating", sk: "značka, typ, eko hodnotenie" },
  euModels: { en: "EU EV models", sk: "EV modely v EÚ" },

  charging: { en: "Charging", sk: "Nabíjanie" },
  homeCharging: { en: "Home", sk: "Doma" },
  publicCharging: { en: "Public", sk: "Verejné" },
  months: { en: "months", sk: "mesiacov" },
  estimatedMonthly: { en: "Estimated monthly payment", sk: "Odhadovaná mesačná splátka" },
  annualSavings: { en: "Annual savings", sk: "Ročné úspory" },
  monthlySavings: { en: "Monthly savings", sk: "Mesačné úspory" },
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
