<script>
  import { blocks } from '$lib/blocks';
  import Block from './Block.svelte';
  import { draggable } from '@neodrag/svelte';
  import { onMount } from 'svelte';

  // 9x9 grid
  let board = Array(9).fill().map(() => Array(9).fill(null));

  let boardElement;
  let cursorPosition = { x: 0, y: 0 };
  let previewShape = null;
  let previewPosition = { x: 0, y: 0 };
  let hoveredCell = { x: null, y: null };
  
  let shadowBlock = null;
  let previewColor = null;

  function getCellFromCursor() {
    const boardRect = boardElement.getBoundingClientRect();
    const x = Math.floor((cursorPosition.x - boardRect.left) / 44);
    const y = Math.floor((cursorPosition.y - boardRect.top) / 44);
    return { x, y };
  }

  function handleMouseMove(event) {
    // Use the cursor position to decide where to place the shape
    cursorPosition = { x: event.clientX, y: event.clientY };
    hoveredCell = getCellFromCursor();
  }

  function handleBlockDrop(event) {
    const { shape, color } = event.detail;
    console.log('Block dropped with shape:', shape);

    // Clear preview before placing the block
    if (previewShape != null) {
      for (let i = 0; i < previewShape.length; i++) {
        for (let j = 0; j < previewShape[i].length; j++) {
          if (previewShape[i][j] && !board[previewPosition.y + i][previewPosition.x + j]?.isPermanent) {
            board[previewPosition.y + i][previewPosition.x + j] = null;
          }
        }
      }
    }

    // Convert cursor position to board coordinates
    const boardRect = boardElement.getBoundingClientRect();
    const boardX = Math.floor((cursorPosition.x - boardRect.left) / 44);
    const boardY = Math.floor((cursorPosition.y - boardRect.top) / 44);

    console.log('Board coordinates:', boardX, boardY);

    if (canPlaceBlock(shape, boardX, boardY)) {
      placeBlock(shape, color, boardX, boardY);
    }

    previewShape = null; // Clear preview after drop
  }

  function handleTouchEnd() {
    if (previewShape && previewColor) {
      handleBlockDrop({ detail: { shape: previewShape, color: previewColor } });
    }
  }

  function PreviewBlock(event) {
    const { shape, color } = event.detail;
    previewShape = shape;
    previewColor = color;

    // Convert cursor position to board coordinates
    const boardRect = boardElement.getBoundingClientRect();
    const boardX = Math.floor((cursorPosition.x - boardRect.left) / 44);
    const boardY = Math.floor((cursorPosition.y - boardRect.top) / 44);

    if (canPlaceBlock(shape, boardX, boardY)) {
      placePreview(shape, color, boardX, boardY);
    }
    else {
      //clear preview
      for (let i = 0; i < previewShape.length; i++) {
        for (let j = 0; j < previewShape[i].length; j++) {
          if (previewShape[i][j] && !board[previewPosition.y + i][previewPosition.x + j]?.isPermanent) {
            board[previewPosition.y + i][previewPosition.x + j] = null;
          }
        }
      }
    }

  }

  function canPlaceBlock(shape, x, y) {
    // Check if the block can be placed at the given coordinates
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] && (x + j >= 9 || y + i >= 9 || board[y + i][x + j])) {
          return false;
        }
      }
    }
    return true;
  }

  function placeBlock(shape, color, x, y) {
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          board[y + i][x + j] = { color, isPermanent: true };
        }
      }
    }
  }

  function placePreview(shape, color, x, y) {
    // Only clear the previous preview if the position has changed
    if (previewShape != null && (previewPosition.x !== x || previewPosition.y !== y)) {
      for (let i = 0; i < previewShape.length; i++) {
        for (let j = 0; j < previewShape[i].length; j++) {
          if (previewShape[i][j] && !board[previewPosition.y + i][previewPosition.x + j]?.isPermanent) {
            board[previewPosition.y + i][previewPosition.x + j] = null;
          }
        }
      }
    }

    // Place the block on the board temporarily
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          board[y + i][x + j] = { color, isPermanent: false };
        }
      }
    }

    // Update preview position
    previewPosition = { x, y };
  }

  function handleBlockDrag(event) {
    previewShape = event.detail.shape;
    previewColor = event.detail.color;
    shadowBlock = { ...event.detail, isPreview: true };
  }

  function handleBlockDragging(event) {
    const { shape, color, position } = event.detail;
    previewShape = shape;
    previewColor = color;
    cursorPosition = position;
  }

  function onNeodrag(event) {
    const boardRect = boardElement.getBoundingClientRect();
    cursorPosition = {
      x: event.detail.clientX || event.detail.x + boardRect.left,
      y: event.detail.clientY || event.detail.y + boardRect.top
    };
    
    // Update preview position based on cursor
    previewPosition = {
      x: Math.floor((cursorPosition.x - boardRect.left) / 44),
      y: Math.floor((cursorPosition.y - boardRect.top) / 44)
    };
  }

  onMount(() => {
    shadowBlock = null;
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex justify-center mt-28" on:mousemove={handleMouseMove} on:touchend={handleTouchEnd}>
  <div class="flex flex-col">
    <div 
      bind:this={boardElement} 
      class="grid grid-cols-9 w-96 h-96 border border-gray-300 rounded-lg relative"
      on:neodrag={onNeodrag}
    >
      {#each board as row, rowIndex}
        {#each row as cell, colIndex}
          <div
            class="w-11 h-11 border zborder-gray-300 flex items-center justify-center { (rowIndex + colIndex) % 2 === 0 ? 'bg-gray-100' : 'bg-white' } {hoveredCell.x === colIndex && hoveredCell.y === rowIndex ? 'bg-gray-300' : ''}"
            style="background-color: {cell ? cell.color : 'transparent'}"
          >
          </div>
        {/each}
      {/each}
    </div>
    <div class="flex flex-wrap gap-4 mt-8 items-center justify-center bg-gray-100 p-4 rounded-lg shadow-lg"> 
        {#each blocks as block}
          <Block color={block.color} shape={block.shape} on:blockdrop={handleBlockDrop} on:neodrag={handleBlockDrag} on:blockdrag={handleBlockDragging} on:PreviewBlock={PreviewBlock} />
        {/each}
    </div>
  </div>
</div>
