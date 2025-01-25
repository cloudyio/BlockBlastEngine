// src/lib/blocks.js

export const colors = ['#BF1A2F', '#3D3B8E', '#F3A738', '#306B34', '#FAA4BD'];

export const blocks = [
  {
    id: 1,
    shape: [
      [1, 1, 1],
      [0, 1, 0]
    ]
  },
  {
    id: 2,
    shape: [
      [1, 1],
      [1, 1]
    ]
  },
  {
    id: 3,
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ]
  },
  {
    id: 4,
    shape: [
      [1, 1, 1, 1]
    ]
  },
  {
    id: 5,
    shape: [
      [1, 1, 1],
      [1, 0, 0]
    ]
  },
  {
    id: 6,
    shape: [
      [1, 1],
      [0, 1],
      [0, 1]
    ]
  },
  {
    id: 7,
    shape: [
      [1, 1, 1],
      [0, 0, 1]
    ]
  },
  {
    id: 8,
    shape: [
      [1, 1],
      [1, 0],
      [1, 0]
    ]
  },
  {
    id: 9,
    shape: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0]
    ]
  }
];

export function rotateBlock(block, times = 1) {
  let rotated = block;
  for (let i = 0; i < times; i++) {
    rotated = rotated[0].map((_, index) => rotated.map(row => row[index]).reverse());
  }
  return rotated;
}
