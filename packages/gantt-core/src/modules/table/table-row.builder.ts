import type { TableHeader } from './tableHeader';
import type { SvelteRow } from '../../core/row';
import { normalizeClassAttr } from '../../utils/dom';
import { GanttBuilder } from '../../gantt.builder';
import { memo } from '../../utils/getters';

type Props = {
  headers?: TableHeader[];
  row?: Accessor<SvelteRow>;
  onRowExpanded?(event: { row: SvelteRow });
  onRowCollapsed?(event: { row: SvelteRow });
}

type Accessor<T extends object> = (() => T) | T;

function getter<T extends object>(acc: Accessor<T>) {
  return typeof acc === 'function' ? acc() : acc;
}

export class TableRowBuilder {
  #classes = memo(() => [this.row.model.classes], normalizeClassAttr);
  #treeIndentationStyle = memo(() =>[this.row.parent], parentRow => parentRow ? `padding-left: ${parentRow.depth * 2}rem;` : '');

  get row() {
    return getter(this.props.row);
  }

  get classes() {
    return this.#classes();
  }

  constructor(
    private props: Props, 
    public gantt: GanttBuilder
  ) {
  }

  get attr() {
    return {
      'data-row-id': this.row.model.id,
      style: `height:${this.row.height}px`,
      // class: this.classes,
      'data-sg-table-row': '',
      [`sg-table-row-level-${this.row.depth}`]: '',
      'data-sg-row-expanded': this.row.expanded,
      'data-sg-hover': this.gantt.state.hoveredRow == this.row.model.id,
      'data-sg-selected': this.gantt.state.selectedRow == this.row.model.id,
    }
  }
}
