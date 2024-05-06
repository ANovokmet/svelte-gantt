
<script>
    import {SvelteGantt} from 'svelte-gantt/svelte';
    import { defaultOptions, time } from '$lib';
</script>


# Time range

Renders a block of time spanning all the rows.

```js
const options = {
    // ...
    timeRanges: [
            {
                id: 2,
                from: new Date('2024-02-01T08:00:00').valueOf(),
                to: new Date('2024-02-01T09:00:00').valueOf(),
                label: 'Breakfast'
            },
            {
                id: 1,
                from: new Date('2024-02-01T10:00:00').valueOf(),
                to: new Date('2024-02-01T11:00:00').valueOf(),
                classes: 'time-range-lunch',
                label: 'Lunch',
                resizable: false,
            }
    ]
}
```

<SvelteGantt from={time('8:00')} to={time('12:00')}
    rows={[{id: 1}, {id: 2}]}
    timeRanges={[
        {
            id: 1,
            from: time('8:00'),
            to: time('9:00'),
            classes: null,
            label: 'Breakfast'
        },
        {
            id: 0,
            from: time('10:00'),
            to: time('11:00'),
            classes: 'time-range-lunch',
            label: 'Lunch',
            resizable: false,
        }
    ]}/>

## Props

| Name | Description | Type | Default |
| - | - | - | -: |
| `id`  | Unique id of time range. | `Number`\|`String` | undefined |
|`from` | Datetime timeRange starts on.| `number`  | undefined |
| `to`  | Datetime timeRange ends on. | `number` | undefined |
| `classes`| Custom CSS classes. | `String`\|`Array` | undefined |
| `label`  | Display label. | `String` | undefined |
| `resizable` | Should the time range be resizable. | `Boolean` | false |
