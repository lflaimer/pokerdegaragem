import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function formatMoney(value: string | number | Decimal): string {
  const decimal = toDecimal(value);
  return decimal.toFixed(2);
}

export function formatMoneyWithSign(value: string | number | Decimal): string {
  const decimal = toDecimal(value);
  const formatted = decimal.abs().toFixed(2);
  if (decimal.isPositive() && !decimal.isZero()) {
    return `+${formatted}`;
  } else if (decimal.isNegative()) {
    return `-${formatted}`;
  }
  return formatted;
}

export function sumDecimals(values: (string | number | Decimal)[]): Decimal {
  return values.reduce<Decimal>((sum, val) => sum.plus(toDecimal(val)), new Decimal(0));
}

export function calculateNet(won: string | number | Decimal, spent: string | number | Decimal): Decimal {
  return toDecimal(won).minus(toDecimal(spent));
}

export function decimalToNumber(value: Decimal): number {
  return value.toNumber();
}

export function isValidMoneyString(value: string): boolean {
  try {
    const decimal = new Decimal(value);
    return decimal.isFinite() && decimal.gte(0);
  } catch {
    return false;
  }
}
