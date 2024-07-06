import { get } from '../utils/utils';

export interface HighlightedDurations {
    unit: string;
    fractions: number[];
}

export interface Column {
    from: number;
    to: number;
    left: number;
    width: number;
    bgHighlightColor?: boolean;

    /**
     * Duration in milliseconds
     */
    duration: number;
}

type ColumnServiceParams = {
    readonly columns: Column[];
    readonly magnetDuration: number;
}

export function createColumnService(params: ColumnServiceParams) {
    function getColumnByDate(date: number) {
        const pair = findByDate(params.columns, date);
        return !pair[0] ? pair[1] : pair[0];
    }

    function getColumnByPosition(x: number) {
        const pair = findByPosition(params.columns, x);
        return !pair[0] ? pair[1] : pair[0];
    }

    return  {
        getColumnByDate,
        getColumnByPosition,
        getPositionByDate(date: number) {
            if (!date) return null;
            const column = getColumnByDate(date);

            let durationTo = date - column.from;
            const position = (durationTo / column.duration) * column.width;

            //multiples - skip every nth col, use other duration
            return column.left + position;
        },
        getDateByPosition(x: number) {
            const column = getColumnByPosition(x);
            x = x - column.left;

            let positionDuration = (column.duration / column.width) * x;
            const date = column.from + positionDuration;

            return date;
        },
        /**
         * TODO: remove, currently unused
         * @param {number} date - Date
         * @returns {number} rounded date passed as parameter
         */
        roundTo(date: number) {
            let value = Math.round(date / params.magnetDuration) * params.magnetDuration;
            return value;
        }
    };
}

export function findByPosition(columns: Column[], x: number) {
    const result = get<Column>(columns, x, c => c.left);
    return result;
}

export function findByDate(columns: Column[], x: number) {
    const result = get<Column>(columns, x, c => c.from);
    return result;
}

export type ColumnService = ReturnType<typeof createColumnService>;
