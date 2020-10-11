import { Moment } from "moment";
export declare class GanttUtils {
    from: Moment;
    to: Moment;
    width: number;
    magnetOffset: number;
    magnetUnit: string;
    constructor();
    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date
     */
    getPositionByDate(date: any): number;
    getDateByPosition(x: any): any;
    /**
     *
     * @param {Moment} date - Date
     * @returns {Moment} rounded date passed as parameter
     */
    roundTo(date: any): any;
}
export declare function getPositionByDate(date: any, from: any, to: any, width: any): number;
export declare function getDateByPosition(x: any, from: any, to: any, width: any): any;
export declare function getIndicesOnly<T, C = number | Date>(input: T[], value: C, comparer: {
    (T: T): C;
}, strict?: boolean): number[];
export declare function get<T, C = number | Date>(input: T[], value: C, comparer: {
    (T: T): C;
}, strict?: boolean): T[];
