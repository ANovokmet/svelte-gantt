export declare class GanttUtils {
    from: number;
    to: number;
    width: number;
    magnetOffset: number;
    magnetUnit: string;
    magnetDuration: number;
    constructor();
    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date
     */
    getPositionByDate(date: number): number;
    getDateByPosition(x: any): number;
    roundTo(date: number): number;
}
export declare function getPositionByDate(date: number, from: number, to: number, width: number): number;
export declare function getDateByPosition(x: number, from: number, to: number, width: number): number;
export declare function getIndicesOnly<T, C = number | Date>(input: T[], value: C, comparer: {
    (T: T): C;
}, strict?: boolean): number[];
export declare function get<T, C = number | Date>(input: T[], value: C, comparer: {
    (T: T): C;
}, strict?: boolean): T[];
