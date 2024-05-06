---
title: Headers
---

# Header

Represents a row of header cells that render over the gantt.

-   `unit` (`String`) Time unit used to display header cells.
    -   eg. `'day'` will create a cell in the header for each day in the timeline.
-   `format` (`String`) Datetime format used to label header cells.
    -   eg. `'DD.MM.YYYY'`, `'HH'`
-   `offset` (`Number`) Duration width of header cell.
-   `sticky` (`Boolean`) Use sticky positioning for header labels.

### Formatting

By default `svelte-gantt` is only able to format a small set of date templates, eg. 'HH:mm'. For more you can use `MomentSvelteGanttDateAdapter` as `dateAdapter`:

```js
import { MomentSvelteGanttDateAdapter } from 'svelte-gantt';
import moment from 'Moment';

const options = {
    dateAdapter: new MomentSvelteGanttDateAdapter(moment)
    // ...
}
```

...or a custom one, as long as it implements the interface `{ format(date: number, format: string): string; }`.


```js
import dayjs from 'dayjs';

const options = {
    dateAdapter: {
        format(date, format) {
            return dayjs(date).format(format);
        }
    },
    // ...
}
```