import { readFileSync } from 'fs';
import { join } from 'path';

type Grid = readonly string[];
type Position = readonly [number, number];
type Cell = '@' | '.';

const parseInput = (input: string): Grid => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter((line): line is string => line.length > 0);
};

const countNeighbors = (grid: Grid, row: number, col: number): number => {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0]!.length && grid[r]?.[c] === '@') {
        count++;
      }
    }
  }
  return count;
};

const isAccessible = (grid: Grid, row: number, col: number): boolean => {
  return grid[row]?.[col] === '@' && countNeighbors(grid, row, col) < 4;
};

// Part 1: Count how many rolls of paper can be accessed by a forklift
const solvePart1 = (grid: Grid): number => {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0]!.length; col++) {
      if (isAccessible(grid, row, col)) {
        count++;
      }
    }
  }
  return count;
};

// Part 2: Count total rolls that can be removed iteratively
const solvePart2 = (grid: Grid): number => {
  const workingGrid: Cell[][] = grid.map(row => row.split('') as Cell[]);
  let totalRemoved = 0;

  while (true) {
    const toRemove: Position[] = [];
    const gridAsStrings = workingGrid.map(r => r.join(''));
    
    for (let row = 0; row < workingGrid.length; row++) {
      for (let col = 0; col < workingGrid[0]!.length; col++) {
        if (isAccessible(gridAsStrings, row, col)) {
          toRemove.push([row, col]);
        }
      }
    }
    
    if (toRemove.length === 0) break;
    
    for (const [row, col] of toRemove) {
      workingGrid[row]![col] = '.';
      totalRemoved++;
    }
  }

  return totalRemoved;
};

const rawInput = readFileSync(join(__dirname, 'day4.txt'), 'utf-8');
const grid = parseInput(rawInput);

const resultPart1 = solvePart1(grid);
const resultPart2 = solvePart2(grid);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

