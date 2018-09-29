export default class SvelteDependency {
    constructor(dependency, {rows, rowHeight}){
        Object.assign(this, dependency);
        this.rows = rows;
        this.rowHeight = rowHeight;
        this.update();
    }

    update() {
        let startX = this.fromTask.left + this.fromTask.width;
        let endX = this.toTask.left;

        let startIndex = this.rows.indexOf(this.fromTask.row); 
        let endIndex = this.rows.indexOf(this.toTask.row); 

        let startY = (startIndex + 0.5) * this.rowHeight
        let endY = (endIndex + 0.5) * this.rowHeight

        const result = {startX, startY, endX, endY}
        Object.assign(this, result);
        return result;
    }
}