<script>
    import { createEventDispatcher } from 'svelte';
    import { time } from '../utils';

    export let options = {
        from: time('06:00'),
        to: time('18:00'),
    };

    const dispatch = createEventDispatcher();

    function onUpdateOptions(options) {
        dispatch('updateOptions', options);
    }

    function onSetDayView() {
        console.log('day view set');
        onUpdateOptions({
            fitWidth: true,
            columnUnit: 'minute',
            columnOffset: 15,
            from: options.from,
            to: options.to,
            minWidth: 1000,
            headers: [{ unit: 'day', format: 'DD.MM.YYYY' }, { unit: 'hour', format: 'HH' }]
        });
    }

    function onSetWeekView() {
        console.log('week view set');
        onUpdateOptions({
            fitWidth: false,
            columnUnit: 'hour',
            columnOffset: 1,
            from: options.from.clone().startOf('week'),
            to: options.from.clone().endOf('week'),
            minWidth: 5000,
            headers: [{ unit: 'month', format: 'MMMM YYYY', sticky: true }, { unit: 'day', format: 'ddd DD', sticky: true }]
        });
    }

    function onSetNextDay() {
        console.log('set next day');
        onUpdateOptions({
            from: options.from.clone().add(1, 'day'),
            to: options.to.clone().add(1, 'day')
        });
    }

    function onSetPreviousDay() {
        console.log('set previous day');
        onUpdateOptions({
            from: options.from.clone().subtract(1, 'day'),
            to: options.to.clone().subtract(1, 'day')
        });
    }
</script>

<style>
    input[type=button] {
        margin-right: 4px;
    }
</style>

<div class="view-navigation">
    <input type="button" value="<" on:click={onSetPreviousDay}/>
    <input type="button" value="Day view" on:click={onSetDayView}/>
    <input type="button" value=">" on:click={onSetNextDay}/>
    <input type="button" value="Week view" on:click={onSetWeekView}/>
</div>