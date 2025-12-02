import { readFileSync } from 'fs';
import { join, dirname } from 'path';

type Direction = 'L' | 'R';

type Rotation = Readonly<{
  readonly direction: Direction;
  readonly distance: number;
}>;

const parseInput = (input: string): readonly Rotation[] => {
  return input.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const direction = line.charAt(0) as Direction;
      const distance = parseInt(line.slice(1), 10);
      return { direction, distance } as Rotation;
    });
};

// Part 1: Count how many times the dial points at 0 after any rotation
const calculatePasswordPart1 = (rotations: readonly Rotation[]): number => {
  let position = 50;
  let zeroCount = 0;

  rotations.forEach(({ direction, distance }) => {
    if (direction === 'L') {
      position = (position - distance + 100) % 100;
    } else {
      position = (position + distance) % 100;
    }
    if (position === 0) {
      zeroCount++;
    }
  });

  return zeroCount;
};

// Part 2: Count how many times the dial points at 0 during any rotation or at the end
const calculatePasswordPart2 = (rotations: readonly Rotation[]): number => {
  let position = 50;
  let zeroCount = 0;
  let isFirstRotation = true;

  rotations.forEach(({ direction, distance }) => {
    if (direction === 'L') {
      for (let i = (isFirstRotation ? 0 : 1); i <= distance; i++) {
        const currentPos = (position - i + 100) % 100;
        if (currentPos === 0) {
          zeroCount++;
        }
      }
      position = (position - distance + 100) % 100;
    } else {
      for (let i = (isFirstRotation ? 0 : 1); i <= distance; i++) {
        const currentPos = (position + i) % 100;
        if (currentPos === 0) {
          zeroCount++;
        }
      }
      position = (position + distance) % 100;
    }

    isFirstRotation = false;
  });

  return zeroCount;
};

const input = readFileSync(join(__dirname, 'day1.txt'), 'utf-8');
const rotations = parseInput(input);

const passwordPart1 = calculatePasswordPart1(rotations);
const passwordPart2 = calculatePasswordPart2(rotations);

console.log(`Part 1 - The password to open the door is: ${passwordPart1}`);
console.log(`Part 2 - The password to open the door is: ${passwordPart2}`);
