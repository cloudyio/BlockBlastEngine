// src/lib/blocks.js

export const colors = ['#BF1A2F', '#3D3B8E', '#F3A738', '#306B34', '#FAA4BD'];

export interface BlockType {
  id: number;
  shapes: number[][][]; // Array of shapes for each rotation
  color?: string;
}

export const blocks: BlockType[] = [
  {
    id: 1,
    shapes: [
      [
        [1, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 1, 0],
        [1, 1, 1]
      ],
      [
        [1, 1, 1],
        [0, 1, 0]
      ]
    ]
  },
  {
    id: 2,
    shapes: [
      [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ]
    ]
  },
  {
    id: 3,
    shapes: [
      [
        [1, 1, 1],
        [1, 1, 1]
      ],
      [
        [1, 1],
        [1, 1],
        [1, 1]
      ]
    ]
  },
  {
    id: 4,
    shapes: [
      [
        [1, 0],
        [1, 0],
        [1, 1]
      ],
      [
        [1, 1, 1],
        [1, 0, 0]
      ],
      [
        [1, 1],
        [0, 1],
        [0, 1]
      ],
      [
        [0, 0, 1],
        [1, 1, 1]
      ]
    ]
  },
  {
    id: 5,
    shapes: [
      [
        [1, 1],
        [1, 1]
      ]
    ]
  },
  {
    id: 6,
    shapes: [
      [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 0]
      ],
      [
        [1, 1],
        [0, 1],
        [0, 1],
        [0, 1]
      ],
      [
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1]
      ],
      [
        [1],
        [1],
        [1],
        [1],
        [1]
      ]
    ]
  },
  {
    id: 7,
    shapes: [
      [
        [1],
        [1],
        [1],
        [1],
        [1]
      ],
      [
        [1, 1, 1, 1, 1]
      ]
    ]
  },
  {
    id: 8,
    shapes: [
      [
        [0, 1, 0],
        [1, 1, 1]
      ],
      [
        [1, 0],
        [1, 1],
        [1, 0]
      ],
      [
        [1, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 1],
        [1, 1],
        [0, 1]
      ]
    ]
  },
  {
    id: 9,
    shapes: [
      [
        [1, 0],
        [1, 1]
      ],
      [
        [1, 1],
        [0, 1]
      ]
    ]
  }
];
