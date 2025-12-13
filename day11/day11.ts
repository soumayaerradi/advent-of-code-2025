import { readFileSync } from 'fs';
import { join } from 'path';

type Graph = Map<string, readonly string[]>;

type ParsedInput = Graph;

const parseInput = (input: string): ParsedInput => {
  const graph = new Map<string, string[]>();

  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const [device, outputsStr] = trimmed.split(':');
    if (!device || !outputsStr) continue;

    const outputs = outputsStr.trim().split(/\s+/).filter(s => s.length > 0);
    graph.set(device.trim(), outputs);
  }

  return graph;
};

// Part 1: Count all paths from "you" to "out"
const solvePart1 = (graph: ParsedInput): number => {
  const countPaths = (node: string, visited: Set<string>): number => {
    if (node === 'out') return 1;
    if (visited.has(node)) return 0;

    const outputs = graph.get(node);
    if (!outputs || outputs.length === 0) return 0;

    visited.add(node);
    let total = 0;
    for (const next of outputs) {
      total += countPaths(next, visited);
    }
    visited.delete(node);
    return total;
  };

  return countPaths('you', new Set());
};

// Part 2: Count paths from "svr" to "out" that visit both "dac" and "fft"
const solvePart2 = (graph: ParsedInput): number => {
  const requiredNodes = new Set(['dac', 'fft']);
  const memo = new Map<string, number>();

  const countPaths = (
    node: string,
    visited: Set<string>,
    visitedRequired: Set<string>,
  ): number => {
    if (node === 'out') {
      return visitedRequired.has('dac') && visitedRequired.has('fft') ? 1 : 0;
    }

    if (visited.has(node)) return 0;

    const outputs = graph.get(node);
    if (!outputs || outputs.length === 0) return 0;

    const requiredKey = Array.from(visitedRequired).sort().join(',');
    const memoKey = `${node}:${requiredKey}`;
    if (memo.has(memoKey)) {
      return memo.get(memoKey)!;
    }

    visited.add(node);
    const wasRequired = requiredNodes.has(node);
    if (wasRequired) {
      visitedRequired.add(node);
    }

    let total = 0;
    for (const next of outputs) {
      total += countPaths(next, visited, visitedRequired);
    }

    visited.delete(node);
    if (wasRequired) {
      visitedRequired.delete(node);
    }

    memo.set(memoKey, total);
    return total;
  };

  return graph.has('svr') ? countPaths('svr', new Set(), new Set()) : 0;
};





const test = (): void => {
  const exampleInput = `aaa: you hhh
you: bbb ccc
bbb: ddd eee
ccc: ddd eee fff
ddd: ggg
eee: out
fff: out
ggg: out
hhh: ccc fff iii
iii: out`;
  const parsedExample = parseInput(exampleInput);

  const resultPart1 = solvePart1(parsedExample);
  const expectedPart1 = 5;
  console.log(`Expected: ${expectedPart1}`);
  console.log(`Result: ${resultPart1}`);



  const exampleInput2 = `svr: aaa bbb
aaa: fft
fft: ccc
bbb: tty
tty: ccc
ccc: ddd eee
ddd: hub
hub: fff
eee: dac
dac: fff
fff: ggg hhh
ggg: out
hhh: out`;
  const parsedExample2 = parseInput(exampleInput2);

  const resultPart2 = solvePart2(parsedExample2);
  const expectedPart2 = 2;
  console.log(`Expected Part 2: ${expectedPart2}`);
  console.log(`Result Part 2: ${resultPart2}`);
};

test();





const rawInput = readFileSync(join(__dirname, 'day11.txt'), 'utf-8');
const parsedInput = parseInput(rawInput);

const resultPart1 = solvePart1(parsedInput);
const resultPart2 = solvePart2(parsedInput);

console.log(`Part 1: ${resultPart1}`);
console.log(`Part 2: ${resultPart2}`);

