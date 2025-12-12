import { readFileSync } from 'fs';
import { join } from 'path';

type Machine = {
  readonly target: readonly boolean[];
  readonly buttons: readonly (readonly number[])[];
  readonly joltage: readonly number[];
};

type ParsedInput = readonly Machine[];


const parseInput = (input: string): ParsedInput => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const patternMatch = line.match(/\[([.#]+)\]/);
      if (!patternMatch) throw new Error(`Invalid pattern: ${line}`);
      const pattern = patternMatch[1]!;
      const target = pattern.split('').map(ch => ch === '#') as readonly boolean[];

      const buttonMatches = line.matchAll(/\(([0-9,]+)\)/g);
      const buttons: number[][] = [];
      for (const match of buttonMatches) {
        const buttonStr = match[1]!;
        const button = buttonStr.split(',').map(Number);
        buttons.push(button);
      }

      const joltageMatch = line.match(/\{([0-9,]+)\}/);
      const joltage = joltageMatch
        ? joltageMatch[1]!.split(',').map(Number)
        : [];

      return {
        target,
        buttons: buttons as readonly (readonly number[])[],
        joltage: joltage as readonly number[],
      };
    });
};

// Part 1: Solve the problem by solving each machine individually.
const solvePart1 = (machines: ParsedInput): number => {
  let total = 0;
  for (const machine of machines) {
    const presses = solveMachineLights(machine);
    if (presses === -1) {
      throw new Error('No solution found for a machine (lights)');
    }
    total += presses;
  }
  return total;
};

const solveMachineLights = (machine: Machine): number => {
  const numLights = machine.target.length;
  const numButtons = machine.buttons.length;

  // Build augmented matrix [A | b] over GF(2)
  const matrix: boolean[][] = [];
  for (let i = 0; i < numLights; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < numButtons; j++) {
      row.push(machine.buttons[j]!.includes(i));
    }
    row.push(machine.target[i]!);
    matrix.push(row);
  }

  // Gaussian elimination
  let rank = 0;
  const pivotCol: number[] = [];

  for (let col = 0; col < numButtons && rank < numLights; col++) {
    let pivotRow = -1;
    for (let row = rank; row < numLights; row++) {
      if (matrix[row]![col]) {
        pivotRow = row;
        break;
      }
    }
    if (pivotRow === -1) continue;

    [matrix[rank], matrix[pivotRow]] = [matrix[pivotRow]!, matrix[rank]!];
    pivotCol[rank] = col;

    for (let row = 0; row < numLights; row++) {
      if (row !== rank && matrix[row]![col]) {
        for (let c = 0; c <= numButtons; c++) {
          matrix[row]![c] = matrix[row]![c]! !== matrix[rank]![c]!;
        }
      }
    }
    rank++;
  }

  for (let row = rank; row < numLights; row++) {
    if (matrix[row]![numButtons]) {
      return -1;
    }
  }

  // Find free variables
  const pivotSet = new Set(pivotCol);
  const freeVars: number[] = [];
  for (let col = 0; col < numButtons; col++) {
    if (!pivotSet.has(col)) {
      freeVars.push(col);
    }
  }

  // Try all combinations of free variables to find minimum weight solution
  let minPresses = Infinity;
  for (let mask = 0; mask < (1 << freeVars.length); mask++) {
    const solution: boolean[] = new Array(numButtons).fill(false);

    for (let i = 0; i < freeVars.length; i++) {
      solution[freeVars[i]!] = (mask & (1 << i)) !== 0;
    }

    for (let r = rank - 1; r >= 0; r--) {
      const col = pivotCol[r]!;
      let value = matrix[r]![numButtons]!;
      for (let c = col + 1; c < numButtons; c++) {
        if (matrix[r]![c] && solution[c]) {
          value = !value;
        }
      }
      solution[col] = value;
    }

    const presses = solution.filter(x => x).length;
    if (presses < minPresses) {
      minPresses = presses;
    }
  }

  return minPresses;
};

// Part 2: Parity-based recursive solution: reduce problem by considering parity and dividing by 2 at each step.
type Result = {
  cost: number | null;
  solution: number[] | null;
};

