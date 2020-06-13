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

let generation = 0;
function generateData() {
    const data = {
        rows: [],
        tasks: [],
    }

    const ids = [...Array(100).keys()];
    shuffle(ids);

    for (let i = 0; i < 100; i++) {

        let rand_bool = Math.random() < 0.2;


        data.rows.push({
            generation,
            id: i,
            label: 'Row #' + i,
            age: (Math.random() * 80) | 0,
            enableDragging: true,
            imageSrc: 'Content/joe.jpg',
            //contentHtml: '<s>Test</s>'
            //headerHtml: '<s>Test</s>'
            classes: rand_bool ? ['row-disabled'] : undefined,
            enableDragging: !rand_bool
        });

        let a = i % 2;
        rand_bool = Math.random() > 0.5;

        const rand_h = (Math.random() * 10) | 0
        const rand_d = (Math.random() * 5) | 0 + 1

        //if(i === 5 || i === 1)
        data.tasks.push({
            type: 'task',
            generation,
            id: ids[i],
            resourceId: i,
            label: 'Task #' + ids[i],
            from: time(`${7 + rand_h}:00`),
            to: time(`${7 + rand_h + rand_d}:00`),
            //amountDone: Math.floor(Math.random() * 100),
            classes: colors[(Math.random() * colors.length) | 0],
            //enableDragging: !rand_bool
            //h: Math.random() < 0.5
        });

        // if (i === 3)
        //     data.tasks.push({
        //         type: 'milestone',
        //         id: 4321,
        //         from: time('13:00'),
        //         resourceId: 2,
        //         enableDragging: true
        //     });

        // data.tasks.push({
        // 	generation,
        // 	id: i + 1000,
        // 	resourceId: i,
        // 	label: 'Task #'+ (i + 1000),
        // 	from: startOfToday.clone().set({'hour': 12 + 4*a, 'minute': 0}),
        // 	to: startOfToday.clone().set({'hour': 14 + 4*a, 'minute': 0}),
        // 	//amountDone: Math.floor(Math.random() * 100),
        // 	classes: rand_bool ? 'task-status-1' : '',
        // 	enableDragging: !rand_bool
        // 	//h: Math.random() < 0.5
        // });
    }


    // data.rows[0].children = [];
    // for (let i = 0; i < 5; i++) {
    //     data.rows[0].children.push({
    //         id: i + 10,
    //         label: 'Row #0' + i,
    //         age: 0,
    //         enableDragging: true,
    //         imageSrc: 'Content/joe.jpg'
    //     });
    // }

    generation += 1;

    // dependencies.push({
    //     id: 0,
    //     fromId: 1,
    //     toId: 5
    // });

    return data;
}


// var interval = setInterval(() => {
// 	var data = generateData();
// 	gantt.initTasks(data.tasks);
// }, 1000);


/*setInterval(() => {
	for(let i = 0; i < 500; i++){
		let t = data.rows[i].tasks[0];
		if(t.h){
			t.amountDone += 1;
		}
		else{
			t.amountDone -= 1;
		}
	
		if(t.amountDone == 0 || t.amountDone == 100){
			t.h = !t.h
		}	
		t.updateView();
	}
}, 50)*/

const timeRanges = [{
    id: 0,
    from: time('10:00'),
    to: time('12:00'),
    classes: null,
    label: 'Lunch' //?
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
    ganttTableModules: [app.SvelteGanttTable],
    ganttBodyModules: [app.SvelteGanttDependencies],
    //dependencies
    //taskContent: (task) => '<i class="sg-icon fas fa-calendar"></i>' + task.model.label
}


var gantt = new app.SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
//var gantt = create(document.getElementById('example-gantt'), generateData(), options);
// gantt.initTimeRanges();

// //gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
// //gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
// gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
// //gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
// gantt.api.tasks.on.changed((task) => console.log('Listener: task changed', task));



function onClick(elementId, handler) {
    document.getElementById(elementId).addEventListener('click', handler);
}

onClick('setDayView', () => {
    console.log('day view set');
    gantt.$set({
        stretchTimelineWidthToFit: true,
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
        stretchTimelineWidthToFit: false,
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
    gantt.initRows(data.rows);
    gantt.initTasks(data.tasks);
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