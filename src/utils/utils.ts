import { Moment } from "moment";

export class GanttUtils {
    from: Moment;
    to: Moment;
    width: number;
    magnetOffset: number;
    magnetUnit: string;

    constructor() {
    }

    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date 
     */
    getPositionByDate (date) {
        return getPositionByDate(date, this.from, this.to, this.width); 
    }

    getDateByPosition (x) {
        return getDateByPosition(x, this.from, this.to, this.width);
    }

    /**
     * 
     * @param {Moment} date - Date
     * @returns {Moment} rounded date passed as parameter
     */
    roundTo (date) {
        let value = date.get(this.magnetUnit)
    
        value = Math.round(value / this.magnetOffset);
    
        date.set(this.magnetUnit, value * this.magnetOffset);

        //round all smaller units to 0
        const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
        const indexOf = units.indexOf(this.magnetUnit);
        for (let i = 0; i < indexOf; i++) {
            date.set(units[i], 0)
        }
        return date
    }
}

export function getPositionByDate (date, from, to, width) {
    if (!date) {
      return undefined
    }

    let durationTo = date.diff(from, 'milliseconds')
    let durationToEnd = to.diff(from, 'milliseconds')

    return durationTo / durationToEnd * width;
}

export function getDateByPosition (x, from, to, width) {
    let durationTo = x / width * to.diff(from, 'milliseconds');
    let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
    return dateAtPosition; 
}

// Returns the object on the left and right in an array using the given cmp function.
// The compare function defined which property of the value to compare (e.g.: c => c.left)
export function getIndicesOnly<T, C = number|Date> (input: T[], value: C, comparer: {(T: T): C}, strict?: boolean) {
    let lo = -1;
    let hi = input.length;
    while (hi - lo > 1) {
        let mid = Math.floor((lo + hi) / 2);
        if (strict ? comparer(input[mid]) < value : comparer(input[mid]) <= value) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    if (!strict && input[lo] !== undefined && comparer(input[lo]) === value) {
        hi = lo;
    }
    return [lo, hi];
}
  
export function get<T, C = number|Date> (input: T[], value: C, comparer: {(T: T): C}, strict?: boolean) {
    let res = getIndicesOnly(input, value, comparer, strict);
    return [input[res[0]], input[res[1]]];
}
  