const solvePart2 = (machines: ParsedInput): number => {
  let total = 0;
  for (const machine of machines) {
    const solution = solveMachineJoltage(machine);
    if (solution === null) {
      throw new Error('No solution found for a machine (joltage)');
    }
    total += solution.reduce((a, b) => a + b, 0);
  }
  return total;
};

const solveMachineJoltage = (machine: Machine): number[] | null => {
  const target = machine.joltage;
  const numCounters = target.length;
  const numButtons = machine.buttons.length;

  if (numCounters === 0) return new Array(numButtons).fill(0);

  const parityPatterns = precomputeParityPatterns(machine);
  const memo = new Map<string, Result>();

  const solveRecursive = (tgt: readonly number[]): Result => {
    if (tgt.every(v => v === 0)) {
      return { cost: 0, solution: new Array(numButtons).fill(0) };
    }

    const key = tgt.join(',');
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    // Compute parity: which counters need odd values
    let parity = 0;
    for (let i = 0; i < tgt.length; i++) {
      if ((tgt[i]! & 1) === 1) {
        parity |= 1 << i;
      }
    }

    const patterns = parityPatterns.get(parity);
    if (!patterns || patterns.length === 0) {
      const result: Result = { cost: null, solution: null };
      memo.set(key, result);
      return result;
    }

    let bestResult: Result = { cost: null, solution: null };

    for (const pattern of patterns) {
      const newTarget = applyPattern(pattern, tgt, machine);
      if (newTarget === null) continue;

      const subResult = solveRecursive(newTarget);
      if (subResult.cost === null || subResult.solution === null) continue;

      const patternCost = countBits(pattern);
      const totalCost = patternCost + 2 * subResult.cost;

      if (bestResult.cost === null || totalCost < bestResult.cost) {
        bestResult = {
          cost: totalCost,
          solution: combineSolution(pattern, subResult.solution),
        };
      }
    }

    memo.set(key, bestResult);
    return bestResult;
  };

  const result = solveRecursive(target);
  return result.solution;
};

const precomputeParityPatterns = (
  machine: Machine,
): Map<number, number[]> => {
  const numButtons = machine.buttons.length;
  const numCounters = machine.joltage.length;
  const patternsByParity = new Map<number, number[]>();

  for (let mask = 0; mask < 1 << numButtons; mask++) {
    const parity = computeParity(mask, machine, numCounters);
    if (!patternsByParity.has(parity)) {
      patternsByParity.set(parity, []);
    }
    patternsByParity.get(parity)!.push(mask);
  }

  return patternsByParity;
};

const computeParity = (
  buttonMask: number,
  machine: Machine,
  numCounters: number,
): number => {
  let parity = 0;

  for (let j = 0; j < numCounters; j++) {
    let sum = 0;
    for (let b = 0; b < machine.buttons.length; b++) {
      if (((buttonMask >> b) & 1) === 1 && machine.buttons[b]!.includes(j)) {
        sum++;
      }
    }
    if ((sum & 1) === 1) {
      parity |= 1 << j;
    }
  }

  return parity;
};

const applyPattern = (
  pattern: number,
  target: readonly number[],
  machine: Machine,
): number[] | null => {
  const newTarget: number[] = [];

  for (let j = 0; j < target.length; j++) {
    let count = 0;
    for (let b = 0; b < machine.buttons.length; b++) {
      if (((pattern >> b) & 1) === 1 && machine.buttons[b]!.includes(j)) {
        count++;
      }
    }
    const newVal = target[j]! - count;
    if (newVal < 0 || (newVal & 1) === 1) {
      return null;
    }
    newTarget.push(newVal / 2);
  }

  return newTarget;
};

const combineSolution = (pattern: number, subSolution: number[]): number[] => {
  return subSolution.map((value, b) => {
    if (((pattern >> b) & 1) === 1) {
      return value * 2 + 1;
    } else {
      return value * 2;
    }
  });
};

const countBits = (n: number): number => {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
};





const test = (): void => {
  const exampleInput = `[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}`;
  const parsedExample = parseInput(exampleInput);

  const resultPart1 = solvePart1(parsedExample);
  const expectedPart1 = 7;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);

  const resultPart2 = solvePart2(parsedExample);
  const expectedPart2 = 33;
  console.log(`Expected: ${expectedPart2}`);
  console.log(`Result: ${resultPart2}`);
};

test();





const rawInput = readFileSync(join(__dirname, 'day10.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(parsedInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);
