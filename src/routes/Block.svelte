<script>
  export let color;
  export let shape;
  export let isPreview = false; // Keep the preview prop

  import { draggable } from '@neodrag/svelte';
  import { onMount, createEventDispatcher } from 'svelte';

  let position = { x: 0, y: 0 };
  const dispatch = createEventDispatcher();

  onMount(() => {
    position = { x: 0, y: 0 };
  });

  function handleDragEnd(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch('blockdrop', { shape, color, x: rect.left, y: rect.top });
    position = { x: 0, y: 0 };
  }

  function handleDragStart(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    position.x = e.detail.startX - rect.left;
    position.y = e.detail.startY - rect.top;
  }

  function handleDragging(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch('PreviewBlock', { shape, color, x: rect.left, y: rect.top });
  }
</script>

<style>
  .block {
    touch-action: none;
    user-select: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .block-row {
    display: flex;
    gap: 2px;
  }
  .block-cell {
    width: 36px;
    height: 36px;
  }
  .block-cell.filled {
    border: 1px solid #333;
  }
</style>

<div
  class="block"
  use:draggable={{ position, axis: 'both', relativeTo: 'parent', pointerTypes: ['mouse', 'touch'] }}
  on:neodrag:start={handleDragStart}
  on:neodrag={handleDragging}
  on:neodrag:end={handleDragEnd}
  class:is-preview={isPreview}
>
  {#each shape as row}
    <div class="block-row">
      {#each row as cell}
        <div class="block-cell {cell ? 'filled' : ''}" style="background-color: {cell ? (isPreview ? 'rgba(0, 0, 0, 0.2)' : color) : 'transparent'};"></div>
      {/each}
    </div>
  {/each}
</div>

