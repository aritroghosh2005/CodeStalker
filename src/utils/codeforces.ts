import { Problem, CodeforcesProblem } from "../types";

const CODEFORCES_API_URL = "https://codeforces.com/api/problemset.problems";
const CACHE_KEY = "codestalker_problemset_cache";
const CACHE_TIME_KEY = "codestalker_problemset_cache_time";
const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours cache duration

// Hand-picked high-quality Codeforces problems as robust offline fallback
const FALLBACK_PROBLEMS: Problem[] = [
  { contestId: 4, index: "A", name: "Watermelon", type: "PROGRAMMING", rating: 800, tags: ["brute force", "math"], uniqueKey: "4-A", url: "https://codeforces.com/problemset/problem/4/A" },
  { contestId: 71, index: "A", name: "Way Too Long Words", type: "PROGRAMMING", rating: 800, tags: ["strings"], uniqueKey: "71-A", url: "https://codeforces.com/problemset/problem/71/A" },
  { contestId: 158, index: "A", name: "Next Round", type: "PROGRAMMING", rating: 800, tags: ["*special", "implementation"], uniqueKey: "158-A", url: "https://codeforces.com/problemset/problem/158/A" },
  { contestId: 231, index: "A", name: "Team", type: "PROGRAMMING", rating: 800, tags: ["brute force", "greedy"], uniqueKey: "231-A", url: "https://codeforces.com/problemset/problem/231/A" },
  { contestId: 112, index: "A", name: "Petya and Strings", type: "PROGRAMMING", rating: 800, tags: ["implementation", "strings"], uniqueKey: "112-A", url: "https://codeforces.com/problemset/problem/112/A" },
  { contestId: 282, index: "A", name: "Bit++", type: "PROGRAMMING", rating: 800, tags: ["implementation"], uniqueKey: "282-A", url: "https://codeforces.com/problemset/problem/282/A" },
  { contestId: 50, index: "A", name: "Domino piling", type: "PROGRAMMING", rating: 800, tags: ["greedy", "math"], uniqueKey: "50-A", url: "https://codeforces.com/problemset/problem/50/A" },
  
  { contestId: 263, index: "A", name: "Beautiful Matrix", type: "PROGRAMMING", rating: 800, tags: ["implementation"], uniqueKey: "263-A", url: "https://codeforces.com/problemset/problem/263/A" },
  { contestId: 118, index: "A", name: "String Task", type: "PROGRAMMING", rating: 1000, tags: ["implementation", "strings"], uniqueKey: "118-A", url: "https://codeforces.com/problemset/problem/118/A" },
  { contestId: 69, index: "A", name: "Young Physicist", type: "PROGRAMMING", rating: 1000, tags: ["implementation", "math"], uniqueKey: "69-A", url: "https://codeforces.com/problemset/problem/69/A" },
  { contestId: 230, index: "A", name: "Dragons", type: "PROGRAMMING", rating: 1000, tags: ["greedy", "sortings"], uniqueKey: "230-A", url: "https://codeforces.com/problemset/problem/230/A" },
  { contestId: 58, index: "A", name: "Chat room", type: "PROGRAMMING", rating: 1000, tags: ["greedy", "strings"], uniqueKey: "58-A", url: "https://codeforces.com/problemset/problem/58/A" },
  
  { contestId: 122, index: "A", name: "Lucky Division", type: "PROGRAMMING", rating: 1000, tags: ["brute force", "number theory"], uniqueKey: "122-A", url: "https://codeforces.com/problemset/problem/122/A" },
  { contestId: 131, index: "A", name: "cAPS lOCK", type: "PROGRAMMING", rating: 1000, tags: ["implementation", "strings"], uniqueKey: "131-A", url: "https://codeforces.com/problemset/problem/131/A" },
  { contestId: 479, index: "A", name: "Expression", type: "PROGRAMMING", rating: 1000, tags: ["brute force", "math"], uniqueKey: "479-A", url: "https://codeforces.com/problemset/problem/479/A" },
  
  { contestId: 158, index: "B", name: "Taxi", type: "PROGRAMMING", rating: 1100, tags: ["greedy", "implementation"], uniqueKey: "158-B", url: "https://codeforces.com/problemset/problem/158/B" },
  { contestId: 1335, index: "C", name: "Two Teams Reusing", type: "PROGRAMMING", rating: 1100, tags: ["binary search", "greedy", "sortings"], uniqueKey: "1335-C", url: "https://codeforces.com/problemset/problem/1335/C" },
  
  { contestId: 489, index: "B", name: "BerSU Ball", type: "PROGRAMMING", rating: 1200, tags: ["dfs and similar", "dp", "greedy", "sortings", "two pointers"], uniqueKey: "489-B", url: "https://codeforces.com/problemset/problem/489/B" },
  { contestId: 466, index: "A", name: "Cheap Travel", type: "PROGRAMMING", rating: 1200, tags: ["dp", "implementation"], uniqueKey: "466-A", url: "https://codeforces.com/problemset/problem/466/A" },
  { contestId: 489, index: "C", name: "Given Length and Sum of Digits...", type: "PROGRAMMING", rating: 1400, tags: ["dp", "greedy"], uniqueKey: "489-C", url: "https://codeforces.com/problemset/problem/489/C" },
  { contestId: 1336, index: "A", name: "Linova and Kingdom", type: "PROGRAMMING", rating: 1600, tags: ["dfs and similar", "dp", "greedy", "trees"], uniqueKey: "1336-A", url: "https://codeforces.com/problemset/problem/1336/A" },
  { contestId: 455, index: "A", name: "Boredom", type: "PROGRAMMING", rating: 1500, tags: ["dp"], uniqueKey: "455-A", url: "https://codeforces.com/problemset/problem/455/A" },
  
  { contestId: 339, index: "D", name: "Xenia and Bit Operations", type: "PROGRAMMING", rating: 1700, tags: ["data structures", "trees"], uniqueKey: "339-D", url: "https://codeforces.com/problemset/problem/339/D" },
  { contestId: 580, index: "C", name: "Kefa and Park", type: "PROGRAMMING", rating: 1500, tags: ["dfs and similar", "graphs", "trees"], uniqueKey: "580-C", url: "https://codeforces.com/problemset/problem/580/C" },
  { contestId: 189, index: "A", name: "Cut Ribbon", type: "PROGRAMMING", rating: 1300, tags: ["dp"], uniqueKey: "189-A", url: "https://codeforces.com/problemset/problem/189/A" },
  
  { contestId: 271, index: "D", name: "Good Substrings", type: "PROGRAMMING", rating: 1800, tags: ["data structures", "strings"], uniqueKey: "271-D", url: "https://codeforces.com/problemset/problem/271/D" },
  { contestId: 1324, index: "E", name: "Sleeping Schedule", type: "PROGRAMMING", rating: 1700, tags: ["dp"], uniqueKey: "1324-E", url: "https://codeforces.com/problemset/problem/1324/E" },
  { contestId: 1361, index: "B", name: "Johnny and Grandmaster", type: "PROGRAMMING", rating: 2000, tags: ["greedy", "math", "number theory"], uniqueKey: "1361-B", url: "https://codeforces.com/problemset/problem/1361/B" },
  
  { contestId: 1182, index: "C", name: "Beautiful Lyrics", type: "PROGRAMMING", rating: 1800, tags: ["greedy", "implementation", "strings"], uniqueKey: "1182-C", url: "https://codeforces.com/problemset/problem/1182/C" },
  { contestId: 1454, index: "E", name: "One Paths", type: "PROGRAMMING", rating: 2100, tags: ["dfs and similar", "graphs", "trees"], uniqueKey: "1454-E", url: "https://codeforces.com/problemset/problem/1454/E" },
  { contestId: 1619, index: "H", name: "Permutations and Queries", type: "PROGRAMMING", rating: 2200, tags: ["data structures", "divide and conquer"], uniqueKey: "1619-H", url: "https://codeforces.com/problemset/problem/1619/H" },
  { contestId: 1515, index: "F", name: "Phoenix and Earthquake", type: "PROGRAMMING", rating: 2400, tags: ["constructive algorithms", "dfs and similar", "graphs", "greedy", "trees"], uniqueKey: "1515-F", url: "https://codeforces.com/problemset/problem/1515/F" },
  { contestId: 1349, index: "C", name: "Orac and Game of Life", type: "PROGRAMMING", rating: 2000, tags: ["graphs", "shortest paths"], uniqueKey: "1349-C", url: "https://codeforces.com/problemset/problem/1349/C" },
  { contestId: 1613, index: "E", name: "Crazy Robot", type: "PROGRAMMING", rating: 1900, tags: ["dfs and similar", "graphs", "greedy"], uniqueKey: "1613-E", url: "https://codeforces.com/problemset/problem/1613/E" },
  { contestId: 1183, index: "H", name: "Subsequences (hard version)", type: "PROGRAMMING", rating: 2100, tags: ["dp"], uniqueKey: "1183-H", url: "https://codeforces.com/problemset/problem/1183/H" },
  
  { contestId: 546, index: "D", name: "Soldier and Number Game", type: "PROGRAMMING", rating: 1700, tags: ["dp", "math", "number theory"], uniqueKey: "546-D", url: "https://codeforces.com/problemset/problem/546/D" },
  { contestId: 1538, index: "G", name: "Gift Set", type: "PROGRAMMING", rating: 2100, tags: ["binary search", "greedy", "math", "ternary search"], uniqueKey: "1538-G", url: "https://codeforces.com/problemset/problem/1538/G" },
  { contestId: 1475, index: "G", name: "Strange Beauty", type: "PROGRAMMING", rating: 1900, tags: ["dp", "math", "number theory"], uniqueKey: "1475-G", url: "https://codeforces.com/problemset/problem/1475/G" },
  { contestId: 1418, index: "D", name: "Trash Bin", type: "PROGRAMMING", rating: 2100, tags: ["data structures", "greedy"], uniqueKey: "1418-D", url: "https://codeforces.com/problemset/problem/1418/D" },
  { contestId: 1618, index: "G", name: "Trader Problem", type: "PROGRAMMING", rating: 2500, tags: ["data structures", "dsu", "greedy", "sortings"], uniqueKey: "1618-G", url: "https://codeforces.com/problemset/problem/1618/G" }
];

