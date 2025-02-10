import { Column } from '../core/column';

export function createBackground(
    columns: Column[],
    opts: { columnStrokeWidth; columnStrokeColor }
) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = (columns.length - 1) * columns[0].width;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        ctx.shadowColor = 'rgba(128,128,128,0.5)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0.5;
        ctx.lineWidth = opts.columnStrokeWidth;
        ctx.lineCap = 'square';
        ctx.strokeStyle = opts.columnStrokeColor;
        ctx.translate(0.5, 0.5);
        columns.forEach(column => {
            lineAt(ctx, column.left);
        });
        const dataURL = canvas.toDataURL();
        return `url("${dataURL}")`;
    } catch (e) {
        console.error('[canvas] Render error', e);
    }
}

function lineAt(ctx, x) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 20);
    ctx.stroke();
}

export function createWeekEndsHighlight(columns, opts: { from; highlightColor }) {
    const start_gantt = new Date(opts.from);
    const dayStart = start_gantt.getDay();
    const startIndex = dayStart == 0 ? 7 : 7 - dayStart;
    const canvas = document.createElement('canvas');
    canvas.width = columns.length * columns[0].width;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    ctx.shadowColor = 'rgba(128,128,128,0.5)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0.5;
    ctx.lineWidth = columns[0].width;
    ctx.lineCap = 'square';
    ctx.strokeStyle = opts.highlightColor;
    ctx.translate(0.5, 0.5);

    columns.forEach((column, index) => {
        if (index == startIndex) lineAt(ctx, column.left - columns[0].width / 2);
        if (index == startIndex + 1) lineAt(ctx, column.left - columns[0].width / 2);
    });
    const dataURL = canvas.toDataURL();
    return `url("${dataURL}")`;
}
