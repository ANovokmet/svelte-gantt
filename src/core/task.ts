import { SvelteRow } from './row';
import { ColumnService } from './column';

export interface TaskModel {
    id: number; // | string;
    resourceId: number; // | string
    from: any; // date
    to: any; // date

    amountDone?: number;
    classes?: string | string[];
    label?: string;
    html?: string;
    showButton?: boolean;
    buttonClasses?: string | string[];
    buttonHtml?: string;
    enableDragging?: boolean;
}

export interface SvelteTask {
    model: TaskModel;

    left: number;
    top: number;
    width: number;

    height: number;
    reflections?: string[];
}

export class TaskFactory {
    columnService: ColumnService;
    
    rowPadding: number;
    rowEntities: {[key:number]: SvelteRow}

    constructor(columnService: ColumnService) {
		this.columnService = columnService;
    }
    
    createTask(model: TaskModel): SvelteTask {
        
        // id of task, every task needs to have a unique one
        //task.id = task.id || undefined;
        // completion %, indicated on task
        model.amountDone = model.amountDone || 0;
        // css classes
        model.classes = model.classes || '';
        // date task starts on
        model.from = model.from || null;
        // date task ends on
        model.to = model.to || null;
        // label of task
        model.label = model.label || undefined;
        // html content of task, will override label
        model.html = model.html || undefined;
        // show button bar
        model.showButton = model.showButton || false 
        // button classes, useful for fontawesome icons
        model.buttonClasses = model.buttonClasses || ''
        // html content of button
        model.buttonHtml = model.buttonHtml || ''
        // enable dragging of task
        model.enableDragging = model.enableDragging === undefined ? true : model.enableDragging;
        
        const left = this.columnService.getPositionByDate(model.from) | 0;
        const right = this.columnService.getPositionByDate(model.to) | 0; 

        return {
            model,
            left: left,
            width: right-left,
            height: this.getHeight(model),
            top: this.getPosY(model),
            reflections: []
        }
    }

    createTasks(tasks: TaskModel[]) {
        return tasks.map(task => this.createTask(task));
    }

    row(resourceId): SvelteRow{
        return this.rowEntities[resourceId];
    }

    getHeight(model){
        return this.row(model.resourceId).height - 2 * this.rowPadding;
    }

    getPosY(model){
        return this.row(model.resourceId).y + this.rowPadding;
    }
}

function overlap(one: SvelteTask, other: SvelteTask){
    return !(one.left + one.width <= other.left || one.left >= other.left + other.width);
}

export function reflectTask(task: SvelteTask, row: SvelteRow, options: { rowPadding: number }) {
    const reflectedId = `reflected-task-${task.model.id}-${row.model.id}`;

    const model = {
        ...task.model,
        resourceId: row.model.id,
        id: reflectedId,
        enableDragging: false
    };

    return {
        ...task,
        model,
        top: row.y + options.rowPadding,
        reflected: true,
        reflectedOnParent: false,
        reflectedOnChild: true,
        originalId: task.model.id
    };
}