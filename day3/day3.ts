import { readFileSync } from 'fs';
import { join } from 'path';

type Bank = string;

const parseInput = (input: string): Bank[] => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

// Part 1: Find the maximum two-digit joltage from each bank
const maxJoltageForBank = (bank: Bank): number => {
  const digits = bank.split('').map(ch => Number(ch));
  const n = digits.length;
  if (n < 2) return 0;

  const suffixMax = new Array<number>(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    suffixMax[i] = Math.max(digits[i]!, suffixMax[i + 1]!);
  }

  let best = 0;
  for (let i = 0; i < n - 1; i++) {
    const value = digits[i]! * 10 + suffixMax[i + 1]!;
    if (value > best) {
      best = value;
    }
  }

  return best;
};

const solvePart1 = (banks: Bank[]): number => {
  return banks.reduce((sum, bank) => sum + maxJoltageForBank(bank), 0);
};

// Part 2: Find the maximum 12-digit joltage from each bank
const maxJoltageForBank12 = (bank: Bank): number => {
  const k = 12;
  const digits = bank.split('');
  const n = digits.length;

  if (n <= k) {
    return Number(digits.join(''));
  }

  let toRemove = n - k;
  const stack: string[] = [];

  for (const d of digits) {
    while (toRemove > 0 && stack.length > 0 && stack[stack.length - 1]! < d) {
      stack.pop();
      toRemove--;
    }
    stack.push(d);
  }

  const selected = stack.slice(0, k).join('');
  return Number(selected);
};

const solvePart2 = (banks: Bank[]): number => {
  return banks.reduce((sum, bank) => sum + maxJoltageForBank12(bank), 0);
};

const input = readFileSync(join(__dirname, 'day3.txt'), 'utf-8');
const banks = parseInput(input);

const resultPart1 = solvePart1(banks);
const resultPart2 = solvePart2(banks);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

