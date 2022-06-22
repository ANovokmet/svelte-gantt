export interface SvelteGanttDateAdapter {
    format(date: number, format: string): string;
}

export class MomentSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    moment: any;

    constructor(moment) {
        this.moment = moment;
    }

    format(date: number, format: string): string {
        return this.moment(date).format(format);
    }
}

export class NoopSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
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
                return `${Math.floor(d.getMonth()/3 + 1)}`;
            case '[Q]Q':
                return `Q${Math.floor(d.getMonth()/3 + 1)}`;
            case 'YYYY[Q]Q':
                return `${d.getFullYear()}Q${Math.floor(d.getMonth()/3 + 1)}`;
            case 'MM':
                // var month = d.toLocaleString('default', { month: 'long' });
                var month = String(d.getMonth()+1);
                if(month.length == 1) month = `0${month}`;
                return `${month}`;
            case 'MMMM':
                var month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
            case 'MMMM - YYYY':
                var month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}-${d.getFullYear()}`;
            case 'MMMM YYYY':
                var month = d.toLocaleString('default', { month: 'long' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`; 
            case 'MMM':
                var month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
            case 'MMM - YYYY':
                var month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} - ${d.getFullYear()}`;
            case 'MMM YYYY':
                var month = d.toLocaleString('default', { month: 'short' });
                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`;
            case 'W':
                return `${getWeekNumber(d)}`;
            case 'WW':
                const weeknumber = getWeekNumber(d);
                return `${weeknumber.toString().length == 1 ? "0" : ''}${weeknumber}`;
            default:
                console.warn(`Date Format "${format}" is not supported, use another date adapter.`);
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        }
    }
}

function pad(value: number): string {
    let result = value.toString();
    for (let i = result.length; i < 2; i++) {
        result = '0' + result;
    }
    return result;
}

export function startOf(date: number, unit: string): number {
    let d = new Date(date);
    let y = d.getFullYear();
    let m = d.getMonth();
    let dt = d.getDate();

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
        case 'second':
            let unitMs = getDuration(unit);
            const value = Math.floor(date / unitMs) * unitMs;
            return value;
        default:
            throw new Error(`Unknown unit: ${unit}`);
    }
}

function startOfDate(y: number, m: number, d: number, week=false) {    
    if (y < 100 && y >= 0) {
        return new Date(y + 400, m, d).valueOf() - 31536000000;
    } else if (week){
        return getFirstDayOfWeek(new Date(y,m,d).valueOf()).valueOf();
    } else {
        return new Date(y, m, d).valueOf();
    }
}

function getWeekNumber(d:Date) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(( ( (d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
}

function getFirstDayOfWeek(d:number) {
    // 👇️ clone date object, so we don't mutate it
    const date = new Date(d);
    const day = date.getDay(); // 👉️ get day of week
    // 👇️ day of month - day of week (-6 if Sunday), otherwise +1
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  
    return new Date(date.setDate(diff));
  }

export function getDuration(unit: string, offset = 1): number {
    switch (unit) {
        case 'y':
        case 'year':
            return offset * 31536000000; // Incorrect since there is years with 366 days 
            // 2 cases 31622400000 (366) - 31536000000 (365)
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

// function startOf(date, unit) {
//     let unitMs = getDuration(unit);
//     const value = Math.floor(date / unitMs) * unitMs;
//     return value;
// }

// function getDuration(unit, offset = 1) {
//     switch (unit) {
//         case 'y':
//         case 'year':
//             return offset * 31536000000;
//         case 'month':
//             return offset * 30 * 24 * 60 * 60 * 1000;
//         case 'd':
//         case 'day':
//             return offset * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;
//         case 'h':
//         case 'hour':
//             return offset * 60 * 60 * 1000;
//         case 'm':
//         case 'minute':
//             return offset * 60 * 1000;
//         case 's':
//         case 'second':
//             return offset * 1000;
//         default:
//             throw new Error(`Unknown unit: ${unit}`);
//     }
// }