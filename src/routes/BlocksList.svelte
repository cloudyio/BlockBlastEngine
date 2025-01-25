<script>
    import { blocks } from '@/lib/blocks';
    import Block from './Block.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function handleBlockDrag(event) {
        dispatch('blockdrag', event.detail);
    }
</script>
  
<div class="flex flex-wrap gap-4">
    {#each blocks as block}
      <Block color={block.color} shape={block.shape} on:blockdrop on:blockdrag={handleBlockDrag} />
    {/each}
</div>
