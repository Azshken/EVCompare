interface CombustionInputsProps {
  consumptionId: string;
  priceId: string;
  consumptionLabel?: string;
  priceLabel?: string;
  consumptionValue: number;
  priceValue: number;
  consumptionStep?: number;
  priceStep?: number;
  onConsumptionChange: (value: number) => void;
  onPriceChange: (value: number) => void;
}

export function CombustionInputs({
  consumptionId,
  priceId,
  consumptionLabel = 'Consumption (L/100km)',
  priceLabel = 'Fuel price (€/L)',
  consumptionValue,
  priceValue,
  consumptionStep = 0.1,
  priceStep = 0.01,
  onConsumptionChange,
  onPriceChange,
}: CombustionInputsProps) {
  return (
    <>
      <div className="field">
        <label htmlFor={consumptionId}>{consumptionLabel}</label>
        <input
          id={consumptionId}
          type="number"
          step={consumptionStep}
          value={consumptionValue}
          onChange={(e) => onConsumptionChange(Number(e.target.value))
          }
        />
      </div>

      <div className="field">
        <label htmlFor={priceId}>{priceLabel}</label>
        <input
          id={priceId}
          type="number"
          step={priceStep}
          value={priceValue}
          onChange={(e) => onPriceChange(Number(e.target.value))
          }
        />
      </div>
    </>
  );
}