import type { SvelteTask } from '../../core/task';

export interface DependencyModel {
  id: number;
  /** Id of dependent task */
  fromId: number;
  /** Id of dependency task */
  toId: number;
  /** Stroke color */
  stroke: string;
  /** Width of stroke */
  strokeWidth: number;
  /** Size of the arrow head */
  arrowSize: number;
}

const MIN_LEN = 12;
const ARROW_SIZE = 5;

export function drawPath(fromTask: SvelteTask, toTask: SvelteTask, fromHidden: boolean, toHidden: boolean): { path: string; arrowPath: string; } {
  const startY = fromTask.top + fromTask.height / 2;
  const startX = fromTask.left + fromTask.width;
  const endY = toTask.top + toTask.height / 2;
  const endX = toTask.left;
  const width = endX - startX;
  const height = endY - startY;

  const path: string[] = [];
  let arrowPath = '';

  if (fromHidden) {
    path.push(`M${endX} ${endY}`);
    if (startX + MIN_LEN >= endX && startY != endY) {
      path.push(`L ${endX + 1.5 - MIN_LEN} ${endY}`);
    } else {
      path.push(`L ${endX + 1.5 - width / 2} ${endY}`);
    }
    path.push('m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4');
    arrowPath = [
      `M${toTask.left - ARROW_SIZE}  ${toTask.top + toTask.height / 2 - ARROW_SIZE}`,
      `L${toTask.left} ${toTask.top + toTask.height / 2}`,
      `L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`,
    ].join(' ');
  } else if (toHidden) {
    path.push(`M${startX} ${startY}`);
    if (startX + MIN_LEN >= endX && startY != endY) {
      path.push(`L ${startX + 1.5 + MIN_LEN} ${startY}`);
    } else {
      path.push(`L ${startX + 1.5 + width / 2} ${startY}`);
    }
    path.push('m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4');
    arrowPath = '';
  } else if (!fromHidden && !toHidden) {
    path.push(`M${startX} ${startY}`);
    if (startX + MIN_LEN >= endX && startY != endY) {
      path.push(
        `L ${startX + MIN_LEN} ${startY}`,
        `L ${startX + MIN_LEN} ${startY + height / 2}`,
        `L ${endX - MIN_LEN} ${startY + height / 2}`,
        `L ${endX - MIN_LEN} ${endY}`,
        `L ${endX - 2} ${endY}`,
      );
    } else {
      path.push(`L ${startX + width / 2} ${startY}` + ` L ${startX + width / 2} ${endY}` + ` L ${endX - 2} ${endY}`);
    }
    arrowPath = [
      `M${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 - ARROW_SIZE}`,
      `L${toTask.left} ${toTask.top + toTask.height / 2} `,
      `L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`,
    ].join(' ')
  }

  return { path: path.join(' '), arrowPath };
}