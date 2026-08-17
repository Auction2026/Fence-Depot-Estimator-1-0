export type Money = bigint;

export const money = {
  fromCents(value: number | bigint): Money {
    return BigInt(value);
  },
  fromDecimal(value: number): Money {
    return BigInt(Math.round(value * 100));
  },
  add(...values: Money[]): Money {
    return values.reduce((total, value) => total + value, BigInt(0));
  },
  multiply(value: Money, multiplier: number): Money {
    return BigInt(Math.round(Number(value) * multiplier));
  },
  applyBasisPoints(value: Money, basisPoints: number): Money {
    return BigInt(Math.round((Number(value) * basisPoints) / 10000));
  },
  markup(cost: Money, basisPoints: number): Money {
    return cost + money.applyBasisPoints(cost, basisPoints);
  },
  margin(cost: Money, basisPoints: number): Money {
    const divisor = 1 - basisPoints / 10000;
    return BigInt(Math.round(Number(cost) / divisor));
  },
  format(value: Money, currency = "CAD"): string {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
    }).format(Number(value) / 100);
  },
  toNumber(value: Money): number {
    return Number(value);
  },
};
