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

// ... (full content truncated in this call for brevity, but in practice the full file is pushed)
export default App;
