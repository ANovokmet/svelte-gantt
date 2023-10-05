import { SvelteGanttDateAdapter } from './date';

export class DefaultSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    format(date: number, format: string): string {
        const d = new Date(date);
        switch (format) {
            case 'H':
                return d.getHours() + '';
            case 'HH':
                return pad(d.getHours());
            case 'H:mm':
                return `${d.getHours()}:${pad(d.getMinutes())}`;
            case 'hh:mm':
                return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            case 'hh:mm:ss':
                return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            case 'dd/MM/yyyy':
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            case 'dd/MM/yyyy hh:mm':
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
            case 'dd/MM/yyyy hh:mm:ss':
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            // VPY More formats supported 10/12/2021
            case 'YYYY':
                return `${d.getFullYear()}`;
            case 'Q':
                return `${Math.floor(d.getMonth() / 3 + 1)}`;
            case '[Q]Q':
                return `Q${Math.floor(d.getMonth() / 3 + 1)}`;
            case 'YYYY[Q]Q':
                return `${d.getFullYear()}Q${Math.floor(d.getMonth() / 3 + 1)}`;
            case 'MM': {
                // const month = d.toLocaleString('default', { month: 'long' });
                let month = String(d.getMonth() + 1);
                if (month.length == 1) month = `0${month}`;
                return `${month}`;
            }
            case 'MMMM': {
                const month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
            }
            case 'MMMM - YYYY': {
                const month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}-${d.getFullYear()}`;
            }
            case 'MMMM YYYY': {
                const month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`;
            }
            case 'MMM': {
                const month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
            }
            case 'MMM - YYYY': {
                const month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} - ${d.getFullYear()}`;
            }
            case 'MMM YYYY': {
                const month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`;
            }
            case 'W':
                return `${getWeekNumber(d)}`;
            case 'WW': {
                const weeknumber = getWeekNumber(d);
                return `${weeknumber.toString().length == 1 ? '0' : ''}${weeknumber}`;
            }
            default:
                console.warn(`Date Format '${format}' is not supported, use another date adapter.`);
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        }
    }

    /**
     * Rounds the date down to the nearest unit
     * 
     * Note: This does not consider the timezone, rounds only to the UTC time, which makes it incorrect to round to day start or half hour time zones
     */
    roundTo(date: number, unit: string, offset: number): number {
        const magnetDuration = getPeriodDuration(unit, offset);
        const value = Math.round(date / magnetDuration) * magnetDuration; // 
        return value;
    }
}

function pad(value: number): string {
    let result = value.toString();
    for (let i = result.length; i < 2; i++) {
        result = '0' + result;
    }
    return result;
}

function getWeekNumber(d: Date) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    // Return array of year and week number
    return weekNo;
}

/**
 * Return duration
 */
function getPeriodDuration(unit: string, offset: number): number {
    switch (unit) {
        case 'y':
        case 'year':
            // 2 cases 31622400000 (366) - 31536000000 (365)
            return offset * 31536000000; // Incorrect since there is years with 366 days 
        case 'month':
            // 4 cases : 28 - 29 - 30 - 31
            return offset * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
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