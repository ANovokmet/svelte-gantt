<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import { options } from '../../stores/store';

    let generation = 0;
    let rowCount = 100;
    const colors = ['blue', 'green', 'orange']

    const timeRanges = [
        {
            id: 0,
            from: time('10:00'),
            to: time('12:00'),
            classes: 'time-range-lunch',
            label: 'Lunch',
            resizable: false,
        },
        {
            id: 1,
            from: time('15:00'),
            to: time('17:00'),
            classes: null,
            label: 'Dinner'
        }
    ];

    const data = generate();

    $options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
        timeRanges,
        rowHeight: 52,
        rowPadding: 6,
        // headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
        fitWidth: true,
        minWidth: 2000,
        from: moment().startOf('week'),
        to: moment().endOf('week'),
        tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
        tableWidth: 240,
        ganttTableModules: [SvelteGanttTable],

        columnUnit: 'day',
        columnOffset: 1,
        magnetUnit: 'day',
        magnetOffset: 1,                    
        headers: [{ unit: 'day', format: 'MMMM YYYY', offset: 7 }, { unit: 'day', format: ' DD ddd' }],
    }

    $: {
        console.log('options changed', $options);
        if (gantt) {
            gantt.$set($options);
        }
    }

    /**
     * @type {import('$dist').SvelteGanttComponent}
     */
    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: $options });

        gantt.api.tasks.on.changed(([ev]) => {
            // ev.task.model=> from: 1665964800000, to: 1666224000000
            // Cast do date:
            //  new Date(ev.task.model.from).toISOString()    => '2022-10-17T00:00:00.000Z'
            //  new Date(ev.task.model.from).toDateString()  => 'Sun Oct 16 2022' (timestamp here is '21:00:00 GMT-0300'
            // I've lost the timezone here

            // And look whats happening with model.to
            // Cast do date:
            //  new Date(ev.task.model.to).toISOString()    => '2022-10-20T00:00:00.000Z'
            //  new Date(ev.task.model.from).toDateString()  => 'Wed Oct 19 2022' (timestamp here is '21:00:00 GMT-0300'

            console.log(ev);

            if (ev) {
                let from = new Date(ev.task.model.from);
                let to = new Date(ev.task.model.to);

                console.log(from, to);

                // Have to force things here
                // i.setHours(0, 0, 0);
                // f.setHours(23, 23, 59);
                // f.setDate(f.getDate() - 1);

                let data_to_server = {
                    id: ev.task.model.id,
                    from: from.toISOString(),
                    to: to.toISOString(),
                };

                console.log(data_to_server);
            }
        });
    });

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function generate() {
        const rows = [];
        const tasks = [];

        const ids = [...Array(rowCount).keys()];
        shuffle(ids);

        for (let i = 0; i < rowCount; i++) {
            let rand_bool = Math.random() < 0.2;

            rows.push({
                id: i,
                label: 'Row #' + i,
                age: (Math.random() * 80) | 0,
                imageSrc: 'Content/joe.jpg',
                classes: rand_bool ? ['row-disabled'] : undefined,
                enableDragging: !rand_bool,
                generation
            });

            rand_bool = Math.random() > 0.5;

            const rand_h = (Math.random() * 10) | 0
            const rand_d = (Math.random() * 5) | 0 + 1

            tasks.push({
                type: 'task',
                id: ids[i],
                resourceId: i,
                label: 'Task #' + ids[i],
                from: time(`${7 + rand_h}:00`),
                to: time(`${7 + rand_h + rand_d}:00`),
                classes: colors[(Math.random() * colors.length) | 0],
                generation
            });
        }

        generation += 1;

        return { rows, tasks };
    }

    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign($options, opts);
        gantt.$set($options);
    }

    const a = time('6:00');
    const b = time('6:30');
    let curr = a;

    function toggle() {
        if (curr === a) {
            curr = b;
        } else {
            curr = a;
        }

        gantt.$set({
            from: curr
        });
    }
</script>

<style>
    #example-gantt {
        flex-grow: 1;
        overflow: auto;
    }

    .container {
        display: flex;
        overflow: auto;
        flex: 1;
    }
</style>

<div class="container">
    <button on:click={toggle}>toggle</button>
    <div id="example-gantt"></div>
    <GanttOptions options={$options} on:change={onChangeOptions}/>
</div>