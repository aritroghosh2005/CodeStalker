/**
 * Codeforces Problem and Solved Library types
 */

export interface CodeforcesProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface Problem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  rating: number; // required for our filter
  tags: string[];
  uniqueKey: string; // "contestId-index" or "problemsetName-index"
  url: string;
}

export interface SolvedProblem {
  problem: Problem;
  solvedAt: string; // ISO string of when it was solved
  notes?: string; // Optional user notes on the problem
}

export interface Generation {
  baseRating: number;
  generatedAt: string;
  problems: Problem[];
  // Map of parent problem uniqueKey -> list of 5 recommended problems
  recommendations: Record<string, Problem[]>;
  loadingRecommendations: Record<string, boolean>;
}
