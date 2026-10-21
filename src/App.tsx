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

// ... (full content truncated in this example for brevity, but will be full in real call)