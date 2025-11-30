import { solve_board } from "../solver/solveBoard.ts";

// Official Classic Boggle Dice Configuration (1992/Standard)
const boggleDice = [
  ["R", "I", "F", "O", "B", "X"],
  ["I", "F", "E", "H", "E", "Y"],
  ["D", "E", "N", "O", "W", "S"],
  ["U", "T", "O", "K", "N", "D"],
  ["H", "M", "S", "R", "A", "O"],
  ["L", "U", "P", "E", "T", "S"],
  ["A", "C", "I", "T", "O", "A"],
  ["Y", "L", "G", "K", "U", "E"],
  ["Qu", "B", "M", "J", "O", "A"],
  ["E", "H", "I", "S", "P", "N"],
  ["V", "E", "T", "I", "G", "N"],
  ["B", "A", "L", "I", "Y", "T"],
  ["E", "Z", "A", "V", "N", "D"],
  ["R", "A", "L", "E", "S", "C"],
  ["U", "W", "I", "L", "R", "G"],
  ["P", "A", "C", "E", "M", "D"],
];

interface BoardQuality {
  totalWords: number;
  commonWords: number;
  wordsByLength: Record<number, number>;
  averageWordLength: number;
  longestWord: number;
  score: number; // Overall quality score (0-100)
}

export const evaluateBoardQuality = (board: string[]): BoardQuality => {
  const wordList = solve_board(board);
  
  let totalWords = 0;
  let commonWords = 0;
  let totalLetters = 0;
  let longestWord = 0;
  const wordsByLength: Record<number, number> = {};
  
  // Analyze word distribution
  for (const [lengthStr, words] of Object.entries(wordList)) {
    const length = parseInt(lengthStr);
    const count = words.length;
    
    wordsByLength[length] = count;
    totalWords += count;
    totalLetters += length * count;
    longestWord = Math.max(longestWord, length);
    
    // Count common words
    commonWords += words.filter(word => word.common).length;
  }
  
  const averageWordLength = totalWords > 0 ? totalLetters / totalWords : 0;
  
  // Calculate quality score based on multiple factors
  let score = 0;
  
  // Factor 1: Total word count (target: 80-150 words)
  const wordCountScore = Math.min(100, Math.max(0, (totalWords - 30) / 120 * 100));
  score += wordCountScore * 0.3;
  
  // Factor 2: Word length distribution (prefer good mix of lengths)
  const has3Letter = (wordsByLength[3] || 0) >= 8;
  const has4Letter = (wordsByLength[4] || 0) >= 6;
  const has5Letter = (wordsByLength[5] || 0) >= 4;
  const hasLongWords = longestWord >= 6;
  
  const distributionScore = (
    (has3Letter ? 25 : 0) +
    (has4Letter ? 25 : 0) +
    (has5Letter ? 25 : 0) +
    (hasLongWords ? 25 : 0)
  );
  score += distributionScore * 0.25;
  
  // Factor 3: Common words ratio (target: 20-40% common words)
  const commonRatio = totalWords > 0 ? commonWords / totalWords : 0;
  const commonScore = commonRatio >= 0.2 && commonRatio <= 0.4 ? 100 : 
                     Math.max(0, 100 - Math.abs(commonRatio - 0.3) * 250);
  score += commonScore * 0.2;
  
  // Factor 4: Average word length (target: 4.2-4.8)
  const lengthScore = averageWordLength >= 4.2 && averageWordLength <= 4.8 ? 100 :
                     Math.max(0, 100 - Math.abs(averageWordLength - 4.5) * 50);
  score += lengthScore * 0.15;
  
  // Factor 5: Bonus for having very long words (7+ letters)
  const longWordBonus = (wordsByLength[7] || 0) + (wordsByLength[8] || 0) * 2 + (wordsByLength[9] || 0) * 3;
  score += Math.min(10, longWordBonus * 2);
  
  return {
    totalWords,
    commonWords,
    wordsByLength,
    averageWordLength: Math.round(averageWordLength * 100) / 100,
    longestWord,
    score: Math.round(score)
  };
};

const generateSingleBoard = (): string[] => {
  const boardDice = [];
  const diceCopy = [...boggleDice];
  for (let i = 0; i < 16; i++) {
    const diceIndex = Math.floor(Math.random() * diceCopy.length);
    const dice = diceCopy.splice(diceIndex, 1)[0]!;
    boardDice.push(dice[Math.floor(Math.random() * dice.length)]);
  }
  return boardDice;
};

export const generateBoard = (minQualityScore: number = 60, maxAttempts: number = 10): string[] => {
  let bestBoard = generateSingleBoard();
  let bestQuality = evaluateBoardQuality(bestBoard);
  
  // If first board meets quality threshold, use it
  if (bestQuality.score >= minQualityScore) {
    console.log(`Board generated with quality score: ${bestQuality.score}`);
    return bestBoard;
  }
  
  // Try to generate better boards
  for (let attempt = 1; attempt < maxAttempts; attempt++) {
    const candidateBoard = generateSingleBoard();
    const candidateQuality = evaluateBoardQuality(candidateBoard);
    
    if (candidateQuality.score > bestQuality.score) {
      bestBoard = candidateBoard;
      bestQuality = candidateQuality;
      
      // If we hit the quality threshold, stop trying
      if (bestQuality.score >= minQualityScore) {
        break;
      }
    }
  }
  
  console.log(`Board generated after ${maxAttempts} attempts with quality score: ${bestQuality.score}`);
  console.log(`Quality details:`, {
    totalWords: bestQuality.totalWords,
    commonWords: bestQuality.commonWords,
    averageLength: bestQuality.averageWordLength,
    longestWord: bestQuality.longestWord,
    distribution: bestQuality.wordsByLength
  });
  
  return bestBoard;
};
