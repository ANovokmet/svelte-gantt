import type { SvelteRow } from './core/row';
import { memo } from './utils/getters';
import { getIndicesOnly } from './utils/utils';

export type Props = {
  rows: SvelteRow[];
  scrollTop: number;
  visibleHeight: number;
}

export class Virtualizer {
  props: Props;

  get rows() {
    return this.props.rows;
  }

  get scrollTop() {
    return this.props.scrollTop;
  }

  get visibleHeight() {
    return this.props.visibleHeight;
  }

  get totalHeight() {
    return this.getTotalHeight();
  }

  get virtualOffset() {
    return this.rows[this.getRange().startIndex]?.y ?? 0;
  }

  get virtualRows() {
    return this.getVirtualRows();
  }

  constructor(props: Props) {
    this.props = props;
  }

  isUniformHeight = memo(
    () => [this.props.rows],
    (rows) => {
      if (!rows.length) {
        return true;
      }
      const { height } = rows[0];
      return rows.every(row => row.height === height);
    }
  )

  getTotalHeight = memo(
    () => [this.props.rows],
    (rows) => rows.reduce((total, row) => total + row.height, 0)
  );

  getRange = memo(
    () => [this.rows, this.scrollTop, this.visibleHeight],
    (rows, scrollTop, visibleHeight) => {
      if (!rows.length) {
        return { startIndex: 0, endIndex: 0 };
      }

      if (this.isUniformHeight()) {
        const rowHeight = rows[0].height;
        const startIndex = Math.floor(scrollTop / rowHeight);
        const endIndex = Math.min(startIndex + Math.ceil(visibleHeight / rowHeight), rows.length - 1);
        return { startIndex, endIndex };
      }

      const endHeight = scrollTop + visibleHeight;
      const startIndex = getIndicesOnly(rows, scrollTop, row => row.y)[0];
      if (startIndex < 0) {
        return { startIndex: 0, endIndex: 0 };
      }
      let endIndex = startIndex;
      while (endIndex < rows.length - 1 && rows[endIndex].y < endHeight) {
        endIndex++
      }
      return { startIndex, endIndex };
    }
  );

  getVirtualRows = memo(() => [this.getRange().startIndex, this.getRange().endIndex], (start, end) => {
    return this.rows.slice(start, end + 1);
  });
}
