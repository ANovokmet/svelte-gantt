//import SvelteGantt from './Grid.svelte';
//import moment from "../node_modules/moment/src/moment.js";

function time(input) {
    return moment(input, 'HH:mm');
}
let startOfToday = moment().startOf('day');

const currentStart = time('06:00');
const currentEnd = time('18:00');

const dependencies = [];
const colors = ['blue', 'green', 'orange']

const data = {
    rows: [{
        "id": 1,
        "label": "Preparation and Planning"
    }, {
        "id": 2,
        "label": "Development"
    }, {
        "id": 3,
        "label": "Implementation"
    }, {
        "id": 4,
        "label": "Training"
    }, {
        "id": 5,
        "label": "Roll-out product"
    }],
    tasks: [{
        "id": 1,
        "resourceId": 1,
        "label": "Preparation",
        "from": time("7:00"),
        "to": time("9:00"),
        "classes": "orange"
    }, {
        "id": 2,
        "resourceId": 1,
        "label": "Planning",
        "from": time("9:30"),
        "to": time("11:00"),
        "classes": "orange"
    }, {
        "id": 3,
        "resourceId": 2,
        "label": "Development",
        "from": time("12:00"),
        "to": time("13:30"),
        "classes": "orange"
    }, {
        "id": 4,
        "resourceId": 3,
        "label": "Implementation",
        "from": time("13:45"),
        "to": time("15:45"),
        "classes": "orange"
    }, {
        "id": 5,
        "resourceId": 5,
        "label": "Finish",
        "from": time("17:00"),
        "to": time("17:45"),
        "classes": "green"
    }, {
        "id": 6,
        "resourceId": 4,
        "label": "Training",
        "from": time("7:00"),
        "to": time("10:00"),
        "classes": "blue"
    }],
    dependencies: [{
        id: 1,
        fromId: 1,
        toId: 2
    }, {
        id: 2,
        fromId: 2,
        toId: 3
    }, {
        id: 3,
        fromId: 3,
        toId: 4
    }, {
        id: 4,
        fromId: 4,
        toId: 5
    }, {
        id: 5,
        fromId: 6,
        toId: 5
    }]
};

let options = {
    rows: data.rows,
    tasks: data.tasks,
    dependencies: data.dependencies,
    headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
    fitWidth: true,
    from: currentStart,
    to: currentEnd,
    tableHeaders: [{ title: 'Label', property: 'label', width: 140 }],
    tableWidth: 240,
    ganttTableModules: [SvelteGanttTable],
    ganttBodyModules: [SvelteGanttDependencies]
}

var gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });

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
    gantt.$set({...data});
});

var external = new SvelteGanttExternal(document.getElementById('newTask'), {
    gantt,
    onsuccess: (row, date, gantt) => {
        console.log(row.model.id, date.format())
        const id = 5000 + Math.floor(Math.random() * 1000);
        gantt.updateTask({
            id,
            label: `Task #${id}`,
            from: date,
            to: date.clone().add(3, 'hour'),
            classes: colors[(Math.random() * colors.length) | 0],
            resourceId: row.model.id
        });
    },
    elementContent: () => {
        const element = document.createElement('div');
        element.innerHTML = 'New Task';
        element.className = 'sg-external-indicator';
        return element;
    }
});