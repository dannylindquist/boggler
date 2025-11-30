import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RadixTree } from "./tree.ts";

const tree = new RadixTree(
  readFileSync(join(import.meta.dirname + "/words.txt"), "utf-8").split(
    "\n",
  ),
);
type Board = string[];

// left: index - 1
// right: index + 1
// top: index - 4
// bottom: index + 4

const directions = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

function walk_index(
  current: string,
  index: number,
  board: Board,
  possible: { word: string; path: string }[],
  hitIndicies: number,
  path: string,
) {
  if ((hitIndicies & (1 << index)) > 0 || index < 0 || index >= 16) {
    return;
  }
  const next_step = (current += board[index].toLowerCase());
  const new_path = path + index.toString(16);
  if (next_step.length >= 3) {
    if (!tree.startsWith(next_step)) {
      return;
    }
    possible.push({ word: next_step, path: new_path });
  }
  const visited = hitIndicies | (1 << index);

  for (const [dx, dy] of directions) {
    const newRow = Math.floor(index / 4) + dy;
    const newCol = (index % 4) + dx;
    if (newCol < 0 || newCol > 3 || newRow < 0 || newRow > 3) {
      continue;
    }
    const nextIndex = 4 * newRow + newCol;
    walk_index(next_step, nextIndex, board, possible, visited, new_path);
  }
}

export function solve_board(board: Board) {
  const found_words: { word: string; path: string; common: boolean }[] = [];
  const uniqueWords = new Set();
  for (let index = 0; index < 16; index++) {
    const possible_words: { word: string; path: string }[] = [];
    walk_index("", index, board, possible_words, 0, "");
    for (const word of possible_words) {
      const isWord = tree.findWord(word.word);
      if (isWord && !uniqueWords.has(word.word)) {
        found_words.push({
          ...word,
          common: !!isWord.common,
        });
        uniqueWords.add(word.word);
      }
    }
  }
  return [...found_words].reduce((agg, val) => {
    if (agg[val.word.length]) {
      agg[val.word.length].push(val);
    } else {
      agg[val.word.length] = [val];
    }
    return agg;
  }, {} as Record<number, { word: string; path: string; common: boolean }[]>);
}
