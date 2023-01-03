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
            if(date){
                const isLeapYear = checkLeapYear(date.getFullYear());
                if(isLeapYear) return 31622400000;
            }
            return offset * 31536000000; // Incorrect since there is years with 366 days 
        case 'month':
            if(date){
                const month_number_of_days = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
                return offset * month_number_of_days * 24 * 60 * 60 * 1000;
            }

            return offset
             * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
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

function addSeconds(date:Date, offset=1){
    date.setSeconds(date.getSeconds() + offset)
    return date;
}

function addMinutes(date:Date, offset=1){
    date.setMinutes(date.getMinutes() + offset)
    return date;
}

function addHours(date:Date, offset=1) {
    date.setHours(date.getHours() + offset);
    return date;
}

function addDays(date:Date, offset=1) {
    date.setDate(date.getDate() + offset);
    date.setHours(0,0,0);
    return date;
}

function addWeeks(date:Date, offset=1){
    const d = date
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0);	
    d.setMinutes(0); 
    d.setSeconds(0);
    d.setDate(d.getDate() + (7 * offset));
    return d;
}

function addMonths(date:Date, offset=1){
    date.setMonth(date.getMonth() + offset)
    date.setDate(1)
    date.setHours(0);	
    date.setMinutes(0); 
    date.setSeconds(0);
    return date;
}

function addYears(date:Date, offset=1){
    date.setFullYear(date.getFullYear() + offset)
    date.setMonth(1)
    date.setDate(0);
    date.setHours(0);	
    date.setMinutes(0); 
    date.setSeconds(0);
    return date;
}

function getNextDate(date, unit, offset){
    switch(unit){
        case 'y':
        case 'year':
            return addYears(date, offset);
        case 'month':
            return addMonths(date, offset);
        case 'week':
            return addWeeks(date, offset)
        case 'd':
        case 'day':
            return addDays(date, offset)
        case 'h':
        case 'hour':
            return addHours(date, offset)
        case 'm':
        case 'minute':
            return addMinutes(date, offset)
        case 's':
        case 'second':
            return addSeconds(date, offset)
        default:
            break;
    }
}


// Départ de l'intervalle - Fin de l'intervalle - Unité des colonnes - Espacement des colonnes
export function getAllPeriods(from:number, to:number, unit:string, offset:number=1){
    let units = ["y", "year", "month", "week", "d", "day", "h", "hour", "m", "minute", "s", "second"];
    if(units.indexOf(unit) !== -1){
        let all_periods         = [];
        let tmsWorkOld          = 0;
        let interval_duration   = 0;
        let start               = new Date(from); // Commence à hh:mm:ss
        let dateWork            = new Date(from);
        let nextDate            = getNextDate(dateWork, unit, offset)
        let tmsWork             = nextDate.getTime();
        const firstDuration     = nextDate.getTime() - from;
        all_periods[0]          = {start:start, end:nextDate, from:start.getTime(), to:nextDate.getTime(), duration:firstDuration}

        if(tmsWork < to){
            while(tmsWork < to){
                tmsWorkOld = tmsWork;
                nextDate = getNextDate(new Date(tmsWork), unit, offset)
                interval_duration = nextDate.getTime() - tmsWork;
                all_periods.push({from:tmsWork, to:nextDate.getTime(), duration:interval_duration});
                tmsWork = nextDate.getTime()
            }
            const last_day_duration = to - tmsWorkOld;
            all_periods[all_periods.length -1].to = to;
            all_periods[all_periods.length -1].duration = last_day_duration;
        }else{
            all_periods[0].to = to;
            all_periods[0].duration = to - from;
        }
        
        return all_periods; 
    }

    throw new Error(`Unknown unit: ${unit}`);
}

// Return duration 
export function getPeriodDuration(from:number, to:number, unit: string, offset:number): number {
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
