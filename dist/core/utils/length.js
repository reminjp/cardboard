import { FLOAT_AND_UNIT_PATTERN } from './regexp.js';
/** Intermediate pixels per inch. `lcm(254, 96, 72) * 1000` */
const IPX_PER_IN = 36576 * 1000;
const LENGTH_UNITS = ['ipx', 'in', 'mm', 'pt', 'px'];
const PER_IN = {
    ipx: IPX_PER_IN,
    in: 1,
    mm: 25.4,
    pt: 72,
    px: 96,
};
export class Length {
    static ZERO = new Length('ipx', 0);
    static from(thing) {
        if (typeof thing === 'string') {
            if (thing === '0')
                return Length.ZERO;
            const [, numberString, unit] = thing.match(new RegExp(`^${FLOAT_AND_UNIT_PATTERN}$`)) ?? [];
            const number = Number.parseFloat(numberString ?? '');
            if (!numberString || Number.isNaN(number)) {
                throw new Error(`Invalid length string: ${thing}`);
            }
            if (!unit || !LENGTH_UNITS.includes(unit)) {
                throw new Error(`Unsupported unit: ${unit}`);
            }
            return new Length(unit, number);
        }
        return new Length(thing.unit, thing.number);
    }
    number;
    unit;
    constructor(unit, number) {
        this.number = number;
        this.unit = unit;
    }
    toString() {
        return `${this.number}${this.unit}`;
    }
    toUnit(unit) {
        if (unit === this.unit)
            return this;
        return new Length(unit, (this.number * PER_IN[unit]) / PER_IN[this.unit]);
    }
}
export function replaceAllSupportedLengthToIpx(value) {
    return value.replaceAll(new RegExp(FLOAT_AND_UNIT_PATTERN, 'g'), (match, numberString, unit) => {
        if (!LENGTH_UNITS.includes(unit))
            return match;
        const number = Number.parseFloat(numberString);
        if (Number.isNaN(number))
            return match;
        return `${Length.from({ number, unit }).toUnit('ipx').number}px`;
    });
}
