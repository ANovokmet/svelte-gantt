
function time(input) {
    return moment(input, 'HH:mm');
}
let startOfToday = moment().startOf('day');

const currentStart = time('06:00');
const currentEnd = time('18:00');

const data = {
    rows: [{
        id: 10,
        label: "Accounting",
        class: 'row-group',
        iconClass: 'fas fa-calculator',
        children: [{
            id: 11,
            label: "Petunia Mulliner"
        }, {
            id: 12,
            label: "Mélina Giacovetti"
        }, {
            id: 13,
            label: "Marlène Lasslett"
        }, {
            id: 14,
            label: "Adda Youell"
        }]
    }, {
        id: 20,
        label: "Business Development",
        class: 'row-group',
        iconClass: 'fas fa-user-tie',
        children: [{
            id: 21,
            label: "Pietra Fallow"
        }, {
            id: 22,
            label: "Mariellen Torbard"
        }, {
            id: 23,
            label: "Renate Humbee"
        }]
    }, {
        id: 3,
        label: "Ida Flewan"
    }, {
        id: 4,
        label: "Lauréna Shrigley"
    }, {
        id: 5,
        label: "Ange Kembry"
    }],
    tasks: [{
        "id": 1,
        "resourceId": 11,
        "label": "LPCVD",
        "from": time("9:00"),
        "to": time("11:00"),
        "classes": "orange"
    }, {
        "id": 2,
        "resourceId": 12,
        "label": "Entrepreneurship",
        "from": time("10:00"),
        "to": time("12:30"),
        "classes": "orange"
    }, {
        "id": 3,
        "resourceId": 13,
        "label": "PET-CT",
        "from": time("13:30"),
        "to": time("15:00"),
        "classes": "orange"
    }, {
        "id": 4,
        "resourceId": 14,
        "label": "Auditing",
        "from": time("9:30"),
        "to": time("11:30"),
        "classes": "orange"
    }, {
        "id": 5,
        "resourceId": 21,
        "label": "Security Clearance",
        "from": time("15:15"),
        "to": time("16:00"),
        "classes": "green"
    }, {
        "id": 6,
        "resourceId": 22,
        "label": "Policy Analysis",
        "from": time("14:00"),
        "to": time("17:00"),
        "classes": "blue"
    }, {
        "id": 7,
        "resourceId": 23,
        "label": "Xbox 360",
        "from": time("13:30"),
        "to": time("14:30"),
        "classes": "blue"
    }, {
        "id": 8,
        "resourceId": 3,
        "label": "GNU/Linux",
        "from": time("14:00"),
        "to": time("15:30"),
        "classes": "blue"
    }, {
        "id": 9,
        "resourceId": 4,
        "label": "Electronic Trading",
        "from": time("15:00"),
        "to": time("17:00"),
        "classes": "green"
    }, {
        "id": 10,
        "resourceId": 5,
        "label": "Alternative Medicine",
        "from": time("14:30"),
        "to": time("15:30"),
        "classes": "orange"
    }]
};

const options = {
    rows: data.rows,
    tasks: data.tasks,
    headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
    fitWidth: true,
    from: currentStart,
    to: currentEnd,
    tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
    tableWidth: 240,
    ganttTableModules: [SvelteGanttTable]
};

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