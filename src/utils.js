export default class {
    constructor({ from, to, width, magnetUnit, magnetOffset }) {
        this.from = from;
        this.to = to;
        this.width = width;
        this.magnetUnit = magnetUnit;
        this.magnetOffset = magnetOffset || 1;
    }

    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date 
     */
    getPositionByDate (date) {
        if (!date) {
          return undefined
        }

        let durationTo = date.diff(this.from, 'milliseconds')
        let durationToEnd = this.to.diff(this.from, 'milliseconds')

        return durationTo / durationToEnd * this.width;
    }

    getDateByPosition (x) {
        let durationTo = x / this.width * this.to.diff(this.from, 'milliseconds');
        let dateAtPosition = this.from.clone().add(durationTo, 'milliseconds');
        return dateAtPosition; 
    }

    /**
     * 
     * @param {Moment} date - Date
     * @returns {Moment} rounded date passed as parameter
     */
    roundTo (date) {
        let value = date.get(this.magnetUnit)
    
        value = Math.round(value / this.magnetOffset);
    
        date.set(this.magnetUnit, value * this.magnetOffset);

        //round all smaller units to 0
        const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
        const indexOf = units.indexOf(this.magnetUnit);
        for (let i = 0; i < indexOf; i++) {
            date.set(units[i], 0)
        }
        return date
    }
}