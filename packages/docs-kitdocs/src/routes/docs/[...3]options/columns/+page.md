
## Highlighted durations

Highlight a repeating block of time spanning all rows:

-   `unit` (`String`) Time unit of duration, e.g. `'day'`.
-   `fractions` (`Array`) List of fractions that should be highlighted, e.g. `{unit: 'day', fractions: [0,6]}` will highlight weekends.

Highlighting will only work correctly if `useCanvasColumns` is set to `false`, and if highlighted unit is the same or a constant fraction of the column unit eg. `day`, `hour`, `minute`.