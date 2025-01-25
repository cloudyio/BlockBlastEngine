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
    console.log('Dragging stopped', e);
    // Only dispatch shape, ignore e.detail
    dispatch('blockdrop', { shape, color });
    position = { x: 0, y: 0 };
  }

  function handleDragStart(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    // Place the center of the block at the mouse cursor
    position.x = e.detail.startX - rect.left - rect.width / 2;
    position.y = e.detail.startY - rect.top - rect.height / 2;
  }

  function handleDragging(e) {
    console.log('Dragging', e);
    dispatch('PreviewBlock', { shape, color });
  }
</script>

<div
  style="touch-action: none; user-select: none;"
  use:draggable={{ position, axis: 'both', relativeTo: 'parent', pointerTypes: ['mouse', 'touch'] }}
  on:neodrag:start={handleDragStart}
  on:neodrag={handleDragging}
  on:neodrag:end={handleDragEnd}
  class:is-preview={isPreview}
>
  {#each shape as row}
    <div class="flex">
      {#each row as cell}
        <div class={`w-9 h-9 ${cell ? 'border border-gray-900' : ''}`} style="background-color: {cell ? color : 'transparent'};"></div>
      {/each}
    </div>
  {/each}
</div>

