import { FLOAT_AND_UNIT_PATTERN } from './regexp.ts';

/** Intermediate pixels per inch. `lcm(254, 96, 72) * 1000` */
const IPX_PER_IN = 36576 * 1000;

const LENGTH_UNITS = ['ipx', 'in', 'mm', 'pt', 'px'] as const;
type LengthUnit = (typeof LENGTH_UNITS)[number];

const PER_IN: Record<LengthUnit, number> = {
  ipx: IPX_PER_IN,
  in: 1,
  mm: 25.4,
  pt: 72,
  px: 96,
};

interface LengthLike {
  number: number;
  unit: LengthUnit;
}

export class Length {
  static readonly ZERO = new Length('ipx', 0);

  static from(thing: LengthLike | string) {
    if (typeof thing === 'string') {
      if (thing === '0') return Length.ZERO;

      const [, numberString, unit] =
        thing.match(new RegExp(`^${FLOAT_AND_UNIT_PATTERN}$`)) ?? [];
      const number = Number.parseFloat(numberString);

      if (!numberString || Number.isNaN(number)) {
        throw new Error(`Invalid length string: ${thing}`);
      }

      if (!(LENGTH_UNITS as readonly string[]).includes(unit)) {
        throw new Error(`Unsupported unit: ${unit}`);
      }

      return new Length(unit as LengthUnit, number);
    }

    return new Length(thing.unit, thing.number);
  }

  readonly number: number;
  readonly unit: LengthUnit;

  constructor(unit: LengthUnit, number: number) {
    this.number = number;
    this.unit = unit;
  }

  toString(): string {
    return `${this.number}${this.unit}`;
  }

  toUnit(unit: LengthUnit): Length {
    if (unit === this.unit) return this;
    return new Length(unit, (this.number * PER_IN[unit]) / PER_IN[this.unit]);
  }
}

export function replaceAllSupportedLengthToIpx(value: string): string {
  return value.replaceAll(
    new RegExp(FLOAT_AND_UNIT_PATTERN, 'g'),
    (match, numberString, unit) => {
      if (!LENGTH_UNITS.includes(unit)) return match;

      const number = Number.parseFloat(numberString);
      if (Number.isNaN(number)) return match;

      return `${Length.from({ number, unit }).toUnit('ipx').number}px`;
    },
  );
}
