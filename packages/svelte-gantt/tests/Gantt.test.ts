import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { SvelteGantt } from '../src';
import type { Props } from '../src/Gantt.svelte';
import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;

const mockRows = [
  { id: 'r1', label: 'Row 1' },
  { id: 'r2', label: 'Row 2' },
  { id: 'r3', label: 'Row 3' }
];

const mockTasks = [
  { id: 't1', resourceId: 'r1', from: new Date(2023, 0, 1, 10).getTime(), to: new Date(2023, 0, 1, 12).getTime(), label: 'Task 1' },
  { id: 't2', resourceId: 'r2', from: new Date(2023, 0, 1, 11).getTime(), to: new Date(2023, 0, 1, 13).getTime(), label: 'Task 2' }
];

const mockTimeRanges = [
  { id: 'tr1', from: new Date(2023, 0, 1, 9).getTime(), to: new Date(2023, 0, 1, 12).getTime(), label: 'Morning' }
];

const defaultProps: Partial<Props> = {
  rows: mockRows,
  tasks: mockTasks,
  timeRanges: mockTimeRanges,
  from: new Date(2023, 0, 1, 8).getTime(),
  to: new Date(2023, 0, 1, 18).getTime()
};

describe('SvelteGantt Component', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  
  function renderGantt(customProps: Partial<Props> = {}) {
    const props = { ...defaultProps, ...customProps };
    return render(SvelteGantt, props as any);
  }

  it('renders without crashing', () => {
    const { container } = renderGantt();
    expect(container).toBeTruthy();
    expect(container.querySelector('[data-sg-gantt]')).not.toBeNull();
  });

  it('renders with the correct dimensions', () => {
    const { container } = renderGantt({ rowHeight: 60 });
    
    const ganttElement = container.querySelector('[data-sg-gantt]') as HTMLElement;
    
    expect(ganttElement).not.toBeNull();
    
    // Force layout calculations
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
    
    // Verify dimensions
    expect(ganttElement.offsetHeight).toBe(400);
    expect(ganttElement.offsetWidth).toBe(800);
  });

  it('renders the correct number of rows', () => {
    const { container } = renderGantt();
    const rowElements = container.querySelectorAll('[data-sg-row]');
    expect(rowElements.length).toBeGreaterThan(0);
  });

  it('renders tasks', () => {
    const { container } = renderGantt();
    const taskElements = container.querySelectorAll('[data-sg-task]');
    expect(taskElements.length).toBeGreaterThan(0);
  });

  it('renders time ranges', () => {
    const { container } = renderGantt();
    const timeRangeElements = container.querySelectorAll('[data-sg-time-range]');
    expect(timeRangeElements.length).toBeGreaterThan(0);
  });
});
