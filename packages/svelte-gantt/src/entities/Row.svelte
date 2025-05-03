<script lang="ts">
  import { RowBuilder } from './row.builder';

  type Props = {
    builder: RowBuilder;
  }

  let { builder }: Props = $props();
</script>

<div {...builder.attrs}>
  {#if builder.row.model.contentHtml}
    {@html builder.row.model.contentHtml}
  {/if}
</div>

<style>
  [data-sg-row], .sg-row {
    position: relative;
    width: 100%;
    box-sizing: border-box;
  }
</style>
