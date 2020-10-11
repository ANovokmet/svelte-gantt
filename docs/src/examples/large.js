import { time } from '../utils';

const colors = ['blue', 'green', 'orange']
let generation = 0;
let rowCount = 100;

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function generate() {
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