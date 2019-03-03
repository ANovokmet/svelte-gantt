import { SvelteRow } from "./row";
import { SvelteGantt } from "./gantt";

export interface TaskModel {
    id: number; // | string;
    resourceId: number; // | string
    from: any; // moment
    to: any; // moment

    amountDone?: number;
    classes?: string | string[];
    label?: string;
    html?: string;
    showButton?: boolean;
    buttonClasses?: string | string[];
    buttonHtml?: string;
    enableDragging?: boolean;
}

export class SvelteTask {
    gantt: SvelteGantt;
    model: TaskModel;
    component: SvelteGantt;
    row: SvelteRow;

    left: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
    widthT: number;

    dragging: boolean;
    resizing: boolean;
    
    constructor(gantt: SvelteGantt, task: TaskModel){
        // defaults, todo object.assign these
        // id of task, every task needs to have a unique one
        //task.id = task.id || undefined;
        // completion %, indicated on task
        task.amountDone = task.amountDone || 0;
        // css classes
        task.classes = task.classes || '';
        // datetime task starts on, currently moment-js object
        task.from = task.from || null;
        // datetime task ends on, currently moment-js object
        task.to = task.to || null;
        // label of task
        task.label = task.label || undefined;
        // html content of task, will override label
        task.html = task.html || undefined;
        // show button bar
        task.showButton = task.showButton || false 
        // button classes, useful for fontawesome icons
        task.buttonClasses = task.buttonClasses || ''
        // html content of button
        task.buttonHtml = task.buttonHtml || ''
        // enable dragging of task
        task.enableDragging = task.enableDragging === undefined ? true : task.enableDragging;


        this.gantt = gantt;
        this.model = task;

        this.row = gantt.get()._rowCache[task.resourceId];
        this.row.addTask(this);

        //height, translateX, translateY, resourceId
        this.height = this.getHeight();

        this.updatePosition();

        // TODO extract to update vertical position
        this.posY = this.getPosY();
    }

    getHeight(){
        return this.row.height;
    }

    getPosY(){
        return this.row.posY;
    }

    updatePosition(){
        const left = this.gantt.utils.getPositionByDate(this.model.from);
        const right = this.gantt.utils.getPositionByDate(this.model.to); 

        this.left = left;
        this.width = right - left;

        if(!this.dragging && !this.resizing){
            this.posX = Math.ceil(this.left);
            this.widthT = Math.ceil(this.width);
        }
    }

    updateDate(){
        const from = this.gantt.utils.getDateByPosition(this.left);
        const to = this.gantt.utils.getDateByPosition(this.left + this.width);
                   
        const roundedFrom = this.gantt.utils.roundTo(from);
        const roundedTo = this.gantt.utils.roundTo(to);

        if(!roundedFrom.isSame(roundedTo)){
            this.model.from = roundedFrom;
            this.model.to = roundedTo;
        }
    }

    overlaps(other) {
        return !(this.left + this.width <= other.left || this.left >= other.left + other.width);
    }

    updateView() {
        if(this.component) {
            this.component.set({task: this});
        }
    }
}