export type FuelType = 'petrol' | 'diesel' | 'hybrid';
export type EvMode = 'wltp' | '90' | '120';

export interface SelectedFuelInput {
  label: string;
  consumption: number;
  price: number;
}

export interface VoltCalcInput {
  distance: number;
  selectedFuel: SelectedFuelInput;
  evConsumption: number;
  electricityPrice: number;
}

export interface VoltCalcResult {
  fuelCostPer100: number;
  evCostPer100: number;
  annualFuelCostBase: number;
  annualOilChangeCost: number;
  annualFuelCost: number;
  annualEvCost: number;
  annualSavings: number;
  monthlySavings: number;
  savingsFiveYears: number;
  annualEvEnergy: number;
}

export function getEvConsumption(evMode: EvMode): number {
  if (evMode === '90') return 15;
  if (evMode === '120') return 20;
  return 17;
}

export function calculateAnnualOilServiceCost(distance: number): number {
  if (distance <= 10000) return 150;
  return 150 + ((distance - 10000) / 10000) * 150;
}

export function calculateVoltCalc(input: VoltCalcInput): VoltCalcResult {
  const fuelCostPer100 = input.selectedFuel.consumption * input.selectedFuel.price;
  const evCostPer100 = input.evConsumption * input.electricityPrice;

  const annualFuelCostBase = (input.distance / 100) * fuelCostPer100;
  const annualEvCost = (input.distance / 100) * evCostPer100;
  const annualOilChangeCost = calculateAnnualOilServiceCost(input.distance);

  const annualFuelCost = annualFuelCostBase + annualOilChangeCost;
  const annualSavings = annualFuelCost - annualEvCost;
  const monthlySavings = annualSavings / 12;
  const savingsFiveYears = annualSavings * 5;
  const annualEvEnergy = (input.distance / 100) * input.evConsumption;

  return {
    fuelCostPer100,
    evCostPer100,
    annualFuelCostBase,
    annualOilChangeCost,
    annualFuelCost,
    annualEvCost,
    annualSavings,
    monthlySavings,
    savingsFiveYears,
    annualEvEnergy,
  };
}