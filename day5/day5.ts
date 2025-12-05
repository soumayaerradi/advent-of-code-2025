import { readFileSync } from 'fs';
import { join } from 'path';

type Range = Readonly<{
  readonly start: number;
  readonly end: number;
}>;

type ParsedInput = Readonly<{
  readonly ranges: readonly Range[];
  readonly ids: readonly number[];
}>;

const parseInput = (input: string): ParsedInput => {
  const lines = input.split('\n').map(line => line.trim());
  const blankLineIndex = lines.findIndex(line => line === '');

  const rangeLines = lines.slice(0, blankLineIndex);
  const idLines = lines.slice(blankLineIndex + 1);

  const ranges: Range[] = rangeLines
    .filter(line => line.length > 0)
    .map(line => {
      const [start, end] = line.split('-').map(Number);
      return { start, end } as Range;
    });

  const ids = idLines
    .filter(line => line.length > 0)
    .map(Number);

  return { ranges, ids };
};

const isInRange = (id: number, range: Range): boolean => {
  return id >= range.start && id <= range.end;
};

const isFresh = (id: number, ranges: readonly Range[]): boolean => {
  return ranges.some(range => isInRange(id, range));
};

// Part 1: Count how many available ingredient IDs are fresh
const solvePart1 = (input: ParsedInput): number => {
  return input.ids.filter(id => isFresh(id, input.ranges)).length;
};

// Part 2: Count all unique ingredient IDs that are considered fresh by the ranges
const solvePart2 = (input: ParsedInput): number => {
  const merged = [...input.ranges]
    .sort((a, b) => a.start - b.start)
    .reduce<Range[]>((acc, range) => {
      const last = acc[acc.length - 1];
      if (last && range.start <= last.end + 1) {
        acc[acc.length - 1] = { start: last.start, end: Math.max(last.end, range.end) };
      } else {
        acc.push(range);
      }
      return acc;
    }, []);

  return merged.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
};

const rawInput = readFileSync(join(__dirname, 'day5.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(parsedInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);
