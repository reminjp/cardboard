const COLOR_TYPES = ['cmyk', 'rgba', 'transparent'];
export class Color {
    static TRANSPARENT = new Color('transparent', 0, 0, 0, 0);
    static from(thing) {
        if (thing.startsWith('#')) {
            let hex = thing.slice(1).trim();
            if (hex.length === 3) {
                hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}ff`;
            }
            else if (hex.length === 6) {
                hex = `${hex}ff`;
            }
            if (hex.length !== 8)
                throw new Error(`Invalid color string: ${thing}`);
            return new Color('rgba', Number.parseInt(thing.slice(0, 2), 16) / 256, Number.parseInt(thing.slice(2, 4), 16) / 256, Number.parseInt(thing.slice(4, 6), 16) / 256, Number.parseInt(thing.slice(6, 8), 16) / 256);
        }
        if (thing.startsWith('cmyk(')) {
            const values = thing
                .slice(5, -1)
                .trim()
                .split(/\s+/)
                .map((v) => {
                if (v.endsWith('%'))
                    return Number.parseFloat(v.slice(0, -1)) / 100;
                throw new Error(`Invalid color string: ${thing}`);
            });
            return new Color('cmyk', values[0] || 0, values[1] || 0, values[2] || 0, values[3] || 0);
        }
        throw new Error(`Invalid color string: ${thing}`);
    }
    type;
    values;
    get c() {
        return this.type === 'cmyk' ? this.values[0] : 0;
    }
    get m() {
        return this.type === 'cmyk' ? this.values[1] : 0;
    }
    get y() {
        return this.type === 'cmyk' ? this.values[2] : 0;
    }
    get k() {
        return this.type === 'cmyk' ? this.values[3] : 0;
    }
    get r() {
        return this.type === 'rgba' ? this.values[0] : 0;
    }
    get g() {
        return this.type === 'rgba' ? this.values[1] : 0;
    }
    get b() {
        return this.type === 'rgba' ? this.values[2] : 0;
    }
    get a() {
        return this.type === 'rgba' ? this.values[3] : 0;
    }
    constructor(type, ...values) {
        this.type = type;
        this.values = values;
    }
}
