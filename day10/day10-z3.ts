import { readFileSync } from 'fs';
import { join } from 'path';
import { init } from 'z3-solver';

type Machine = {
  readonly target: readonly boolean[];
  readonly buttons: readonly (readonly number[])[];
  readonly joltage: readonly number[];
};

type ParsedInput = readonly Machine[];

const z3InitPromise = init();

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

// Part 1: Find the fewest total button presses required to correctly configure all indicator lights on all machines
const solvePart1 = (machines: ParsedInput): number => {
  let total = 0;
  for (const machine of machines) {
    const presses = solveMachine(machine);
    if (presses === -1) {
      throw new Error('No solution found for a machine');
    }
    total += presses;
  }
  return total;
};

// Solve linear system over GF(2) using Gaussian elimination
// Returns the minimum number of button presses, or -1 if no solution
const solveMachine = (machine: Machine): number => {
  const numLights = machine.target.length;
  const numButtons = machine.buttons.length;

  // Build augmented matrix [A | b]
  // A[i][j] = 1 if button j toggles light i, else 0
  // b[i] = target state of light i
  const matrix: boolean[][] = [];
  for (let i = 0; i < numLights; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < numButtons; j++) {
      row.push(machine.buttons[j]!.includes(i));
    }
    row.push(machine.target[i]!);
    matrix.push(row);
  }

  // Gaussian elimination over GF(2)
  let rank = 0;
  const pivotCol: number[] = [];

  for (let col = 0; col < numButtons && rank < numLights; col++) {
    // Find pivot row
    let pivotRow = -1;
    for (let row = rank; row < numLights; row++) {
      if (matrix[row]![col]) {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) continue;

    // Swap rows
    [matrix[rank], matrix[pivotRow]] = [matrix[pivotRow]!, matrix[rank]!];

    pivotCol[rank] = col;

    // Eliminate column
    for (let row = 0; row < numLights; row++) {
      if (row !== rank && matrix[row]![col]) {
        for (let c = 0; c <= numButtons; c++) {
          matrix[row]![c] = matrix[row]![c]! !== matrix[rank]![c]!;
        }
      }
    }

    rank++;
  }

  // Check for inconsistency
  for (let row = rank; row < numLights; row++) {
    if (matrix[row]![numButtons]) {
      return -1; // No solution
    }
  }

  // Find free variables (non-pivot columns)
  const pivotSet = new Set(pivotCol);
  const freeVars: number[] = [];
  for (let col = 0; col < numButtons; col++) {
    if (!pivotSet.has(col)) {
      freeVars.push(col);
    }
  }

  // Try all combinations of free variables to find minimum weight solution
  const numFree = freeVars.length;
  let minPresses = Infinity;

  // Try all 2^numFree combinations
  for (let mask = 0; mask < (1 << numFree); mask++) {
    const solution: boolean[] = new Array(numButtons).fill(false);

    // Set free variables
    for (let i = 0; i < numFree; i++) {
      solution[freeVars[i]!] = (mask & (1 << i)) !== 0;
    }

    // Back substitution for pivot variables
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

    // Count button presses
    const presses = solution.filter(x => x).length;
    minPresses = Math.min(minPresses, presses);
  }

  return minPresses;
};

// Part 2: Find the fewest total button presses required to correctly configure all joltage level counters on all machines
const solvePart2 = async (machines: ParsedInput): Promise<number> => {
  let total = 0;
  for (const machine of machines) {
    const presses = await solveMachineJoltage(machine);
    if (presses === -1) {
      throw new Error('No solution found for a machine');
    }
    total += presses;
  }
  return total;
};

// Use Z3 to solve integer linear programming
const solveMachineJoltage = async (machine: Machine): Promise<number> => {
  const numCounters = machine.joltage.length;
  const numButtons = machine.buttons.length;

  if (numCounters === 0) return 0;

  // Quick impossibility check: if a counter needs >0 but no button touches it
  for (let i = 0; i < numCounters; i++) {
    if (
      machine.joltage[i]! > 0 &&
      !machine.buttons.some(btn => btn.includes(i))
    ) {
      return -1;
    }
  }

  const { Context } = await z3InitPromise;
  const ctx = Context('main');
  const { Optimize, Int, isIntVal } = ctx;
  const opt = new Optimize();

  // Integer variables: x_j = times we press button j (>= 0)
  const x = Array.from({ length: numButtons }, (_, j) =>
    Int.const(`x_${j}`),
  );

  // x_j >= 0
  for (const v of x) {
    opt.add(v.ge(Int.val(0)));
  }

  // Build matrix A: A[i][j] = 1 if button j affects counter i
  const A: number[][] = [];
  for (let i = 0; i < numCounters; i++) {
    const row: number[] = [];
    for (let j = 0; j < numButtons; j++) {
      row.push(machine.buttons[j]!.includes(i) ? 1 : 0);
    }
    A.push(row);
  }

  // For each counter i: sum_j A[i][j] * x_j == target[i]
  for (let i = 0; i < numCounters; i++) {
    const terms = [];
    for (let j = 0; j < numButtons; j++) {
      if (A[i]![j] === 1) {
        terms.push(x[j]!);
      }
    }

    const lhs =
      terms.length === 0
        ? Int.val(0)
        : terms.reduce((acc, v) => acc.add(v), Int.val(0));

    opt.add(lhs.eq(Int.val(machine.joltage[i]!)));
  }

  // Minimize total presses: sum_j x_j
  const totalPressesExpr = x.reduce(
    (acc, v) => acc.add(v),
    Int.val(0),
  );
  opt.minimize(totalPressesExpr);

  const result = await opt.check();
  if (result !== 'sat') {
    return -1;
  }

  const model = opt.model();
  let totalPresses = 0;
  for (const v of x) {
    const val = model.get(v);
    if (isIntVal(val)) {
      const n = Number(val.value());
      totalPresses += n;
    } else {
      const evalVal = model.eval(v);
      if (isIntVal(evalVal)) {
        const n = Number(evalVal.value());
        totalPresses += n;
      } else {
        throw new Error(`Expected integer value from model, got: ${val}`);
      }
    }
  }

  return totalPresses;
};

const test = async (): Promise<void> => {
  const exampleInput = `[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}`;
  const parsedExample = parseInput(exampleInput);

  const resultPart1 = solvePart1(parsedExample);
  const expectedPart1 = 7;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);

  const resultPart2 = await solvePart2(parsedExample);
  const expectedPart2 = 33;
  console.log(`Expected: ${expectedPart2}`);
  console.log(`Result: ${resultPart2}`);
};

test();

const rawInput = readFileSync(join(__dirname, 'day10.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
console.log(`Part 1: ${resultPart1}`);

solvePart2(parsedInput).then(resultPart2 => {
  console.log(`Part 2: ${resultPart2}`);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
