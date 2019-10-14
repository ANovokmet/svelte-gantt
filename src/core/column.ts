import { get } from 'src/utils/utils';
import { SvelteGantt } from './gantt';
import * as moment_ from 'moment';
const moment = moment_;

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

export class ColumnFactory {
    
    gantt: SvelteGantt;

    constructor(gantt: SvelteGantt) {
        this.gantt = gantt;
    }

    get columns(): Column[] {
        return this.gantt.get().columns;
    }

    getColumnByDate(date) {
        const columns = findByDate(this.columns, date);
        return !columns[0] ? columns[1] : columns[0];
    }

    getColumnByPosition(x) {
        const columns = findByPosition(this.columns, x);
        return !columns[0] ? columns[1] : columns[0];
    }

    getPositionByDate (date) {
        if(!date)
            return null;

        const column = this.getColumnByDate(date);
        // partials

        let durationTo = date.diff(column.from, 'milliseconds');
        const position = durationTo / column.duration * column.width;

        //multiples - skip every nth col, use other duration
        return column.left + position;
    }

    getDateByPosition (x) {
        const column = this.getColumnByPosition(x);
        // partials

        x = x - column.left;

        let positionDuration = column.duration / column.width * x;
        const date = moment(column.from).add(positionDuration, 'milliseconds');

        return date;
    }

}