import { get } from '../utils/utils';

export interface Column {
    from: any;
    to: any;
    left: number;
    width: number;
    bgHighlightColor?: boolean;

    /**
     * Duration in milliseconds
     */
    duration: number;
}

export function findByPosition(columns: Column[], x: number) {
    const result = get<Column>(columns, x, c => c.left);
    return result;
}

export function findByDate(columns: Column[], x: any) {
    const result = get<Column>(columns, x, c => c.from);
    return result;
}

export interface ColumnService {
    
    getColumnByDate(date): Column;

    getColumnByPosition(x): Column;

    getPositionByDate (date): number;

    getDateByPosition (x): number;

    roundTo(date): number;
}