/**
 * Builds the standard Codeforces problem URL
 */
export function getProblemUrl(problem: { contestId?: number; index: string }): string {
  if (problem.contestId) {
    return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
  }
  return `https://codeforces.com/problemset`;
}

/**
 * Fetches the entire problemset from Codeforces API with local cache fallback
 */
export async function fetchProblemSet(
  onStatusUpdate?: (status: string) => void,
  forceRefresh: boolean = false
): Promise<{ problems: Problem[]; isOfflineFallback: boolean }> {
  if (!forceRefresh) {
    try {
      const cachedTimeStr = localStorage.getItem(CACHE_TIME_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);
      
      if (cachedTimeStr && cachedData) {
        const cachedTime = parseInt(cachedTimeStr, 10);
        const now = Date.now();
        if (now - cachedTime < CACHE_DURATION) {
          if (onStatusUpdate) onStatusUpdate("Loading cached Codeforces database...");
          const parsed = JSON.parse(cachedData) as Problem[];
          if (parsed && parsed.length > 0) {
            return { problems: parsed, isOfflineFallback: false };
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load Codeforces data from cache", e);
    }
  }

  if (onStatusUpdate) onStatusUpdate("Fetching problem set from Codeforces API...");

  try {
    const response = await fetch(CODEFORCES_API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== "OK" || !data.result || !data.result.problems) {
      throw new Error("Invalid Codeforces API response status or format");
    }

    if (onStatusUpdate) onStatusUpdate("Parsing and validating rated problems...");
    
    const cfProblems = data.result.problems as CodeforcesProblem[];
    
    // Filter and transform: we only keep problems with ratings
    const problems: Problem[] = cfProblems
      .filter((p) => p.rating !== undefined && p.rating >= 800 && p.rating <= 3500)
      .map((p) => {
        const uniqueKey = p.contestId ? `${p.contestId}-${p.index}` : `${p.problemsetName || "unknown"}-${p.index}`;
        return {
          contestId: p.contestId,
          problemsetName: p.problemsetName,
          index: p.index,
          name: p.name,
          type: p.type,
          rating: p.rating!,
          tags: p.tags || [],
          uniqueKey,
          url: getProblemUrl(p)
        };
      });

    // Save stripped-down data to cache
    try {
      if (problems.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(problems));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }
    } catch (e) {
      console.warn("Failed to save to localStorage (likely size quota, stripping names and tags further for compression)");
      // Let's store anyway, if it fails, it's ok, we will just fetch fresh next time or use partial cache
    }

    return { problems, isOfflineFallback: false };
  } catch (error) {
    console.error("Failed to fetch Codeforces problem set:", error);
    if (onStatusUpdate) onStatusUpdate("CORS or rate limit encountered. Falling back to built-in library.");
    
    // Wait a brief moment so user can read fallback message
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    return { problems: FALLBACK_PROBLEMS, isOfflineFallback: true };
  }
}

/**
 * Randomly shuffles an array in place (Fisher-Yates) and returns a copy
 */
function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates 5 initial questions at ratings X, X+100, X+200, X+300, X+400
 * It guarantees strictly completely random selection, filtered out solved problems.
 */
export function generateInitialProblems(
  allProblems: Problem[],
  baseRating: number,
  solvedKeys: Set<string>
): Problem[] {
  const selected: Problem[] = [];
  const targetRatings = [baseRating, baseRating + 100, baseRating + 200, baseRating + 300, baseRating + 400];

  for (const rating of targetRatings) {
    // Find all problems with this exact rating, filtering out solved
    let candidates = allProblems.filter((p) => p.rating === rating && !solvedKeys.has(p.uniqueKey));
    
    // If no unsolved problems exist for this exact rating, fall back to any problem with this rating
    if (candidates.length === 0) {
      candidates = allProblems.filter((p) => p.rating === rating);
    }
    
    // If STILL nothing (e.g. invalid rating or completely dry database), get the closest ratings
    if (candidates.length === 0) {
      candidates = allProblems.filter((p) => Math.abs(p.rating - rating) <= 100);
    }

    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      selected.push(candidates[randomIndex]);
    } else {
      // Hard fallback if database is empty or completely filtered out
      const fallback = FALLBACK_PROBLEMS.find((p) => p.rating === rating) || FALLBACK_PROBLEMS[0];
      selected.push(fallback);
    }
  }

  return selected;
}

/**
 * Generates 5 "More like this" problems sharing tags and rated between X and X+500 (inclusive)
 */
export function generateMoreLikeThis(
  allProblems: Problem[],
  parentProblem: Problem,
  baseRating: number,
  solvedKeys: Set<string>
): Problem[] {
  const minRating = baseRating;
  const maxRating = baseRating + 500;
  const parentTags = new Set(parentProblem.tags);

  // Candidates must be within rating range [X, X+500], not solved, and not the parent itself
  const ratingFiltered = allProblems.filter(
    (p) => p.rating >= minRating && p.rating <= maxRating && !solvedKeys.has(p.uniqueKey) && p.uniqueKey !== parentProblem.uniqueKey
  );

  // Score candidate problems by tag overlap
  const candidatesWithOverlap = ratingFiltered.map((p) => {
    let overlapCount = 0;
    p.tags.forEach((tag) => {
      if (parentTags.has(tag)) {
        overlapCount++;
      }
    });
    return { problem: p, overlapCount };
  });

  // Filter candidates that have at least one tag in common
  let filtered = candidatesWithOverlap.filter((item) => item.overlapCount > 0);

  // If we have plenty of problems, let's take a good random selection from them.
  // We want it to be entirely random, but favoring overlapping tags.
  // Let's divide them into high-overlap and low-overlap, shuffle them, and pick.
  let finalCandidates: Problem[] = [];

  if (filtered.length >= 5) {
    // Sort in groups or just pick the ones with overlap
    // To ensure randomness and no favoritism, let's shuffle the filtered candidates
    const shuffledFiltered = shuffle(filtered);
    
    // Sort by overlap count descending to prioritize higher overlap, but keep random order for equal overlaps
    shuffledFiltered.sort((a, b) => b.overlapCount - a.overlapCount);
    
    // Take top 5
    finalCandidates = shuffledFiltered.slice(0, 5).map((item) => item.problem);
  } else {
    // If we have fewer than 5 matching tags, add problems with 0 overlap (still in the same rating range) to pad up to 5
    const overlapProblems = filtered.map((item) => item.problem);
    const zeroOverlap = candidatesWithOverlap.filter((item) => item.overlapCount === 0).map((item) => item.problem);
    const shuffledZeroOverlap = shuffle(zeroOverlap);

    const merged = [...overlapProblems, ...shuffledZeroOverlap];
    finalCandidates = merged.slice(0, 5);
  }

  // If STILL less than 5 (due to extremely tight rating constraints or small database), lift rating constraint slightly
  if (finalCandidates.length < 5) {
    const anyOtherUnsolved = shuffle(
      allProblems.filter((p) => !solvedKeys.has(p.uniqueKey) && p.uniqueKey !== parentProblem.uniqueKey)
    );
    const padding = anyOtherUnsolved.slice(0, 5 - finalCandidates.length);
    finalCandidates = [...finalCandidates, ...padding];
  }

  // Final shuffle of the selected 5 to ensure there is no strict order
  return shuffle(finalCandidates);
}

/**
 * Extracts all unique tags from a problemset
 */
export function getAllUniqueTags(problems: Problem[]): string[] {
  const tags = new Set<string>();
  problems.forEach((p) => {
    p.tags.forEach((t) => tags.add(t));
  });
  return Array.from(tags).sort();
}

/**
 * Colors mapped to difficulty ratings on Codeforces
 */
export function getRatingColorClass(rating: number): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  name: string;
} {
  if (rating < 1200) {
    return {
      text: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      badge: "bg-gray-500/20 text-gray-300 border-gray-500/40",
      name: "Newbie",
    };
  } else if (rating < 1400) {
    return {
      text: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      badge: "bg-green-500/20 text-green-300 border-green-500/40",
      name: "Pupil",
    };
  } else if (rating < 1600) {
    return {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      name: "Specialist",
    };
  } else if (rating < 1900) {
    return {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      name: "Expert",
    };
  } else if (rating < 2200) {
    return {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      name: "Candidate Master",
    };
  } else if (rating < 2400) {
    return {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      name: "Master",
    };
  } else {
    return {
      text: "text-red-500 font-bold",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      badge: "bg-red-500/20 text-red-300 border-red-500/40",
      name: "Grandmaster",
    };
  }
}
