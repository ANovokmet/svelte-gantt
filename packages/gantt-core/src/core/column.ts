import { getAllPeriods } from '../utils/date';
import { get, getPositionByDate } from '../utils/utils';

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

export class ColumnService {
  constructor(
    private params: ColumnServiceParams
  ) {

  }

  getColumnByDate(date: number) {
    const pair = findByDate(this.params.columns, date);
    return !pair[0] ? pair[1] : pair[0];
  }

  getColumnByPosition(x: number) {
    const pair = findByPosition(this.params.columns, x);
    return !pair[0] ? pair[1] : pair[0];
  }

  getPositionByDate(date: number) {
    if (!date) return null;
    const column = this.getColumnByDate(date);

    const durationTo = date - column.from;
    const position = (durationTo / column.duration) * column.width;

    //multiples - skip every nth col, use other duration
    return column.left + position;
  }

  getDateByPosition(x: number) {
    const column = this.getColumnByPosition(x);
    x = x - column.left;

    const positionDuration = (column.duration / column.width) * x;
    const date = column.from + positionDuration;

    return date;
  }
  
  /**
   * TODO: remove, currently unused
   * @param {number} date - Date
   * @returns {number} rounded date passed as parameter
   */
  roundTo(date: number) {
    const value = Math.round(date / this.params.magnetDuration) * this.params.magnetDuration;
    return value;
  }
}

export function findByPosition(columns: Column[], x: number) {
  const result = get<Column>(columns, x, c => c.left);
  return result;
}

export function findByDate(columns: Column[], x: number) {
  const result = get<Column>(columns, x, c => c.from);
  return result;
}

export function getColumnsV2(
  from: number | Date,
  to: number | Date,
  unit: string,
  offset: number,
  width: number
): Column[] {
  //BUG: Function is running twice on init, how to prevent it?

  if (from instanceof Date) from = from.valueOf();
  if (to instanceof Date) to = to.valueOf();

  const cols: Column[] = [];
  const periods = getAllPeriods(
    from.valueOf(),
    to.valueOf(),
    unit as any,
    offset,
    null as any // highlightedDurations
  );
  let left = 0;
  let distance_point = 0;
  periods.forEach(function (period) {
    left = distance_point;
    distance_point = getPositionByDate(period.to, from, to, width);
    cols.push({
      width: distance_point - left,
      from: period.from,
      to: period.to,
      left: left,
      duration: period.duration,
      // ...(period.isHighlighted && { bgHighlightColor: highlightColor })
    });
  });
  return cols;
}