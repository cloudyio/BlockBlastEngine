<script>
  import { blocks, colors, rotateBlock } from '$lib/blocks';
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
  let comboCounter = 0; // Add combo counter
  let score = 0; // Add score
  let totalCleared = 0; // Track total cleared rows/columns
  let gameOver = false; // Track game over state
  let showGrid = true; // Add state for grid visibility
  let highScore = 0; // Add high score

  // Randomize hand with 3 blocks
  let handBlocks = [];

  let placeSound, clearSound, multiplierSound, lostSound;
  if (typeof window !== 'undefined') {
    placeSound = new Audio('/place.mp3'); // Load the place sound
    clearSound = new Audio('/clear.mp3'); // Load the clear sound
    multiplierSound = new Audio('/multiplier.mp3'); // Load the multiplier sound
    lostSound = new Audio('/lost.mp3'); // Load the lost sound

    // Load high score from local storage
    const storedHighScore = localStorage.getItem('highScore');
    if (storedHighScore) {
      highScore = parseInt(storedHighScore, 10);
    }
  }

  function getRandomBlocks() {
    let newHand;
    do {
      const shuffled = blocks.sort(() => 0.5 - Math.random());
      newHand = shuffled.slice(0, 3).map(block => ({
        ...block,
        shape: rotateBlock(block.shape, Math.floor(Math.random() * 4)), // Apply random rotation
        color: colors[Math.floor(Math.random() * colors.length)],
        position: { x: 0, y: 0 } // Reset position
      }));
    } while (!canAnyBlockBePlaced(newHand));
    return newHand;
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

      // Play the place sound
      if (placeSound) {
        placeSound.play();
      }

      // Increment score for each block placed
      score += shape.flat().filter(Boolean).length;

      // Check and clear full rows and columns
      const cleared = checkAndClearFullRowsAndColumns();
      if (cleared > 0) {
        totalCleared += cleared;
        comboCounter = Math.floor(totalCleared / 2); // Update combo counter based on total cleared
        score += comboCounter * 10; // Increase score with multiplier
        if (comboCounter > 1 && multiplierSound) {
          multiplierSound.play(); // Play multiplier sound
        }
      } else {
        comboCounter = 0; // Reset combo counter if no rows/columns cleared
      }

      // Check if all blocks are used
      if (usedBlocks.size === handBlocks.length) {
        handBlocks = getRandomBlocks();
        usedBlocks.clear();
        roundCounter++; // Increment round counter
      }

      // Check if the game should end after a delay to allow for clearing animations
      setTimeout(() => {
        if (!canAnyBlockBePlaced()) {
          gameOver = true;
          if (score > highScore) {
            highScore = score; // Update high score
            localStorage.setItem('highScore', highScore); // Save high score to local storage
          }
          if (lostSound) {
            lostSound.play(); // Play the lost sound
          }
        }
      }, 800); // Match the duration of the clearing animation
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
    if (!previewShape) return; // Add null check for previewShape
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
    let cleared = 0;
    for (let y = 0; y < 8; y++) {
      if (board[y].every(cell => cell && cell.isPermanent)) {
        clearRow(y);
        cleared++;
      }
    }

    for (let x = 0; x < 8; x++) {
      if (board.every(row => row[x] && row[x].isPermanent)) {
        clearColumn(x);
        cleared++;
      }
    }
    return cleared;
  }

  function clearRow(row) {
    for (let x = 0; x < 8; x++) {
      if (board[row][x]) {
        board[row][x].clearing = true;
        board[row][x].delay = x * 0.1; // Add delay for staggered animation
      }
    }
    // Play the clear sound
    if (clearSound) {
      clearSound.play();
    }
    setTimeout(() => {
      for (let x = 0; x < 8; x++) {
        board[row][x] = null;
      }
    }, 800); // Match the duration of the animation with delay
  }

  function clearColumn(col) {
    for (let y = 0; y < 8; y++) {
      if (board[y][col]) {
        board[y][col].clearing = true;
        board[y][col].delay = y * 0.1; // Add delay for staggered animation
      }
    }
    // Play the clear sound
    if (clearSound) {
      clearSound.play();
    }
    setTimeout(() => {
      for (let y = 0; y < 8; y++) {
        board[y][col] = null;
      }
    }, 800); // Match the duration of the animation with delay
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

  function canAnyBlockBePlaced(hand = handBlocks) {
    return hand.some(block => {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (canPlaceBlock(block.shape, x, y)) {
            return true;
          }
        }
      }
      return false;
    });
  }

  function checkGameOver() {
    if (!canAnyBlockBePlaced()) {
      gameOver = true;
      if (score > highScore) {
        highScore = score; // Update high score
        localStorage.setItem('highScore', highScore); // Save high score to local storage
      }
      if (lostSound) {
        lostSound.play(); // Play the lost sound
      }
    }
  }

  function resetGame() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    handBlocks = getRandomBlocks();
    usedBlocks.clear();
    roundCounter = 0;
    comboCounter = 0;
    score = 0;
    totalCleared = 0;
    gameOver = false;
    checkGameOver(); // Ensure game over is checked on reset
  }

  function toggleGrid() {
    showGrid = !showGrid;
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--grid-gap', showGrid ? '2px' : '0px');
    }
  }

  function closeGameOverMenu() {
    gameOver = false;
  }

  onMount(() => {
    shadowBlock = null;
    setInterval(clearEmptyShadow, 1000); // Check every second
    handBlocks = getRandomBlocks();
    checkGameOver(); // Ensure game over is checked on mount
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--grid-gap', showGrid ? '2px' : '0px');
    }
  });

