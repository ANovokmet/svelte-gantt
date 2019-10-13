import { get, getPositionByDate } from 'src/utils/utils';
import { SvelteGantt } from './gantt';
import * as moment_ from 'moment';
const moment = moment_;
//declare var moment: any;

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
    const result = get<Column, number>(columns, x, c => c.left);
    return result;
}

export function findByDate(columns: Column[], x: any) {
    const result = get<Column, any>(columns, x, c => c.from);
    return result;
}

export function columnWidth($from, $to, $width, resolution: TimeResolution) {
    return getPositionByDate($from.clone().add(resolution.offset, resolution.unit), $from, $to, $width);
}

export function generateColumns($from, $to, $width, $columnOffset, $columnUnit) {
    // width of column, IF rounded down results in more columns
    const columnWidth = getPositionByDate($from.clone().add($columnOffset, $columnUnit), $from, $to, $width) | 0;

    // how many rounded column widths can fit
    const count = Math.ceil($width / columnWidth);

    let columnFrom = $from.clone();
    let left = 0;
    const result: Column[] = []
    for(let i = 0; i < count; i++) {
        
        const from = columnFrom.clone();
        const to = from.add($columnOffset, $columnUnit);
        result.push({
            from: from.clone(),
            left: left,
            width: columnWidth,
            duration: to.diff(from, 'milliseconds')
        });

        columnFrom = to;
        left += columnWidth;
    }

    return result;
}

export function getHeaderWidth($from, $to, $width, header: TimeResolution, others: TimeResolution[]) {

    const headerDuration = moment.duration(header.offset || 1, header.unit as moment_.unitOfTime.Base).asMilliseconds();
    let minHeader: TimeResolution = header; 
    let minDuration = headerDuration;

    others.forEach(h => {
        const duration = moment.duration(h.offset || 1, h.unit as moment_.unitOfTime.Base).asMilliseconds();
        if(duration < minDuration) {
            minDuration = duration;
            minHeader = h;
        }
    });
    
    const ratio = headerDuration / minDuration;
    const minWidth = columnWidth($from, $to, $width, minHeader) | 0;
    return minWidth * ratio;
}

export class ColumnFactory {
    
    gantt: SvelteGantt;

    constructor(gantt: SvelteGantt) {
        this.gantt = gantt;

        // this.gantt.store.compute('columnWidth', ['from', 'to', 'width', 'columnOffset', 'columnUnit'], (from, to, width, columnOffset, columnUnit) => {
        //     return getPositionByDate(from.clone().add(columnOffset, columnUnit), from, to, width) | 0
        // });

        // this.gantt.store.compute('columnCount', ['width', 'columnWidth'], ( width, columnWidth ) => Math.ceil(width / columnWidth));

        // this.gantt.store.compute('columns', 
        //     ['from', 'columnWidth', 'columnCount', 'columnOffset', 'columnUnit'], 
        //     (ganttFrom, columnWidth, columnCount, columnOffset, columnUnit) => {
        //         const columns = [];
        //         let columnFrom = ganttFrom.clone();
        //         let left = 0;
        //         for (let i = 0; i < columnCount; i++) {
        //             const from = columnFrom.clone();
        //             const to = columnFrom.add(columnOffset, columnUnit);
        //             columns.push({
        //                 width: columnWidth | 0,
        //                 from,
        //                 left, //getPositionByDate(columnFrom, $from, $to, $width) | 0
        //                 duration: to.diff(from, 'milliseconds')
        //             });
        //             left += columnWidth | 0;
        //             columnFrom = to;
        //         }

                
        //         //const a = findByPosition(columns, -10);
        //         //console.log(a);
        //         return columns;
        //     }
        // );


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