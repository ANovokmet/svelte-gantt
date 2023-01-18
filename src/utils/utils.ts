export class GanttUtils {
    from: number;
    to: number;
    width: number;
    magnetOffset: number;
    magnetUnit: string;
    magnetDuration: number;

    /** because gantt width is not always correct */
     /**BlueFox 09.01.23: couldn't reproduce the above so I removed the code
    //totalColumnDuration: number;
    //totalColumnWidth: number;

    constructor() {
    }

    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date 
     */
    getPositionByDate (date: number) {
        return getPositionByDate(date, this.from, this.to, this.width); 
    }

    getDateByPosition (x) {
        return getDateByPosition(x, this.from, this.to, this.width);
    }

    roundTo (date: number) {
        let value = Math.round(date / this.magnetDuration) * this.magnetDuration;
        return value;
    }
}

export function getPositionByDate (date: number, from: number, to: number, width: number) {
    if (!date) {
      return undefined
    }

    let durationTo = date - from;
    let durationToEnd = to - from;

    return durationTo / durationToEnd * width;
}

export function getDateByPosition (x: number, from: number, to: number, width: number) {
    let durationTo = (x / width) * (to - from);
    let dateAtPosition = from + durationTo;
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
  