</script>

<style>
  body {
    overflow: hidden; /* Prevent scrolling */
  }
  .board-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh; /* Full viewport height */
  }
  .board {
    display: grid;
    grid-template-columns: repeat(8, 44px);
    gap: var(--grid-gap); /* Toggle grid gap */
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
    gap: 16px; /* Increase gap between blocks */
    padding: 16px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add shadow */
    justify-content: center; /* Center align blocks */
  }
  @keyframes clearRowColumn {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.5);
      opacity: 0;
    }
  }
  .clearing {
    animation: clearRowColumn 0.5s ease-in-out;
    animation-fill-mode: forwards;
  }
  .combo-container {
    height: 24px; /* Fixed height to prevent layout shift */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .game-over-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }
  .restart-button {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1000;
  }
  .restart-button:hover {
    background-color: #45a049;
  }
  .high-score {
    position: fixed;
    top: 20px;
    left: 20px;
    padding: 8px 16px;
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    z-index: 1000;
  }
</style>

<div class="board-container" on:mousemove={handleMouseMove} on:touchend={handleTouchEnd}>
  <!-- Add Restart Button -->
  <button class="restart-button" on:click={resetGame}>
    Restart
  </button>
  
  <!-- Add High Score Display -->
  <div class="high-score">
    High Score: {highScore}
  </div>
  
  <div class="flex flex-col items-center">
    <div class="mt-4 text-lg font-bold">
      Score: {score}
    </div>
    <div class="combo-container">
      {#if comboCounter > 1}
        <div class="text-lg font-bold text-red-500">
          Combo x{comboCounter}!
        </div>
      {/if}
    </div>

    <div bind:this={boardElement} class="board mt-4" on:neodrag={onNeodrag}>
      {#each board as row, rowIndex}
        {#each row as cell, colIndex}
          <div
            class="board-cell {cell && cell.clearing ? 'clearing' : ''}"
            style="background-color: {cell ? cell.color : 'transparent'}; animation-delay: {cell && cell.clearing ? cell.delay + 's' : '0s'}"
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

{#if gameOver}
  <div class="overlay"></div>
  <div class="game-over-popup">
    <div class="text-lg font-bold">Game Over</div>
    <div class="mt-4">High Score: {score}</div>
    <!-- Modify View Grid Button to close the menu -->
    <button class="mt-4 p-2 bg-green-500 text-white rounded" on:click={closeGameOverMenu}>
      View Grid
    </button>
    <button class="mt-4 p-2 bg-blue-500 text-white rounded" on:click={resetGame}>
      Retry
    </button>
  </div>
{/if}
