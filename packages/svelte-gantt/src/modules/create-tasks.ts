import { ColumnService } from '../core/column';
import { getRelativePos, getRelativePosition } from '../utils/dom';
import { GanttUtils } from '../utils/utils';
import { getContext } from 'svelte';

type Options = {
    enabled?: boolean;
    container: HTMLElement;
    onMove(e: MoveEvent): void;
    onEnd(e: MoveEvent): void;
}

type InnerOptions = Options & {
    columnService: ColumnService;
    utils: GanttUtils;
}

export type MoveEvent = {
    from: number;
    to: number;
    x: number;
    y: number;
    width: number;
}

export function useCreateTask() {
    const { columnService, utils } = getContext('services');

    return function createTaskActionBound(node: HTMLElement, options: Options) {
        return createTaskAction(node, {
            columnService,
            utils,
            ...options,
        });
    }
}

const MIN_DRAG_X = 2;
const MIN_DRAG_Y = 2;

function createTaskAction(node: HTMLElement, options: InnerOptions) {
    let startX: number;
    let startFrom: number;
    let mouseStartRight: number;

    let direction: 'left' | 'right';

    let initialX: number;
    let initialY: number;
    let triggered = false;

    const container = () => options.container;

    function onMousedown(event: MouseEvent) {
        if (!options.enabled) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const [mousePosX, _] = getRelativePosition(container(), event);

        const from = startFrom = options.utils.roundTo(options.columnService.getDateByPosition(mousePosX));
        const x = startX = options.columnService.getPositionByDate(from) | 0;
        const width = 0;

        initialX = event.clientX;
        initialY = event.clientY;

        mouseStartRight = x + width;

        window.addEventListener('pointermove', onMousemove, false);
        window.addEventListener('pointerup', onMouseup);
    };

    function onMousemove(event: MouseEvent) {
        if (!triggered) {
            if (Math.abs(event.clientX - initialX) > MIN_DRAG_X || Math.abs(event.clientY - initialY) > MIN_DRAG_Y) {
                triggered = true;
            } else {
                return;
            }
        }

        event.preventDefault();

        const { x, width, y } = getValues(event);
        options.onMove({
            from: startFrom,
            to: startFrom,
            x,
            width,
            y,
        });
    };

    function getValues(event: MouseEvent) {
        const mousePos = getRelativePos(container(), event);
        const x = startX;
        const width = 0;

        let resultX: number;
        let resultWidth: number;

        if (direction === 'left') {
            if (mouseStartRight - mousePos.x <= 0) {
                direction = 'right';

                resultX = mouseStartRight;
                resultWidth = mouseStartRight - mousePos.x;
                mouseStartRight = mouseStartRight + width;
            } else {
                resultX = mousePos.x;
                resultWidth = mouseStartRight - mousePos.x;
            }
        } else { // if (direction === 'right')
            //resize right
            if (mousePos.x - x <= 0) {
                direction = 'left';
                resultX = mousePos.x;
                resultWidth = mousePos.x - x;
                mouseStartRight = x;
            } else {
                resultX = x;
                resultWidth = mousePos.x - x;
            }
        }

        return { x: resultX, width: resultWidth, y: mousePos.y };
    }

    function onMouseup(event: MouseEvent) {
        window.removeEventListener('pointerup', onMouseup);
        window.removeEventListener('pointermove', onMousemove, false);

        if (triggered) {
            const { x, width, y } = getValues(event);

            const newFrom = options.utils.roundTo(options.columnService.getDateByPosition(x));
            const newTo = options.utils.roundTo(options.columnService.getDateByPosition(x + width));
            const newLeft = options.columnService.getPositionByDate(newFrom) | 0;
            const newRight = options.columnService.getPositionByDate(newTo) | 0;

            options.onEnd({
                from: newFrom,
                to: newTo,
                x: newLeft,
                width: newRight - newLeft,
                y,
            });
        }

        mouseStartRight = null;

        initialX = null;
        initialY = null;
        triggered = false;
    };

    node.addEventListener('pointerdown', onMousedown);

    return {
        destroy() {
            node.removeEventListener('pointerdown', onMousedown);
            window.removeEventListener('pointermove', onMousemove);
            window.removeEventListener('pointerup', onMouseup);
        },
        update(opts: Options) {
            Object.assign(options, opts);
        },
    }
}