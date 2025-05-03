type ResizeEvent_ = {
  clientWidth: number;
  clientHeight: number;
  offsetWidth: number;
  offsetHeight: number;
}

type ResizeListener = (event: ResizeObserverEntry) => void;

export class ResizeFeature {
  #listeners = new WeakMap<Element, Set<ResizeListener>>();

  #observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      for (const listener of this.#listeners.get(entry.target) || []) {
        listener(entry);
      }
    }
  });

  constructor() {
  }

  observe(element: HTMLElement, listener: ResizeListener) {
    const listeners = this.#listeners.get(element) || new Set();
    listeners.add(listener);

    this.#listeners.set(element, listeners);
    this.#observer.observe(element, {
      box: 'border-box'
    });

    return () => {
      const listeners = this.#listeners.get(element);
      listeners!.delete(listener);

      if (listeners!.size === 0) {
        this.#listeners.delete(element);
        this.#observer.unobserve(element);
      }
    };
  }
}