<script>
  import { blocks, colors } from '$lib/blocks';
  import Block from './Block.svelte';
  import { draggable } from '@neodrag/svelte';
  import { onMount } from 'svelte';

  // 8x8 grid
  let board = Array(8).fill().map(() => Array(8).fill(null));

  let boardElement;
  let cursorPosition = { x: 0, y: 0 };
  let previewShape = null;
  let previewPosition = { x: 0, y: 0 };
  let hoveredCell = { x: null, y: null };
  
  let shadowBlock = null;
  let previewColor = null;
  let usedBlocks = new Set(); // Add this to track used blocks
  let roundCounter = 0; // Add round counter

  // Randomize hand with 3 blocks
  let handBlocks = [];

  function getRandomBlocks() {
    const shuffled = blocks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(block => ({
      ...block,
      color: colors[Math.floor(Math.random() * colors.length)],
      position: { x: 0, y: 0 } // Reset position
    }));
  }

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

    // Ensure coordinates are within bounds
    if (boardX < 0 || boardX >= 8 || boardY < 0 || boardY >= 8) {
      console.warn('Block dropped out of bounds:', boardX, boardY);
      return;
    }

    const wasPlaced = canPlaceBlock(shape, boardX, boardY);
    
    if (wasPlaced) {
      placeBlock(shape, color, boardX, boardY);
      usedBlocks.add(event.detail.id);
      usedBlocks = usedBlocks;

      // Check if all blocks are used
      if (usedBlocks.size === handBlocks.length) {
        handBlocks = getRandomBlocks();
        usedBlocks.clear();
        roundCounter++; // Increment round counter
      }

      // Check and clear full rows and columns
      checkAndClearFullRowsAndColumns();
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
        if (shape[i][j] && (x + j >= 8 || x + j < 0 || y + i >= 8 || (board[y + i][x + j] && board[y + i][x + j].isPermanent))) {
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
          if (y + i < 0 || y + i > 7 || x + j < 0 || x + j > 7) continue;
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
          if (previewPosition.y + i < 0 || previewPosition.y + i > 7 || previewPosition.x + j < 0 || previewPosition.x + j > 7) continue;
          board[previewPosition.y + i][previewPosition.x + j] = null;
        }
      }
    }
  }

  function checkAndClearFullRowsAndColumns() {
    for (let y = 0; y < 8; y++) {
      if (board[y].every(cell => cell && cell.isPermanent)) {
        clearRow(y);
      }
    }

    for (let x = 0; x < 8; x++) {
      if (board.every(row => row[x] && row[x].isPermanent)) {
        clearColumn(x);
      }
    }
  }

  function clearRow(row) {
    for (let x = 0; x < 8; x++) {
      board[row][x] = null;
    }
  }

  function clearColumn(col) {
    for (let y = 0; y < 8; y++) {
      board[y][col] = null;
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

    // Ensure preview position is within bounds
    if (previewPosition.x >= 0 && previewPosition.x < 8 && previewPosition.y >= 0 && previewPosition.y < 8) {
      const { shape, color } = shadowBlock;
      placePreview(shape, color, previewPosition.x, previewPosition.y);
    } else {
      clearPreview();
    }
  }

  function clearEmptyShadow() {
    if (!shadowBlock) {
      clearPreview();
    }
  }

  onMount(() => {
    shadowBlock = null;
    setInterval(clearEmptyShadow, 1000); // Check every second
    handBlocks = getRandomBlocks();
  });
</script>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(8, 44px);
    grid-template-rows: repeat(8, 44px);
    gap: 2px;
    border: 2px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add shadow */
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
  .hand-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 16px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add shadow */
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
    <div class="hand-container mt-8">
      {#each handBlocks as block}
        <Block 
          color={block.color} 
          shape={block.shape} 
          id={block.id}
          used={usedBlocks.has(block.id)}
          on:blockdrop={handleBlockDrop} 
          on:neodrag={handleBlockDrag} 
          on:blockdrag={handleBlockDragging} 
          on:PreviewBlock={PreviewBlock} 
        />
      {/each}
    </div>
    <div class="mt-4 text-lg font-bold">
      Round: {roundCounter}
    </div>
  </div>
</div>
