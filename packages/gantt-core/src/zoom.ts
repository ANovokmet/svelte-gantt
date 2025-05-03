import { getRelativePos } from './utils/dom';

type Props = {
  /**
   * List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
   */
  zoomLevels: ZoomOptions[];
  zooming: boolean;
  onZoomingChange: (value: boolean) => void;
}

type ZoomOptions = {
  minWidth?: number;
  fitWidth?: boolean;
  headers?: Headers[];
  magnetUnit?: string;
  magnetOffset?: number;
  columnUnit?: string;
  columnOffset?: number;
}

const defaultZoom = {
  minWidth: 800,
  fitWidth: false,
  headers: [
    { unit: 'day', format: 'MMMM Do' },
    { unit: 'hour', format: 'H:mm' }
  ],
};

export class ZoomFeature {
  get zoomLevels() {
    return this.props.zoomLevels;
  }

  constructor(private props: Props) {

  }

  zoomLevel = 0;

  attrs() {
    return {
      onwheel: this.onwheel.bind(this),
    };
  }

  async onwheel(event: WheelEvent) {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();

    const prevZoomLevel = this.zoomLevel;
    if (event.deltaY > 0) {
      this.zoomLevel = Math.max(this.zoomLevel - 1, 0);
    } else {
      this.zoomLevel = Math.min(this.zoomLevel + 1, this.zoomLevels.length - 1);
    }

    if (prevZoomLevel != this.zoomLevel && this.zoomLevels[this.zoomLevel]) {
      const options = {
        ...defaultZoom,
        columnUnit: columnUnit,
        columnOffset: columnOffset,
        minWidth: builder.minWidth,
        ...this.zoomLevels[this.zoomLevel]
      };

      const scale = options.minWidth / builder.width;
      const node = mainContainer;
      const mousepos = getRelativePos(node, event);
      const before = node.scrollLeft + mousepos.x;
      const after = before * scale;
      const scrollLeft = after - mousepos.x + node.clientWidth / 2;

      columnUnit = options.columnUnit;
      columnOffset = options.columnOffset;
      builder.minWidth = options.minWidth;

      if (options.headers) headers = options.headers;

      if (options.fitWidth) builder.fitWidth = options.fitWidth;

      api['gantt'].raise.viewChanged();

      this.props.onZoomingChange(true);
      // await tick();
      setTimeout(() => {
        node.scrollLeft = scrollLeft;
        this.props.onZoomingChange(false);
      })
    }
  }
}