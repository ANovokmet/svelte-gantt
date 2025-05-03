export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;

export type WithoutGetters<Obj extends Record<string, unknown>> = {
  [K in keyof Obj]: Obj[K] extends MaybeGetter<infer T> ? T : Obj[K];
};

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isGetter(value: unknown): value is () => unknown {
  return isFunction(value) && value.length === 0;
}

export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, defaultValue: T): T;
export function extract(value: unknown, defaultValue?: unknown) {
  if (isGetter(value)) {
    const getter = value;
    const gotten = getter();
    if (gotten === undefined) return defaultValue;
    return gotten;
  }

  if (value === undefined) return defaultValue;
  return value;
}

export function wrapExtract<T extends Record<string, unknown>>(props: T, defaultValues?: Partial<T>): WithoutGetters<T> {
  return new Proxy(props, {
    get(target, prop, _receiver) {
      return extract(target[prop as string], defaultValues?.[prop as string]);
    }
  }) as WithoutGetters<T>;
}

type Getters<Obj extends Record<string, unknown>> = {
  [Key in keyof Obj]: Getter<Obj[Key]>;
};

export function getters<Obj extends Record<string, unknown>>(obj: Obj): Getters<Obj> {
  return Object.fromEntries(Object.keys(obj).map((key) => [key, () => obj[key]])) as Getters<Obj>;
}

// set multiple defaults



type NoInfer<T> = [T][T extends any ? 0 : never]

export function memo<TDeps extends any[], TDepArgs, TResult>(
  getDeps: (depArgs?: TDepArgs) => [...TDeps],
  fn: (...args: NoInfer<[...TDeps]>) => TResult,
  opts?: {
    onChange?: (result: TResult) => void
  },
): (depArgs?: TDepArgs) => TResult {
  let deps: any[] = []
  let result: TResult | undefined

  return (depArgs?: TDepArgs) => {
    const newDeps = getDeps(depArgs);
    const depsChanged = newDeps.length !== deps.length || newDeps.some((dep: any, index: number) => deps[index] !== dep);
    if (!depsChanged) {
      return result!;
    }
    deps = newDeps;
    result = fn(...newDeps);
    opts?.onChange?.(result);
    return result!;
  }
}