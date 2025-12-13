import { readFileSync } from 'fs';
import { join } from 'path';

type Shape = readonly boolean[][];
type Region = {
  width: number;
  height: number;
  counts: readonly number[];
};

type ParsedInput = {
  shapes: readonly Shape[];
  regions: readonly Region[];
};

const parseInput = (input: string): ParsedInput => {
  const lines = input.split('\n');
  const shapes: Shape[] = [];
  const regions: Region[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim();
    if (!line) {
      i++;
      continue;
    }

    if (/^\d+x\d+:/.test(line)) {
      const match = line.match(/^(\d+)x(\d+):\s*(.+)$/);
      if (match) {
        regions.push({
          width: parseInt(match[1]!, 10),
          height: parseInt(match[2]!, 10),
          counts: match[3]!.split(/\s+/).map(Number),
        });
      }
      i++;
    } else if (line.includes(':') && !line.includes('x')) {
      const shapeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const next = lines[i]?.trim();
        if (!next || /^\d+x\d+:/.test(next) || (next.includes(':') && !next.includes('x'))) {
          break;
        }
        shapeLines.push(next);
        i++;
      }
      if (shapeLines.length > 0) {
        shapes.push(shapeLines.map(row => row.split('').map(ch => ch === '#')));
      }
    } else {
      i++;
    }
  }

  return { shapes, regions };
};

const generateVariants = (shape: Shape): readonly Shape[] => {
  const variants = new Set<string>();
  const toString = (s: Shape): string =>
    s.map(row => row.map(c => c ? '#' : '.').join('')).join('\n');
  const rotate90 = (s: Shape): Shape => {
    const rows = s.length;
    const cols = s[0]?.length ?? 0;
    return Array.from({ length: cols }, (_, c) =>
      Array.from({ length: rows }, (_, r) => s[rows - 1 - r]?.[c] ?? false),
    );
  };
  const flipH = (s: Shape): Shape => s.map(row => [...row].reverse());

  let current = shape;
  for (let i = 0; i < 4; i++) {
    variants.add(toString(current));
    variants.add(toString(flipH(current)));
    current = rotate90(current);
  }

  return Array.from(variants).map(str =>
    str.split('\n').map(row => row.split('').map(ch => ch === '#')),
  );
};

const canPlace = (
  grid: boolean[][],
  shape: Shape,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean => {
  const sh = shape.length;
  const sw = shape[0]?.length ?? 0;
  if (x + sw > w || y + sh > h) return false;
  for (let sy = 0; sy < sh; sy++) {
    for (let sx = 0; sx < sw; sx++) {
      if (shape[sy]?.[sx] && grid[y + sy]?.[x + sx]) return false;
    }
  }
  return true;
};

const toggleShape = (grid: boolean[][], shape: Shape, x: number, y: number, place: boolean): void => {
  const sh = shape.length;
  const sw = shape[0]?.length ?? 0;
  for (let sy = 0; sy < sh; sy++) {
    for (let sx = 0; sx < sw; sx++) {
      if (shape[sy]?.[sx] && grid[y + sy]) {
        grid[y + sy]![x + sx] = place;
      }
    }
  }
};

const canPack = (region: Region, shapes: readonly Shape[]): boolean => {
  // area check
  let totalArea = 0;
  for (let i = 0; i < shapes.length; i++) {
    const count = region.counts[i] ?? 0;
    if (count > 0 && shapes[i]) {
      totalArea += shapes[i]!.flat().filter(x => x).length * count;
    }
  }
  if (totalArea > region.width * region.height) return false;

  const grid: boolean[][] = Array(region.height).fill(null).map(() => Array(region.width).fill(false));
  const requirements: Array<{ count: number; variants: readonly Shape[] }> = [];

  for (let i = 0; i < shapes.length; i++) {
    const count = region.counts[i] ?? 0;
    if (count > 0 && shapes[i]) {
      requirements.push({ count, variants: generateVariants(shapes[i]!) });
    }
  }

  requirements.sort((a, b) => {
    const sizeA = a.variants[0]?.flat().filter(x => x).length ?? 0;
    const sizeB = b.variants[0]?.flat().filter(x => x).length ?? 0;
    return sizeB - sizeA;
  });

  const placed = new Array(requirements.length).fill(0);

  const dfs = (reqIdx: number): boolean => {
    if (reqIdx >= requirements.length) return true;
    const req = requirements[reqIdx];
    if (!req || placed[reqIdx]! >= req.count) return dfs(reqIdx + 1);

    for (const variant of req.variants) {
      for (let y = 0; y < region.height; y++) {
        for (let x = 0; x < region.width; x++) {
          if (canPlace(grid, variant, x, y, region.width, region.height)) {
            toggleShape(grid, variant, x, y, true);
            placed[reqIdx] = (placed[reqIdx] ?? 0) + 1;
            if (dfs(reqIdx)) return true;
            placed[reqIdx] = (placed[reqIdx] ?? 0) - 1;
            toggleShape(grid, variant, x, y, false);
          }
        }
      }
    }
    return false;
  };

  return dfs(0);
};

// Part 1: Count how many regions can be packed with the given shapes
const solve = (input: ParsedInput): number => {
  let count = 0;
  for (const region of input.regions) {
    if (canPack(region, input.shapes)) {
      count++;
    }
  }
  return count;
};







const test = (): void => {
  const exampleInput = `0:
###
##.
##.

1:
###
##.
.##

2:
.##
###
##.

3:
##.
###
##.

4:
###
#..
###

5:
###
.#.
###

4x4: 0 0 0 0 2 0
12x5: 1 0 1 0 2 2
12x5: 1 0 1 0 3 2`;
  const parsedExample = parseInput(exampleInput);

  const result = solve(parsedExample);
  const expected = 2;
  console.log(`Expected: ${expected}`);
  console.log(`Result: ${result}`);
};

test();






const rawInput = readFileSync(join(__dirname, 'day12.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const result = solve(parsedInput);
console.log(`Part 1: ${result}`);

