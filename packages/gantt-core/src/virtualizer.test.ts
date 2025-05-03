import { describe, it, expect } from 'vitest';
import { Virtualizer, type Props } from './virtualizer';

describe('Virtualizer', () => {
  const mockRows = [
    { id: 0, y: 0, height: 50 },
    { id: 1, y: 50, height: 50 },
    { id: 2, y: 100, height: 50 },
    { id: 3, y: 150, height: 50 },
  ] as any[];

  const defaultProps: Props = {
    rows: mockRows,
    scrollTop: 0,
    visibleHeight: 100,
  };

  it('should initialize with given props', () => {
    const virtualizer = new Virtualizer({ ...defaultProps });
    expect(virtualizer.props).toEqual(defaultProps);
  });

  it('should calculate totalHeight correctly', () => {
    const virtualizer = new Virtualizer({ ...defaultProps });
    expect(virtualizer.totalHeight).toBe(200); // 4 rows * 50 height each
  });

  it('should calculate index correctly when rows are of the same height', () => {
    const virtualizer = new Virtualizer({ ...defaultProps });
    expect(virtualizer.getRange().startIndex).toBe(0);
    expect(virtualizer.getRange().endIndex).toBe(2);

    virtualizer.props.scrollTop = 60;

    expect(virtualizer.getRange().startIndex).toBe(1);
    expect(virtualizer.getRange().endIndex).toBe(3);
  });

  it('should calculate virtualOffset correctly', () => {
    const virtualizer = new Virtualizer({ ...defaultProps });
    expect(virtualizer.virtualOffset).toBe(0);

    virtualizer.props.scrollTop = 60;
    expect(virtualizer.virtualOffset).toBe(50);
  });

  it('should calculate virtualRows correctly', () => {
    const virtualizer = new Virtualizer({ ...defaultProps });
    expect(virtualizer.virtualRows).toEqual(mockRows.slice(0, 3));

    virtualizer.props.scrollTop = 60;
    expect(virtualizer.virtualRows).toEqual(mockRows.slice(1, 4));
  });

  it('should handle rows with varying heights', () => {
    const varyingHeightRows = [
      { y: 0, height: 30 },
      { y: 30, height: 70 },
      { y: 100, height: 50 },
    ] as any[];
    const props: Props = {
      ...defaultProps,
      rows: varyingHeightRows,
    };

    const virtualizer = new Virtualizer(props);
    expect(virtualizer.isUniformHeight()).toBe(false);
    expect(virtualizer.totalHeight).toBe(150);
    expect(virtualizer.getRange().startIndex).toBe(0);
    expect(virtualizer.getRange().endIndex).toBe(2);
    expect(virtualizer.virtualRows).toEqual(varyingHeightRows.slice(0, 3));
  });
});
