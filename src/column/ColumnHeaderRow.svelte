<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';

    const dispatch = createEventDispatcher();

    import type { SvelteGanttDateAdapter } from '../utils/date';
    import { startOf, getDuration } from '../utils/date';

    const { from, to, width } = getContext('dimensions');
    const { dateAdapter }: { dateAdapter: SvelteGanttDateAdapter } = getContext('options');

    export let header;
    export let baseWidth;
    export let baseDuration;

    export let columnWidth;
    $: {
        header.duration = getDuration(header.unit, header.offset);
        const duration = header.duration;
        const ratio = duration / baseDuration;
        columnWidth = baseWidth * ratio;
    }

    export let columnCount;
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
        let headerTime = startOf($from, header.unit);
        
        // /!\ Temporary : Corrects labels of headers when unit == month
        if(header.unit == 'month'){
            defineCorrections(headerTime, columnCount)
            .then((res) => {
                let array_corrections = res;
                for(let i = 0; i < columnCount; i++){
                    headers.push({
                        width: Math.min(columnWidth, $width), 
                        label: dateAdapter.format(headerTime, header.format),
                        from: headerTime,
                        to: headerTime + header.duration,
                        unit: header.unit
                    });
                    const correction_temp = (24 * 60 * 60 * 1000 * array_corrections[i]);    
                    headerTime += header.duration + correction_temp
                }
                _headers = headers;
            })
        }else{
            for(let i = 0; i < columnCount; i++){
                headers.push({
                    width: Math.min(columnWidth, $width), 
                    label: dateAdapter.format(headerTime, header.format),
                    from: headerTime,
                    to: headerTime + header.duration,
                    unit: header.unit
                });
                headerTime += header.duration; 
            }
            _headers = headers;
        }
    }


    function defineCorrections(headerTime, columnCount){
        let dtemp = new Date(headerTime);
        let array_return = [];
        let array_31 = [0,2,4,6,7,9,11];
        for(let i=0; i<columnCount; i++){
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

            array_return[i] = correction;
            dtemp = new Date(dtemp.setMonth(dtemp.getMonth()+1));
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