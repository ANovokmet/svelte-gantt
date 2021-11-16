import { Moment } from 'moment';
import { get } from '../utils/utils';

interface Column {
    from: any;
    left: number;
    width: number;

    /**
     * Duration in milliseconds
     */
    duration: number;
}

interface TimeResolution {
    unit: string;
    offset: number;
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

    getDateByPosition (x): Moment;

    roundTo(date): Moment;
}