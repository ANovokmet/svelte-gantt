export interface SvelteGanttDateAdapter {
    roundTo(date: number, unit: string, offset: number): number;
    format(date: number, format: string): string;
}

export function startOf(date: number, unit: string): number {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const dt = d.getDate();

    switch (unit) {
        case 'y':
        case 'year':
            return startOfDate(y, 0, 1);
        case 'month':
            return startOfDate(y, m, 1);
        case 'week':
            return startOfDate(y, m, dt, true);
        case 'd':
        case 'day':
            return startOfDate(y, m, dt);
        case 'h':
        case 'hour':
            d.setMinutes(0, 0, 0);
            return d.valueOf();
        case 'm':
        case 'minute':
        case 's':
        case 'second': {
            const unitMs = getDuration(unit);
            const value = Math.floor(date / unitMs) * unitMs;
            return value;
        }
        default:
            throw new Error(`Unknown unit: ${unit}`);
    }
}

function startOfDate(y: number, m: number, d: number, week = false) {
    if (y < 100 && y >= 0) {
        return new Date(y + 400, m, d).valueOf() - 31536000000;
    } else if (week) {
        return getFirstDayOfWeek(new Date(y, m, d).valueOf()).valueOf();
    } else {
        return new Date(y, m, d).valueOf();
    }
}

function getFirstDayOfWeek(d: number) {
    // 👇️ clone date object, so we don't mutate it
    const date = new Date(d);
    const day = date.getDay(); // 👉️ get day of week
    // 👇️ day of month - day of week (-6 if Sunday), otherwise +1
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(date.setDate(diff));
}

function checkLeapYear(year) {
    const leap = new Date(year, 1, 29).getDate() === 29;
    if (leap) return true;
    return false;
}

export function getDuration(unit: string, offset = 1): number {
    switch (unit) {
        case 'y':
        case 'year':
            return offset * 31536000000;
        case 'month':
            return offset * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
        // 4 cases : 28 - 29 - 30 - 31
        case 'week':
            return offset * 7 * 24 * 60 * 60 * 1000;
        case 'd':
        case 'day':
            return offset * 24 * 60 * 60 * 1000;
        case 'h':
        case 'hour':
            return offset * 60 * 60 * 1000;
        case 'm':
        case 'minute':
            return offset * 60 * 1000;
        case 's':
        case 'second':
            return offset * 1000;
        default:
            throw new Error(`Unknown unit: ${unit}`);
    }
}

export function getDurationV2(unit: string, offset = 1, date = null): number {
    switch (unit) {
        case 'y':
        case 'year':
            // 2 cases 31622400000 (366) - 31536000000 (365)
            if (date) {
                const isLeapYear = checkLeapYear(date.getFullYear());
                if (isLeapYear) return 31622400000;
            }
            return offset * 31536000000; // Incorrect since there is years with 366 days
        case 'month':
            if (date) {
                const month_number_of_days = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    0
                ).getDate();
                return offset * month_number_of_days * 24 * 60 * 60 * 1000;
            }

            return offset * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
        // 4 cases : 28 - 29 - 30 - 31
        case 'week':
            return offset * 7 * 24 * 60 * 60 * 1000;
        case 'd':
        case 'day':
            return offset * 24 * 60 * 60 * 1000;
        case 'h':
        case 'hour':
            return offset * 60 * 60 * 1000;
        case 'm':
        case 'minute':
            return offset * 60 * 1000;
        case 's':
        case 'second':
            return offset * 1000;
        default:
            throw new Error(`Unknown unit: ${unit}`);
    }
}

function addSeconds(date: Date, offset = 1) {
    date.setSeconds(date.getSeconds() + offset);
    return date;
}

function addMinutes(date: Date, offset = 1) {
    date.setMinutes(date.getMinutes() + offset);
    return date;
}

function addHours(date: Date, offset = 1) {
    date.setHours(date.getHours() + offset);
    return date;
}

function addDays(date: Date, offset = 1) {
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0);
    return date;
}

function addWeeks(date: Date, offset = 1) {
    const d = date;
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 7 * offset);
    return d;
}

