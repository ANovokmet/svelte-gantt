import { memo } from '../utils/getters';
import type { SvelteRow } from '../core/row';
import { normalizeClassAttr } from '../utils/dom';
import type { GanttBuilder } from 'src/gantt.builder';
import type { TableBuilder } from 'src/modules/table/table.builder';

type Props = {
  row: SvelteRow;
}

export class RowBuilder {
  get row() { return this.props.row; }

  get headers() { return (this.gantt.table as TableBuilder).headers; }

  constructor(
    private props: Props,
    public gantt: GanttBuilder
  ) {
  }

  classes = memo(() => [this.row.model.classes], normalizeClassAttr);

  get attrs() {
    return {
      'data-sg-row': '',
      classes: this.classes(),
      'data-row-id': this.row.model.id,
      'data-sg-hover': false, // this.hoveredRow == this.row.model.id,
      'data-sg-selected': false, // this.selectedRow == this.row.model.id,
      style: `height:${this.row.height}px`,
    };
  }
}
