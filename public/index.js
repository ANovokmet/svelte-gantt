function time(input) {
    return moment(input, 'HH:mm');
}

const currentStart = time('06:00');
const currentEnd = time('18:00');

const colors = ['blue', 'green', 'orange']

let generation = 0;
let rowCount = 100;
function generateData() {
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
            enableDragging: true,
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

const timeRanges = [{
    id: 0,
    from: time('10:00'),
    to: time('12:00'),
    classes: null,
    label: 'Lunch'
}];


let data = generateData();
let options = {
    rows: data.rows,
    tasks: data.tasks,
    timeRanges,
    headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
    fitWidth: true,
    from: currentStart,
    to: currentEnd,
    tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
    tableWidth: 240,
    ganttTableModules: [app.SvelteGanttTable]
}

var gantt = new app.SvelteGantt({ target: document.getElementById('example-gantt'), props: options });

//gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
//gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
//gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
gantt.api.tasks.on.changed((task) => console.log('Listener: task changed', task));



function onClick(elementId, handler) {
    document.getElementById(elementId).addEventListener('click', handler);
}

onClick('setDayView', () => {
    console.log('day view set');
    gantt.$set({
        fitWidth: true,
        columnUnit: 'minute',
        columnOffset: 15,
        from: currentStart,
        to: currentEnd,
        minWidth: 1000,
        headers: [{ unit: 'day', format: 'DD.MM.YYYY' }, { unit: 'hour', format: 'HH' }]
    });
});

onClick('setWeekView', () => {
    console.log('week view set');
    gantt.$set({
        fitWidth: false,
        columnUnit: 'hour',
        columnOffset: 1,
        from: currentStart.clone().startOf('week'),
        to: currentStart.clone().endOf('week'),
        minWidth: 5000,
        headers: [{ unit: 'month', format: 'MMMM YYYY' }, { unit: 'day', format: 'ddd DD' }]
    });
});

onClick('setNextDay', () => {
    currentStart.add(1, 'day');
    currentEnd.add(1, 'day');
    console.log('set next day');

    gantt.$set({
        from: currentStart,
        to: currentEnd
    });
});


onClick('setPreviousDay', () => {
    currentStart.subtract(1, 'day');
    currentEnd.subtract(1, 'day');
    console.log('set previous day');

    gantt.$set({
        from: currentStart,
        to: currentEnd
    });
});

onClick('reInit', () => {
    console.log('re init');
    const data = generateData();

    gantt.$set({...data});
});

// SvelteGanttExternal.create(document.getElementById('newTask'), {
//     gantt,
//     onsuccess: (row, date, g) => {

//         console.log(row.model.id, date.format())

//         const task = g.taskFactory.createTask({
//             id: 5000 + Math.floor(Math.random() * 1000),
//             label: 'Task #' + 4343,
//             from: date,
//             to: date.clone().add(3, 'hour'),
//             classes: colors[(Math.random() * colors.length) | 0],
//             resourceId: row.model.id
//         });

//         gantt.store.addTask(task);
//     }
// });

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}