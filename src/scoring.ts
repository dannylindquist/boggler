/**
 * Calculate the score for a single word.
 * 3-letter words = 1 point
 * 4+ letter words = 1 point + 1 per additional letter
 */
export function getWordScore(word: string): number {
  return Math.max(1, word.length - 2);
}

export interface PlayerScoreData {
  name: string;
  words: string[];
  validWords: string[];
  contestedValidWords: string[];
  duplicateWords: string[];
  totalScore: number;
}

/**
 * Calculate scores for all players, filtering out duplicates and contested words.
 */
export function calculatePlayerScores(
  foundWords: Record<string, string[]>,
  duplicateWords: string[],
  contestedWords: string[]
): PlayerScoreData[] {
  return Object.entries(foundWords).map(([name, words]) => {
    const validWords = words.filter(
      (word) =>
        !duplicateWords.includes(word) && !contestedWords.includes(word)
    );
    const contestedValidWords = words.filter(
      (word) => !duplicateWords.includes(word) && contestedWords.includes(word)
    );
    const duplicateWordsForPlayer = words.filter((word) =>
      duplicateWords.includes(word)
    );
    const totalScore = validWords.reduce(
      (sum, word) => sum + getWordScore(word),
      0
    );

    return {
      name,
      words,
      validWords,
      contestedValidWords,
      duplicateWords: duplicateWordsForPlayer,
      totalScore,
    };
  });
}
