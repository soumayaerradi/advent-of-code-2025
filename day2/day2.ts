import { readFileSync } from 'fs';
import { join, dirname } from 'path';

type Range = Readonly<{
  readonly start: number;
  readonly end: number;
}>;

type IdValidator = (id: number) => boolean;

const parseInput = (input: string): readonly Range[] => {
  const line = input.trim();
  const ranges: Range[] = [];

  const rangeStrings = line.split(',');
  for (const rangeStr of rangeStrings) {
    const parts = rangeStr.split('-');
    if (parts.length === 2) {
      const start = Number(parts[0]);
      const end = Number(parts[1]);
      if (!isNaN(start) && !isNaN(end)) {
        ranges.push({ start, end } as Range);
      }
    }
  }

  return ranges;
};

const isInvalidId: IdValidator = (num: number): boolean => {
  const str = num.toString();
  const len = str.length;


  if (len % 2 !== 0) {
    return false;
  }

  const half = len / 2;
  const firstHalf = str.substring(0, half);
  const secondHalf = str.substring(half);

  return firstHalf === secondHalf;
};

// Part 1: Find all invalid IDs (numbers made of digits repeated twice) in the ranges
const solvePart1 = (ranges: readonly Range[]): number => {
  return ranges.reduce((sum, range) => {
    let rangeSum = 0;
    for (let id = range.start; id <= range.end; id++) {
      if (isInvalidId(id)) {
        rangeSum += id;
      }
    }
    return sum + rangeSum;
  }, 0);
};

const isInvalidIdPart2: IdValidator = (num: number): boolean => {
  const str = num.toString();
  const len = str.length;


  for (let patternLen = 1; patternLen <= Math.floor(len / 2); patternLen++) {
    const pattern = str.substring(0, patternLen);

    let isValidPattern = true;
    for (let i = patternLen; i < len; i += patternLen) {
      const segment = str.substring(i, i + patternLen);
      if (segment !== pattern) {
        isValidPattern = false;
        break;
      }
    }

    if (isValidPattern && len >= patternLen * 2) {
      return true;
    }
  }

  return false;
};

// Part 2: Find all invalid IDs (numbers made of digits repeated at least twice) in the ranges
const solvePart2 = (ranges: readonly Range[]): number => {
  return ranges.reduce((sum, range) => {
    let rangeSum = 0;
    for (let id = range.start; id <= range.end; id++) {
      if (isInvalidIdPart2(id)) {
        rangeSum += id;
      }
    }
    return sum + rangeSum;
  }, 0);
};

const input = readFileSync(join(__dirname, 'day2.txt'), 'utf-8');
const ranges = parseInput(input);

const resultPart1 = solvePart1(ranges);
const resultPart2 = solvePart2(ranges);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);
