const MM_PER_INCH = 25.4;
const INCHES_PER_FOOT = 12;

export function feetAndInchesToMm(feet: number, inches = 0): number {
  return Math.round((feet * INCHES_PER_FOOT + inches) * MM_PER_INCH);
}

export function mmToFeet(mm: number): number {
  return mm / MM_PER_INCH / INCHES_PER_FOOT;
}

export function mmToMetres(mm: number): number {
  return mm / 1000;
}

export function roundQuantity(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function formatImperialFromMm(mm: number): string {
  const totalInches = mm / MM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches - feet * INCHES_PER_FOOT);
  return `${feet}' ${inches}\"`;
}
