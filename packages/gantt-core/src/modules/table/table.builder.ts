import { GanttBuilder } from '../../gantt.builder';
import { TableRowBuilder } from './table-row.builder';

export class TableBuilder {
  // TODO:: scroll content scrolls other
  // function scrollListener(node: HTMLElement) {
  //   scrollables.push({ node, orientation: 'vertical' });

  //   function onScroll(event: Event) {
  //     headerContainer.scrollLeft = node.scrollLeft;
  //   }

  //   node.addEventListener('scroll', onScroll);

  //   return {
  //     destroy() {
  //       node.removeEventListener('scroll', onScroll);
  //     }
  //   };
  // }

  constructor(
    private gantt: GanttBuilder
  ) {
  }

  get visibleRows() {
    return this.gantt.virtual.virtualRows;
  }

  get headers() {
    return this.gantt.options.tableHeaders ?? [{ title: 'Name', property: 'label', width: 100 }];
  }

  attr() {
    return {
      'data-sg-table': '',
      'data-sg-view': '',
    }
  }

  body() {
    return {
      'data-sg-table-body': '',
      style: `padding-bottom: ${this.gantt.bottomScrollbarVisible}px;`,
    }
  }

  get visibleRowBuilders() {
    return this.visibleRows.map(row => new TableRowBuilder({
      row,
    }, this.gantt));
  }
}
