import { SvelteGanttDateAdapter } from './date';

type UtilsParams = Readonly<{
    from: number;
    to: number;
    width: number;
    magnetOffset: number;
    magnetUnit: string;
    magnetDuration: number;
    dateAdapter: SvelteGanttDateAdapter;

    /** because gantt width is not always correct */
    /**BlueFox 09.01.23: couldn't reproduce the above so I removed the code
    //totalColumnDuration: number;
    //totalColumnWidth: number;**/
}>;

export function createUtils(params: UtilsParams) {
    return {        
        /**
         * Returns position of date on a line if from and to represent length of width
         * @param {*} date 
         */
        getPositionByDate(date: number) {
            return getPositionByDate(date, params.from, params.to, params.width);
        },

        getDateByPosition(x) {
            return getDateByPosition(x, params.from, params.to, params.width);
        },

        roundTo(date: number) {
            if (params.dateAdapter) {
                return params.dateAdapter.roundTo(date, params.magnetUnit, params.magnetOffset);
            }
            // this does not consider the timezone, rounds only to the UTC time
            // let value = Math.round((date - 7200000) / params.magnetDuration) * params.magnetDuration;
            // cases where rounding to day or timezone offset is not rounded, this won't work
            return null;
        }
    }
}

export type GanttUtils = ReturnType<typeof createUtils>;

export function getPositionByDate(date: number, from: number, to: number, width: number) {
    if (!date) {
        return undefined;
    }

    const durationTo = date - from;
    const durationToEnd = to - from;

    return (durationTo / durationToEnd) * width;
}

export function getDateByPosition(x: number, from: number, to: number, width: number) {
    const durationTo = (x / width) * (to - from);
    const dateAtPosition = from + durationTo;
    return dateAtPosition;
}

// Returns the object on the left and right in an array using the given cmp function.
// The compare function defined which property of the value to compare (e.g.: c => c.left)
export function getIndicesOnly<T, C = number | Date>(
    input: T[],
    value: C,
    comparer: { (T: T): C },
    strict?: boolean
) {
    let lo = -1;
    let hi = input.length;
    while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
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

export function get<T, C = number | Date>(
    input: T[],
    value: C,
    comparer: { (T: T): C },
    strict?: boolean
) {
    const res = getIndicesOnly(input, value, comparer, strict);
    return [input[res[0]], input[res[1]]];
}
