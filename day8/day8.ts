import { readFileSync } from 'fs';
import { join } from 'path';

type Point = readonly [number, number, number];

type ParsedInput = readonly Point[];

const parseInput = (input: string): ParsedInput => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const [x, y, z] = line.split(',').map(Number);
      return [x, y, z] as Point;
    });
};

// Calculate squared distance
const distanceSquared = (p1: Point, p2: Point): number => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return dx * dx + dy * dy + dz * dz;
};

// Generate all pairs sorted by distance
const generateSortedPairs = (points: ParsedInput): Array<{ i: number; j: number; distSq: number }> => {
  const pairs: Array<{ i: number; j: number; distSq: number }> = [];
  
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      pairs.push({ i, j, distSq: distanceSquared(points[i]!, points[j]!) });
    }
  }
  
  pairs.sort((a, b) => a.distSq - b.distSq);
  return pairs;
};

class UnionFind {
  private parent: number[];
  private rank: number[];
  private componentCount: number;

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = Array(size).fill(0);
    this.componentCount = size;
  }

  find(n: number): number {
    if (this.parent[n] !== n) {
      this.parent[n] = this.find(this.parent[n]!);
    }
    return this.parent[n]!;
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) {
      return false;
    }
    
    if (this.rank[rootX]! < this.rank[rootY]!) {
      this.parent[rootX] = rootY;
    } else {
      this.parent[rootY] = rootX;
      if (this.rank[rootX]! === this.rank[rootY]!) {
        this.rank[rootX] = (this.rank[rootX] ?? 0) + 1;
      }
    }
    
    this.componentCount--;
    return true;
  }

  isConnected(): boolean {
    return this.componentCount === 1;
  }

  getComponentSizes(): readonly number[] {
    const sizes = new Map<number, number>();
    
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      sizes.set(root, (sizes.get(root) ?? 0) + 1);
    }
    
    return Array.from(sizes.values());
  }
}

// Part 1: Connect 1000 shortest pairs and multiply sizes of three largest circuits
const solvePart1 = (points: ParsedInput, numConnections: number = 1000): number => {
  const pairs = generateSortedPairs(points);
  const uf = new UnionFind(points.length);
  
  for (let i = 0; i < Math.min(numConnections, pairs.length); i++) {
    uf.union(pairs[i]!.i, pairs[i]!.j);
  }
  
  const sizes = [...uf.getComponentSizes()].sort((a, b) => b - a);
  
  // Multiply the three largest
  while (sizes.length < 3) {
    sizes.push(1);
  }
  
  return sizes[0]! * sizes[1]! * sizes[2]!;
};

// Part 2: Connect pairs until all boxes are in one circuit, return X coordinate product of last connection
const solvePart2 = (points: ParsedInput): number => {
  const pairs = generateSortedPairs(points);
  const uf = new UnionFind(points.length);
  
  for (const pair of pairs) {
    if (uf.union(pair.i, pair.j) && uf.isConnected()) {
      return points[pair.i]![0] * points[pair.j]![0];
    }
  }
  
  return 0;
};





// Test
const test = (): void => {
  const exampleInput = `162,817,812
57,618,57
906,360,560
592,479,940
352,342,300
466,668,158
542,29,236
431,825,988
739,650,466
52,470,668
216,146,977
819,987,18
117,168,530
805,96,715
346,949,466
970,615,88
941,993,340
862,61,35
984,92,344
425,690,689`;

  const parsedExample = parseInput(exampleInput);

  const resultPart1 = solvePart1(parsedExample, 10);
  const expectedPart1 = 40;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);
  
  const resultPart2 = solvePart2(parsedExample);
  const expectedPart2 = 25272;
  console.log(`Expected Part 2: ${expectedPart2}`);
  console.log(`Result Part 2: ${resultPart2}`);
};

test();



const rawInput = readFileSync(join(__dirname, 'day8.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(parsedInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

