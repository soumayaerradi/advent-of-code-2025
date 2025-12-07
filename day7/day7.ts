import { readFileSync } from 'fs';
import { join } from 'path';

type Grid = readonly string[];

const parseInput = (input: string): Grid => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter((line): line is string => line.length > 0);
};

// Part 1: Count how many times the tachyon beam is split
const solvePart1 = (grid: Grid): number => {
  const height = grid.length;
  if (height === 0) return 0;

  let startCol = -1;
  for (let row = 0; row < height; row++) {
    const col = grid[row]!.indexOf('S');
    if (col !== -1) {
      startCol = col;
      break;
    }
  }

  if (startCol === -1) return 0;

  const activeBeams = new Set<number>();
  activeBeams.add(startCol);

  let splitCount = 0;

  for (let row = 0; row < height - 1; row++) {
    const nextRow = row + 1;
    const nextActiveBeams = new Set<number>();

    for (const col of activeBeams) {
      const cell = grid[nextRow]?.[col];
      
      if (cell === '^') {
        splitCount++;
        
        if (col > 0) {
          nextActiveBeams.add(col - 1);
        }
        

        if (col < (grid[nextRow]?.length ?? 0) - 1) {
          nextActiveBeams.add(col + 1);
        }
      } else if (cell === '.' || cell === undefined) {
        // Beam continues straight down
        nextActiveBeams.add(col);
      }

    }

    activeBeams.clear();
    for (const col of nextActiveBeams) {
      activeBeams.add(col);
    }
  }

  return splitCount;
};

// Part 2: Count how many different timelines the particle ends up on
const solvePart2 = (grid: Grid): number => {
  const height = grid.length;
  if (height === 0) return 0;

  let startCol = -1;
  for (let row = 0; row < height; row++) {
    const col = grid[row]!.indexOf('S');
    if (col !== -1) {
      startCol = col;
      break;
    }
  }

  if (startCol === -1) return 0;

  // How many paths to each position at each row
  let pathCounts = new Map<number, number>();
  pathCounts.set(startCol, 1);

  for (let row = 0; row < height - 1; row++) {
    const nextRow = row + 1;
    const nextPathCounts = new Map<number, number>();

    // Each position in the current row
    for (const [col, count] of pathCounts) {
      const cell = grid[nextRow]?.[col];
      
      if (cell === '^') {
        // Left and right
        if (col > 0) {
          const leftCol = col - 1;
          nextPathCounts.set(leftCol, (nextPathCounts.get(leftCol) ?? 0) + count);
        }
        if (col < (grid[nextRow]?.length ?? 0) - 1) {
          const rightCol = col + 1;
          nextPathCounts.set(rightCol, (nextPathCounts.get(rightCol) ?? 0) + count);
        }
      } else if (cell === '.' || cell === undefined) {
        // Continue straight down
        nextPathCounts.set(col, (nextPathCounts.get(col) ?? 0) + count);
      }
    }

    pathCounts = nextPathCounts;
  }


  let totalTimelines = 0;
  for (const count of pathCounts.values()) {
    totalTimelines += count;
  }
  return totalTimelines;
};




// Test
const exampleInput = `.......S.......
...............
.......^.......
...............
......^.^......
...............
.....^.^.^.....
...............
....^.^...^....
...............
...^.^...^.^...
...............
..^...^.....^..
...............
.^.^.^.^.^...^.
...............`;

const testPart2 = () => {
  const exampleGrid = parseInput(exampleInput);
  const resultPart2 = solvePart2(exampleGrid);
  const expectedPart2 = 40;
  console.log(`Expected: ${expectedPart2}`);
  console.log(`Result test: ${resultPart2}`);
};

testPart2();






const rawInput = readFileSync(join(__dirname, 'day7.txt'), 'utf-8');
const grid = parseInput(rawInput);

const resultPart1 = solvePart1(grid);
const resultPart2 = solvePart2(grid);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

