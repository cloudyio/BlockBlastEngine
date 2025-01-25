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
    const { shape, color, x, y } = event.detail;
    const boardRect = boardElement.getBoundingClientRect();
    const boardX = Math.floor((x - boardRect.left) / 44);
    const boardY = Math.floor((y - boardRect.top) / 44);
    if (canPlaceBlock(shape, boardX, boardY)) {
      placeBlock(shape, color, boardX, boardY);
    }
    previewShape = null;
  }

  function handleTouchEnd() {
    if (previewShape && previewColor) {
      handleBlockDrop({ detail: { shape: previewShape, color: previewColor } });
    }
  }

  function PreviewBlock(event) {
    const { shape, color, x, y } = event.detail;
    previewShape = shape;
    previewColor = color;

    const boardRect = boardElement.getBoundingClientRect();
    const boardX = Math.floor((x - boardRect.left) / 44);
    const boardY = Math.floor((y - boardRect.top) / 44);

    if (canPlaceBlock(shape, boardX, boardY)) {
      placePreview(shape, color, boardX, boardY);
    } else {
      clearPreview();
    }
  }

  function canPlaceBlock(shape, x, y) {
    // Prevent NaN errors
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn('Invalid block coordinates:', x, y);
      return false;
    }
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] && (x + j >= 9 || x + j < 0 || y + i >= 9 || (board[y + i][x + j] && board[y + i][x + j].isPermanent))) {
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
      clearPreview();
    }

    // Place the block on the board temporarily
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          // Skip if out of bounds
          if (y + i < 0 || y + i > 8 || x + j < 0 || x + j > 8) continue;
          board[y + i][x + j] = { color: `rgba(${hexToRgb(color)}, 0.2)`, isPermanent: false, isPreview: true };
        }
      }
    }

    // Update preview position
    previewPosition = { x, y };
  }

  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }

  function clearPreview() {
    for (let i = 0; i < previewShape.length; i++) {
      for (let j = 0; j < previewShape[i].length; j++) {
        if (previewShape[i][j] && !board[previewPosition.y + i][previewPosition.x + j]?.isPermanent) {
          // Skip if out of bounds
          if (previewPosition.y + i < 0 || previewPosition.y + i > 8 || previewPosition.x + j < 0 || previewPosition.x + j > 8) continue;
          board[previewPosition.y + i][previewPosition.x + j] = null;
        }
      }
    }
  }

  function handleBlockDrag(event) {
    previewShape = event.detail.shape;
    previewColor = event.detail.color;
    shadowBlock = { ...event.detail, isPreview: true };
  }

  function handleBlockDragging(event) {
    // No need for cursorPosition updates
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

    // Hide preview if dragged off the grid bounds
    if (previewPosition.x < 0 || previewPosition.x >= 9 || previewPosition.y < 0 || previewPosition.y >= 9) {
      clearPreview();
    }
  }

  onMount(() => {
    shadowBlock = null;
  });
</script>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(9, 44px);
    grid-template-rows: repeat(9, 44px);
    gap: 2px;
    border: 2px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  .board-cell {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
  }
  .board-cell:nth-child(odd) {
    background-color: #f0f0f0;
  }
  .board-cell:nth-child(even) {
    background-color: #fff;
  }
</style>

<div class="flex justify-center mt-28" on:mousemove={handleMouseMove} on:touchend={handleTouchEnd}>
  <div class="flex flex-col items-center">
    <div bind:this={boardElement} class="board" on:neodrag={onNeodrag}>
      {#each board as row, rowIndex}
        {#each row as cell, colIndex}
          <div
            class="board-cell"
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
