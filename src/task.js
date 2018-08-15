export class Task {
    constructor(from, to){
        this.from = from;
        this.to = to;
    }
}

export class Utils {
    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date 
     * @param {*} from 
     * @param {*} to 
     * @param {*} width 
     */
    static getPositionByDate (date, from, to, width) {
        if (!date) {
          return undefined
        }

        let durationTo = date.diff(from, 'milliseconds')
        let durationToEnd = to.diff(from, 'milliseconds')

        return durationTo / durationToEnd * width;
    }

    static getDateByPosition (x, from, to, width) {
        //x: width = res:to.diff(from, 'milliseconds') 

        let durationTo = x / width * to.diff(from, 'milliseconds');
        let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
        return dateAtPosition; 
    }

    /**
     * 
     * @param {Moment} date - Date
     * @param {string} unit - Unit
     * @param {number} offset - Magnet offset to round with 
     * @returns {Moment} rounded date passed as parameter
     */
    static roundTo (date, unit, offset) {
        offset = offset || 1
        let value = date.get(unit)
    
        value = Math.round(value / offset);
    
        let units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year']
        date.set(unit, value * offset)
    
        let indexOf = units.indexOf(unit)
        for (let i = 0; i < indexOf; i++) {
          date.set(units[i], 0)
        }
    
        return date
    }

    //get mouse position within the element
    static getRelativePos(node, event) {
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top;  //y position within the element.
        return {
            x: x,
            y: y
        }
    }

    static addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn, removeOptions);
            listener.apply(this, arguments, addOptions);
        });
    }
}