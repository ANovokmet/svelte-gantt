import { extract, type MaybeGetter } from '../utils/getters';

export type SelectionState = { [id: PropertyKey]: boolean; }

type Props = {
  readonly state: MaybeGetter<SelectionState>;
  onStateChange: (state: SelectionState) => void;
}

export class Selection<T extends PropertyKey = string> {
  constructor (
    private props: Props,
  ) {
  }

  get state() {
    return extract(this.props.state, {});
  }

  onStateChange(state: SelectionState) {
    return this.props.onStateChange(state);
  }

  select(id: T) {
    // this.clear();
    // this.state[id] = true;
    this.onStateChange({ [id]: true });
  }

  toggle(id: T) {
    // this.state[id] = !this.state[id];
    this.onStateChange({ ...this.state, [id]: !this.state[id] });
  }

  clear() {
    // this.state = {};
    this.onStateChange({});
  }

  selected(id: T) {
    // return !!this.state[id];
    this.onStateChange({ ...this.state, [id]: !!this.state[id] });
  }
}