function addMonths(date: Date, offset = 1) {
    date.setMonth(date.getMonth() + offset);
    date.setDate(1);
    date.setHours(0, 0, 0);
    return date;
}

function addYears(date: Date, offset = 1) {
    date.setFullYear(date.getFullYear() + offset);
    date.setMonth(0);
    date.setDate(1);
    date.setHours(0, 0, 0);
    return date;
}

function getNextDate(date, unit, offset) {
    switch (unit) {
        case 'y':
        case 'year':
            return addYears(date, offset);
        case 'month':
            return addMonths(date, offset);
        case 'week':
            return addWeeks(date, offset);
        case 'd':
        case 'day':
            return addDays(date, offset);
        case 'h':
        case 'hour':
            return addHours(date, offset);
        case 'm':
        case 'minute':
            return addMinutes(date, offset);
        case 's':
        case 'second':
            return addSeconds(date, offset);
        default:
            break;
    }
}

const units = ['y', 'year', 'month', 'week', 'd', 'day', 'h', 'hour', 'm', 'minute', 's', 'second'];
/**
 *
 * @param from Interval start
 * @param to Interval end
 * @param unit Column unit
 * @param offset Column spacing
 * @param highlightedDurations
 * @returns
 */
export function getAllPeriods(
    from: number,
    to: number,
    unit: string,
    offset: number = 1,
    highlightedDurations?
) {
    if (units.indexOf(unit) !== -1) {
        let tmsWorkOld = 0;
        let interval_duration = 0;
        const start = new Date(from); // Starts at hh:mm:ss
        const dateWork = new Date(from);
        let nextDate = getNextDate(dateWork, unit, offset);
        let tmsWork = nextDate.getTime();
        const firstDuration = nextDate.getTime() - from;
        const all_periods = [
            {
                // start: start,
                // end: nextDate,
                from: from,
                // from: startOf(from, unit), // incorrect if not circled down to the unit eg. 6:30
                // TODO: think about offsetting the whole row, so for example if timeline starts at 6:30, the headers still show times for 6:00, 7:00 etc, and not 6:30, 7:30...
                to: nextDate.getTime(),
                duration: firstDuration,
                // check whether duration is highlighted
                isHighlighted: highlightedDurations && isUnitFraction(start, highlightedDurations)
            }
        ];

        if (tmsWork < to) {
            while (tmsWork < to) {
                tmsWorkOld = tmsWork;
                nextDate = getNextDate(new Date(tmsWork), unit, offset);
                interval_duration = nextDate.getTime() - tmsWork;

                all_periods.push({
                    from: tmsWork,
                    to: nextDate.getTime(),
                    duration: interval_duration,
                    //check whether duration is highlighted
                    isHighlighted:
                        highlightedDurations &&
                        isUnitFraction(new Date(tmsWork), highlightedDurations)
                });
                tmsWork = nextDate.getTime();
            }
            const last_day_duration = to - tmsWorkOld;
            all_periods[all_periods.length - 1].to = to;
            all_periods[all_periods.length - 1].duration = last_day_duration;
            // ToDo: there could be another option for hours, minutes, seconds based on pure math like in getPeriodDuration to optimise performance
        }
        return all_periods;
    }
    throw new Error(`Unknown unit: ${unit}`);
}

function isUnitFraction(localDate: Date, highlightedDurations): boolean {
    // const localDate = new Date(timestamp * 1000);
    let timeInUnit: number;

    switch (highlightedDurations.unit) {
        case 'm':
        case 'minute':
            timeInUnit = localDate.getMinutes();
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'h':
        case 'hour':
            timeInUnit = localDate.getHours();
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'd':
        case 'day':
            timeInUnit = localDate.getDay();
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'week':
            // getWeekNumber(localDate);
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'dayinMonth':
            timeInUnit = localDate.getDate();
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'month':
            timeInUnit = localDate.getMonth();
            return highlightedDurations.fractions.includes(timeInUnit);
        case 'y':
        case 'year':
            timeInUnit = localDate.getFullYear();
            return highlightedDurations.fractions.includes(timeInUnit);
        default:
            throw new Error(`Invalid unit: ${highlightedDurations.unit}`);
    }
}
