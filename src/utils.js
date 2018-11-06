export default class {

    constructor(gantt) {
        this.gantt = gantt;
    }

    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date 
     */
    getPositionByDate (date) {
        if (!date) {
          return undefined
        }

        const {from, to, width} = this.gantt.store.get();

        let durationTo = date.diff(from, 'milliseconds')
        let durationToEnd = to.diff(from, 'milliseconds')

        return durationTo / durationToEnd * width;
    }

    getDateByPosition (x) {
        const {from, to, width} = this.gantt.store.get();

        let durationTo = x / width * to.diff(from, 'milliseconds');
        let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
        return dateAtPosition; 
    }

    /**
     * 
     * @param {Moment} date - Date
     * @returns {Moment} rounded date passed as parameter
     */
    roundTo (date) {
        const {magnetUnit, magnetOffset} = this.gantt.store.get();

        let value = date.get(magnetUnit)
    
        value = Math.round(value / magnetOffset);
    
        date.set(magnetUnit, value * magnetOffset);

        //round all smaller units to 0
        const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
        const indexOf = units.indexOf(magnetUnit);
        for (let i = 0; i < indexOf; i++) {
            date.set(units[i], 0)
        }
        return date
    }
}