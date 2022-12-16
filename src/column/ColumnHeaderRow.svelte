<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';

    const dispatch = createEventDispatcher();

    import type { SvelteGanttDateAdapter } from '../utils/date';
    import { startOf, getDuration, getAllPeriods} from '../utils/date';
    import { getPositionByDate} from '../utils/utils';

    const { from, to, width } = getContext('dimensions');
    const { dateAdapter }: { dateAdapter: SvelteGanttDateAdapter } = getContext('options');

    export let header;
    export let baseWidth;
    export let baseDuration;

    let columnWidth;
    $: {
        header.duration = getDuration(header.unit, header.offset);
        const duration = header.duration;
        const ratio = duration / baseDuration;
        columnWidth = baseWidth * ratio;
    }

    let columnCount;
    $: {
        columnCount = Math.ceil($width / columnWidth);
        if(!isFinite(columnCount)){
            console.error('columnCount is not finite');
            columnCount = 0;
        }
    }

    let _headers = [];
    $: {
        const headers = [];
        const periods = getAllPeriods($from.valueOf(), $to.valueOf(), header.unit, 1);
        let old_width = 0;
        periods.forEach(function(period){
            let header_width = getPositionByDate(period.to, $from.valueOf(), $to.valueOf(), $width)
            
            headers.push({
                width:Math.min(header_width - old_width, $width),
                label:dateAdapter.format(period.from, header.format),
                from:period.from,
                to:period.to,
                unit:header.unit
            })

            old_width = header_width;
        })
        _headers = headers;
    }


    function defineCorrections(unit, headerTime, columnCount, offset=1){
        let dtemp = new Date(headerTime);
        let array_return = [];

        if(unit == 'month'){
            let array_31 = [0,2,4,6,7,9,11];
            for(let i=0; i<columnCount; i++){
                let correction_totale = 0;
                for(let j=0; j<offset; j++){
                    let correction = 0;
                    const month = dtemp.getMonth();
                    if(month == 1){
                        const isLeap = year => new Date(year, 1, 29).getDate() === 29;
                        correction = (isLeap(dtemp.getFullYear()) ? -1 : -2);
                    }else if(array_31.includes(month)){
                        correction = 1
                        if(month == 9){
                            correction += 1/24;
                        }else if (month == 2){
                            correction -= 1/24;
                        }
                    }

                    correction_totale += correction;
                    dtemp = new Date(dtemp.setMonth(dtemp.getMonth()+header.offset));
                }

                array_return[i] = correction_totale;

            }
        }else if(unit == 'year'){
            for(let i=0; i<columnCount; i++){
                let correction = 0;
                if(dtemp.getFullYear()%4 == 0) correction = 1;
                array_return[i] = correction;
                dtemp = new Date(dtemp.setFullYear(dtemp.getFullYear()+header.offset));
            }
        }

        const promiseTemp = new Promise(resolve => {
            resolve(array_return)
        });
        return promiseTemp;

    }
</script>

<div class="column-header-row">
    {#each _headers as _header}
        <div class="column-header-cell" class:sticky={header.sticky} style="width:{_header.width}px" on:click="{() => dispatch('dateSelected', { from: _header.from, to: _header.to, unit: _header.unit })}">
            <div class="column-header-cell-label">{_header.label || 'N/A'}</div>
        </div>
    {/each}
</div>
<style>
    .column-header-row {
        box-sizing: border-box;
        white-space: nowrap;
        height: 32px;
    }

    .column-header-cell {
        display: inline-block;
        height: 100%;
        box-sizing: border-box;
        text-overflow: clip;
        /* vertical-align: top; */
        text-align: center;

        display: inline-flex;
        justify-content: center;
        align-items: center;
        font-size: 1em;    
        font-size: 14px;
        font-weight: 300;
        transition: background 0.2s;

        cursor: pointer;     
        user-select: none;

        border-right: #efefef 1px solid;
        border-bottom: #efefef 1px solid;
    }

    .column-header-cell:hover {
        background: #f9f9f9;
    }

    .column-header-cell.sticky > .column-header-cell-label {
        position: sticky;
        left: 1rem;
    }
</style>