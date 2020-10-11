import { SvelteRow } from './row';
import { ColumnService } from './column';
export interface TaskModel {
    id: number;
    resourceId: number;
    from: any;
    to: any;
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
export declare class TaskFactory {
    columnService: ColumnService;
    rowPadding: number;
    rowEntities: {
        [key: number]: SvelteRow;
    };
    constructor(columnService: ColumnService);
    createTask(model: TaskModel): SvelteTask;
    createTasks(tasks: TaskModel[]): SvelteTask[];
    row(resourceId: any): SvelteRow;
    getHeight(model: any): number;
    getPosY(model: any): number;
}
export declare function reflectTask(task: SvelteTask, row: SvelteRow, options: {
    rowPadding: number;
}): {
    model: {
        resourceId: number;
        id: string;
        enableDragging: boolean;
        from: any;
        to: any;
        amountDone?: number;
        classes?: string | string[];
        label?: string;
        html?: string;
        showButton?: boolean;
        buttonClasses?: string | string[];
        buttonHtml?: string;
    };
    top: number;
    reflected: boolean;
    reflectedOnParent: boolean;
    reflectedOnChild: boolean;
    originalId: number;
    left: number;
    width: number;
    height: number;
    reflections?: string[];
};
