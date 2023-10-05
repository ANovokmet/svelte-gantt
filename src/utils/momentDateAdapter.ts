import { SvelteGanttDateAdapter } from './date';

/**
 * Date adapter that uses MomentJS
 */
export class MomentSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    moment;

    constructor(moment) {
        this.moment = moment;
    }

    format(date: number, format: string): string {
        return this.moment(date).format(format);
    }

    roundTo(date: number, unit: string, offset: number): number {
        const m = this.moment(date);
        roundMoment(m, offset, unit);
        return m.valueOf();
    }
}

const aliases = {
    hour: 'hours',
    minute: 'minutes',
    second: 'seconds',
    millisecond: 'milliseconds',
}

// TODO: write tests for this
function roundMoment(m, precision, key, direction = 'round') {
    if (precision === 1 && key === 'day') {
        precision = 24;
        key = 'hours';
    }

    if (aliases[key]) {
        key = aliases[key];
    }

    const methods = {
        hours: 24,
        minutes: 60,
        seconds: 60,
        milliseconds: 1000
    };

    if (!methods[key]) {
        console.warn(`Rounding dates by ${key} is not supported`);
    }

    let value = 0;
    let rounded = false;
    let subRatio = 1;
    let maxValue;
    
    for (const k in methods){
        if (k === key) {
            value = m.get(key);
            maxValue = methods[k];
            rounded = true;
        } else if(rounded) {
            subRatio *= methods[k];
            value += m.get(k) / subRatio;
            m.set(k, 0);
        }
    }

    value = Math[direction](value / precision) * precision; // value is date represented in units of `key`, ignoring the bigger units, eg 14h30m->14.5h
    value = Math.min(value, maxValue);
    m.set(key, value);
    return m;
}