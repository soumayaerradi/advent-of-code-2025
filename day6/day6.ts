import { readFileSync } from 'fs';
import { join } from 'path';

type Operation = '+' | '*';

type Problem = Readonly<{
  readonly numbers: readonly number[];
  readonly operation: Operation;
}>;

type ParsedInput = Readonly<{
  readonly problems: readonly Problem[];
}>;

const parseInput = (input: string): ParsedInput => {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return { problems: [] };
  }

  const operationLine = lines[lines.length - 1]!;
  const numberLines = lines.slice(0, lines.length - 1);

  const operationTokens = operationLine.split(/\s+/).filter(token => token.length > 0);
  const numberTokensByLine = numberLines.map(line =>
    line.split(/\s+/).filter(token => token.length > 0 && !isNaN(Number(token))),
  );

  const maxColumns = Math.max(operationTokens.length, ...numberTokensByLine.map(tokens => tokens.length));

  const problems: Problem[] = [];
  for (let col = 0; col < maxColumns; col++) {
    const numbers: number[] = [];

    // Collect numbers from all number lines for this column
    for (const tokens of numberTokensByLine) {
      if (col < tokens.length) {
        const num = Number(tokens[col]);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      }
    }

    // Get operation for this column
    if (col < operationTokens.length && numbers.length > 0) {
      const op = operationTokens[col] as Operation;
      if (op === '+' || op === '*') {
        problems.push({ numbers, operation: op });
      }
    }
  }

  return { problems };
};

// Part 1: Calculate grand total by solving each problem and summing results
const solvePart1 = (input: ParsedInput): number => {
  return input.problems.reduce((total, problem) => {
    let result: number;
    if (problem.operation === '+') {
      result = problem.numbers.reduce((sum, num) => sum + num, 0);
    } else {
      result = problem.numbers.reduce((product, num) => product * num, 1);
    }
    return total + result;
  }, 0);
};

// Part 2: Read numbers top to bottom in columns, process right-to-left
const parseInputPart2 = (input: string): ParsedInput => {
  const lines = input.split('\n').map(line => line.trimEnd()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return { problems: [] };
  }

  const operationLine = lines[lines.length - 1]!;
  const numberLines = lines.slice(0, lines.length - 1);

  const maxWidth = Math.max(
    operationLine.length,
    ...numberLines.map(line => line.length),
  );

  const problems: Problem[] = [];
  let currentProblem: { numbers: number[]; operation: Operation | null } | null = null;

  // Columns from right to left
  for (let col = maxWidth - 1; col >= 0; col--) {
    // Column from top to bottom
    const columnChars: string[] = [];
    for (let row = 0; row < numberLines.length; row++) {
      const char = numberLines[row]?.[col] ?? ' ';
      columnChars.push(char);
    }
    const operationChar = operationLine[col] ?? ' ';

    // Check if column is all spaces
    const isSeparator = columnChars.every(ch => ch === ' ') && operationChar === ' ';

    if (isSeparator) {
      if (currentProblem && currentProblem.operation !== null && currentProblem.numbers.length > 0) {
        problems.push({
          numbers: currentProblem.numbers,
          operation: currentProblem.operation,
        });
      }
      currentProblem = null;
      continue;
    }

    // Check if this column contains a number
    const digits = columnChars.filter(ch => /\d/.test(ch));
    if (digits.length > 0) {
      const number = Number(digits.join(''));
      if (!isNaN(number)) {
        if (!currentProblem) {
          currentProblem = { numbers: [], operation: null };
        }
        currentProblem.numbers.push(number);
      }
    }

    // Check if this column contains an operation
    if (operationChar === '+' || operationChar === '*') {
      if (!currentProblem) {
        currentProblem = { numbers: [], operation: null };
      }
      currentProblem.operation = operationChar as Operation;
    }
  }

  if (currentProblem && currentProblem.operation !== null && currentProblem.numbers.length > 0) {
    problems.push({
      numbers: currentProblem.numbers,
      operation: currentProblem.operation,
    });
  }

  return { problems };
};

// Part 2: Calculate grand total using right-to-left column reading
const solvePart2 = (input: string): number => {
  const parsed = parseInputPart2(input);
  return parsed.problems.reduce((total, problem) => {
    let result: number;
    if (problem.operation === '+') {
      result = problem.numbers.reduce((sum, num) => sum + num, 0);
    } else {
      result = problem.numbers.reduce((product, num) => product * num, 1);
    }
    return total + result;
  }, 0);
};


// Test function using the example from the puzzle description
const test = (): void => {
  const exampleInput = `123 328  51 64 
 45 64  387 23 
  6 98  215 314
*   +   *   +  `;

  const parsedExample1 = parseInput(exampleInput);

  // Test Part 1
  const resultPart1 = solvePart1(parsedExample1);
  const expectedPart1 = 4277556;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);

  // Test Part 2
  const resultPart2 = solvePart2(exampleInput);
  const expectedPart2 = 3263827;
  console.log(`Expected: ${expectedPart2}`);
  console.log(`Result: ${resultPart2}`);
};

test();


const rawInput = readFileSync(join(__dirname, 'day6.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(rawInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

