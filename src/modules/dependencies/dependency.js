export default class SvelteDependency {
    constructor(gantt, dependency){
        Object.assign(this, dependency);

        this.gantt = gantt;
        this.update();
    }

    update() {
        const {rows, rowHeight} = this.gantt.store.get();

        let startX = this.fromTask.left + this.fromTask.width;
        let endX = this.toTask.left;

        let startIndex = rows.indexOf(this.fromTask.row); 
        let endIndex = rows.indexOf(this.toTask.row); 

        let startY = (startIndex + 0.5) * rowHeight;
        let endY = (endIndex + 0.5) * rowHeight;

        const result = {startX, startY, endX, endY}
        Object.assign(this, result);
        return result;
    }
}