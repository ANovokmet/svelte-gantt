/**
 * Time units supported by the date utilities
 */
export type TimeUnit = 
  | 'year' | 'y'
  | 'month' 
  | 'week'
  | 'day' | 'd'
  | 'hour' | 'h'
  | 'minute' | 'm'
  | 'second' | 's'
  | 'date';

/**
 * Represents a time period with start and end timestamps
 */
export interface TimePeriod {
  from: number;
  to: number;
  duration: number;
  isHighlighted?: boolean | undefined;
}

export type HighlightFunction = (date: Date) => boolean;

export type HighlightOptions = {
  unit: TimeUnit;
  fractions: number[];
} | HighlightFunction;

/**
 * Interface for date adapters (allows different date libraries to be used)
 */
export interface SvelteGanttDateAdapter {
  roundTo(timestamp: number, unit: TimeUnit, offset: number): number;
  format(timestamp: number, formatString: string): string;
}

/**
 * Normalizes a date value to a timestamp
 */
export function toTimestamp(date: number | Date): number {
  return date instanceof Date ? date.getTime() : date;
}

export function toValue(date: number | Date): number {
  return date instanceof Date ? date.getTime() : date;
}

/**
 * Gets the start of a time unit (e.g., start of day, start of month)
 */
export function startOf(timestamp: number, unit: TimeUnit): number {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (unit) {
    case 'y':
    case 'year':
      return new Date(year, 0, 1).getTime();
    
    case 'month':
      return new Date(year, month, 1).getTime();
    
    case 'week':
      return getWeekStart(date).getTime();
    
    case 'd':
    case 'day':
      return new Date(year, month, day).getTime();
    
    case 'h':
    case 'hour':
      date.setMinutes(0, 0, 0);
      return date.getTime();
    
    case 'm':
    case 'minute':
      date.setSeconds(0, 0);
      return date.getTime();
    
    case 's':
    case 'second':
      date.setMilliseconds(0);
      return date.getTime();
    
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Gets the first day of the week containing the given date
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  
  // Adjust to previous Monday (or Sunday if your week starts on Sunday)
  const diff = result.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * Gets the exact duration of a time unit, accounting for leap years, month lengths, etc.
 */
export function getExactDuration(unit: TimeUnit, date: Date, offset = 1): number {
  const startDate = new Date(date);
  const endDate = addTime(new Date(date), unit, offset);
  
  return endDate.getTime() - startDate.getTime();
}

/**
 * Gets the approximate duration of a time unit (for estimation purposes)
 */
export function getApproximateDuration(unit: TimeUnit, offset = 1): number {
  switch (unit) {
    case 'y':
    case 'year':
      return offset * 365 * 24 * 60 * 60 * 1000; // ~365 days
    
    case 'month':
      return offset * 30 * 24 * 60 * 60 * 1000; // ~30 days
    
    case 'week':
      return offset * 7 * 24 * 60 * 60 * 1000; // 7 days
    
    case 'd':
    case 'day':
      return offset * 24 * 60 * 60 * 1000; // 24 hours
    
    case 'h':
    case 'hour':
      return offset * 60 * 60 * 1000; // 60 minutes
    
    case 'm':
    case 'minute':
      return offset * 60 * 1000; // 60 seconds
    
    case 's':
    case 'second':
      return offset * 1000; // 1000 milliseconds
    
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Adds a specific amount of time to a date
 */
export function addTime(date: Date, unit: TimeUnit, offset = 1): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'y':
    case 'year':
      result.setFullYear(result.getFullYear() + offset);
      return result;
    
    case 'month':
      result.setMonth(result.getMonth() + offset);
      return result;
    
    case 'week':
      result.setDate(result.getDate() + (offset * 7));
      return result;
    
    case 'd':
    case 'day':
      result.setDate(result.getDate() + offset);
      return result;
    
    case 'h':
    case 'hour':
      result.setHours(result.getHours() + offset);
      return result;
    
    case 'm':
    case 'minute':
      result.setMinutes(result.getMinutes() + offset);
      return result;
    
    case 's':
    case 'second':
      result.setSeconds(result.getSeconds() + offset);
      return result;
    
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

/**
 * Divides a time range into periods of the specified unit (e.g., days, hours)
 */
export function divideTimeRange(
  from: number,
  to: number,
  unit: TimeUnit,
  offset = 1,
  highlightOptions?: HighlightOptions
): TimePeriod[] {
  if (!isValidTimeUnit(unit)) {
    throw new Error(`Invalid time unit: ${unit}`);
  }
  
  const result: TimePeriod[] = [];
  const startDate = new Date(from);
  
  let periodEnd = addTime(new Date(startDate), unit, offset);
  let periodEndTime = Math.min(periodEnd.getTime(), to);

  result.push({
    from,
    to: periodEndTime,
    duration: periodEndTime - from,
    isHighlighted: highlightOptions && isHighlighted(startDate, highlightOptions),
  });
  
  let currentTime = periodEndTime;
  
  while (currentTime < to) {
    const periodStart = currentTime;
    const currentDate = new Date(currentTime);
    periodEnd = addTime(currentDate, unit, offset);
    periodEndTime = Math.min(periodEnd.getTime(), to);
    
    result.push({
      from: periodStart,
      to: periodEndTime,
      duration: periodEndTime - periodStart,
      isHighlighted: highlightOptions && isHighlighted(currentDate, highlightOptions),
    });
    
    currentTime = periodEndTime;
  }
  
  return result;
}


/**
 * Checks if a date matches the highlighting rules
 */
export function isHighlighted(date: Date, options: HighlightOptions): boolean {
  if (typeof options === 'function') {
    return options(date);
  }
  
  let valueToCheck: number;
  
  switch (options.unit) {
    case 'm':
    case 'minute':
      valueToCheck = date.getMinutes();
      break;
    
    case 'h':
    case 'hour':
      valueToCheck = date.getHours();
      break;
    
    case 'd':
    case 'day':
      valueToCheck = date.getDay(); // 0-6 (Sunday to Saturday)
      break;
    
    case 'month':
      valueToCheck = date.getMonth(); // 0-11
      break;
    
    case 'y':
    case 'year':
      valueToCheck = date.getFullYear();
      break;
    
    default:
      // Special cases
      if (options.unit === 'week') {
        // Calculate week number if needed
        valueToCheck = getWeekNumber(date);
      } else if (options.unit === 'date') {
        valueToCheck = date.getDate(); // 1-31
      } else {
        throw new Error(`Invalid highlight rule unit: ${options.unit}`);
      }
  }
  
  return options.fractions.includes(valueToCheck);
}

/**
 * Gets the week number (1-53) for a given date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Checks if a given string is a valid time unit
 */
export function isValidTimeUnit(unit: string): boolean {
  return [
    'year', 'y', 'month', 'week', 'day', 'd', 
    'hour', 'h', 'minute', 'm', 'second', 's'
  ].includes(unit);
}

/**
 * Legacy alias for divideTimeRange (for backward compatibility)
 */
export function getAllPeriods(
  from: number,
  to: number,
  unit: TimeUnit,
  offset = 1,
  highlightedDurations?: HighlightOptions
): TimePeriod[] {
  return divideTimeRange(from, to, unit, offset, highlightedDurations);
}