import { readFileSync } from 'fs';
import { join } from 'path';

type Point = readonly [number, number];

type ParsedInput = readonly Point[];

const parseInput = (input: string): ParsedInput => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const [x, y] = line.split(',').map(Number);
      return [x, y] as Point;
    });
};

// Part 1: Find the largest rectangle using red tiles as opposite corners
const solvePart1 = (points: ParsedInput): number => {
  let maxArea = 0;

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const [x1, y1] = points[i]!;
      const [x2, y2] = points[j]!;

      const width = Math.abs(x2 - x1) + 1;
      const height = Math.abs(y2 - y1) + 1;
      const area = width * height;

      maxArea = Math.max(maxArea, area);
    }
  }

  return maxArea;
};

// Helper: Check which side of a line segment a point is on 
const whichSideOfLine = (lineStart: Point, lineEnd: Point, point: Point): number => {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const px = point[0] - lineStart[0];
  const py = point[1] - lineStart[1];

  const cross = dx * py - dy * px;
  if (cross < 0) return -1; // Right
  if (cross > 0) return 1;  // Left
  return 0; // On the line
};

// Helper: Check if point is on segment
const isPointOnSegment = (segStart: Point, segEnd: Point, point: Point): boolean => {
  const minX = Math.min(segStart[0], segEnd[0]);
  const maxX = Math.max(segStart[0], segEnd[0]);
  const minY = Math.min(segStart[1], segEnd[1]);
  const maxY = Math.max(segStart[1], segEnd[1]);

  if (point[0] < minX || point[0] > maxX || point[1] < minY || point[1] > maxY) {
    return false;
  }

  return whichSideOfLine(segStart, segEnd, point) === 0;
};

// Helper: Check if point is inside polygon
const isPointInsidePolygon = (point: Point, polygon: ParsedInput): boolean => {
  for (let i = 0; i < polygon.length; i++) {
    const segStart = polygon[i]!;
    const segEnd = polygon[(i + 1) % polygon.length]!;
    if (isPointOnSegment(segStart, segEnd, point)) {
      return true;
    }
  }

  let crossings = 0;
  for (let i = 0; i < polygon.length; i++) {
    const segStart = polygon[i]!;
    const segEnd = polygon[(i + 1) % polygon.length]!;

    const minY = Math.min(segStart[1], segEnd[1]);
    const maxY = Math.max(segStart[1], segEnd[1]);

    if (point[1] < minY || point[1] >= maxY || segStart[1] === segEnd[1]) {
      continue;
    }

    const xIntersect = segStart[0] + (point[1] - segStart[1]) * (segEnd[0] - segStart[0]) / (segEnd[1] - segStart[1]);

    if (xIntersect > point[0]) {
      crossings++;
    }
  }

  return crossings % 2 === 1;
};

// Helper: Check if two segments cross
const doSegmentsCross = (seg1Start: Point, seg1End: Point, seg2Start: Point, seg2End: Point): boolean => {
  const side1a = whichSideOfLine(seg2Start, seg2End, seg1Start);
  const side1b = whichSideOfLine(seg2Start, seg2End, seg1End);
  const side2a = whichSideOfLine(seg1Start, seg1End, seg2Start);
  const side2b = whichSideOfLine(seg1Start, seg1End, seg2End);

  const opposite1 = (side1a === -1 && side1b === 1) || (side1a === 1 && side1b === -1);
  const opposite2 = (side2a === -1 && side2b === 1) || (side2a === 1 && side2b === -1);

  return opposite1 && opposite2;
};

// Part 2: Find the largest rectangle using only red and green tiles
const solvePart2 = (points: ParsedInput): number => {

  const edges: Array<[Point, Point]> = [];
  for (let i = 0; i < points.length; i++) {
    edges.push([points[i]!, points[(i + 1) % points.length]!]);
  }

  const candidates: Array<{ i: number; j: number; area: number }> = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const [x1, y1] = points[i]!;
      const [x2, y2] = points[j]!;
      const width = Math.abs(x2 - x1) + 1;
      const height = Math.abs(y2 - y1) + 1;
      const area = width * height;
      candidates.push({ i, j, area });
    }
  }

  candidates.sort((a, b) => b.area - a.area);

  let maxArea = 0;

  for (const candidate of candidates) {
    if (candidate.area <= maxArea) {
      break;
    }

    const vertexA = points[candidate.i]!;
    const vertexB = points[candidate.j]!;

    const vertexC: Point = [vertexA[0], vertexB[1]];
    const vertexD: Point = [vertexB[0], vertexA[1]];

    if (!isPointInsidePolygon(vertexC, points) || !isPointInsidePolygon(vertexD, points)) {
      continue;
    }

    const rectEdges: Array<[Point, Point]> = [
      [vertexA, vertexC],
      [vertexC, vertexB],
      [vertexB, vertexD],
      [vertexD, vertexA],
    ];

    let hasCrossing = false;
    for (const [polyStart, polyEnd] of edges) {
      for (const [rectStart, rectEnd] of rectEdges) {
        if (doSegmentsCross(polyStart, polyEnd, rectStart, rectEnd)) {
          hasCrossing = true;
          break;
        }
      }
      if (hasCrossing) break;
    }

    if (!hasCrossing) {
      maxArea = candidate.area;
    }
  }

  return maxArea;
};

// Test
const test = (): void => {
  const exampleInput = `7,1
11,1
11,7
9,7
9,5
2,5
2,3
7,3`;

  const parsedExample = parseInput(exampleInput);
  const resultPart1 = solvePart1(parsedExample);
  const expectedPart1 = 50;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);

  const resultPart2 = solvePart2(parsedExample);
  const expectedPart2 = 24;
  console.log(`Expected Part 2: ${expectedPart2}`);
  console.log(`Result Part 2: ${resultPart2}`);
};

test();


const rawInput = readFileSync(join(__dirname, 'day9.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(parsedInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);
