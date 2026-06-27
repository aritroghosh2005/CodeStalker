import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Trash2, Award, ExternalLink, Tag, Plus, CheckCircle2, RefreshCw } from "lucide-react";
import { Problem, SolvedProblem } from "../types";
import { getRatingColorClass } from "../utils/codeforces";

interface SolvedLibraryProps {
  solvedList: SolvedProblem[];
  allProblems: Problem[];
  onUnsolve: (p: Problem) => void;
  onSolve: (p: Problem) => void;
}

// All standard possible CF ratings
const ALL_RATINGS = Array.from({ length: 28 }, (_, i) => (800 + i * 100).toString());

// Common Codeforces tag database
const COMMON_CF_TAGS = [
  "implementation", "math", "greedy", "dp", "data structures",
  "brute force", "constructive algorithms", "graphs", "sortings", "binary search",
  "dfs and similar", "trees", "strings", "number theory", "combinatorics",
  "geometry", "bitmasks", "two pointers", "dsu", "shortest paths",
  "probabilities", "divide and conquer", "games", "hashing", "interactive",
  "flows", "matrices", "string suffix structures", "fft", "graph matchings",
  "ternary search", "expression parsing", "meet-in-the-middle", "schedules"
];

export const SolvedLibrary: React.FC<SolvedLibraryProps> = ({
  solvedList,
  allProblems,
  onUnsolve,
  onSolve,
}) => {
  const [searchText, setSearchText] = useState("");
  
  // Custom type-to-filter states for rating & tags
  const [ratingQuery, setRatingQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  // Manual solver search state
  const [manualSearch, setManualSearch] = useState("");
  const [isManualFocused, setIsManualFocused] = useState(false);

  // Extract all unique ratings currently present in the solved list
  const solvedRatings = useMemo(() => {
    const ratings = new Set<number>();
    solvedList.forEach((item) => ratings.add(item.problem.rating));
    return Array.from(ratings).sort((a, b) => a - b);
  }, [solvedList]);

  // Extract all unique tags currently present in the solved list
  const solvedTags = useMemo(() => {
    const tags = new Set<string>();
    solvedList.forEach((item) => {
      item.problem.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [solvedList]);

  // Combined dictionary of all tags available for selection
  const allAvailableTags = useMemo(() => {
    const set = new Set([...COMMON_CF_TAGS, ...solvedTags]);
    return Array.from(set).sort();
  }, [solvedTags]);

  // Autocomplete suggestions for manual solver search
  const manualSearchSuggestions = useMemo(() => {
    if (!manualSearch || manualSearch.trim().length < 2) return [];
    const query = manualSearch.toLowerCase().trim();
    
    const solvedKeysSet = new Set(solvedList.map(s => s.problem.uniqueKey));
    
    return allProblems
      .filter((p) => {
        if (solvedKeysSet.has(p.uniqueKey)) return false;
        
        const matchKeyNoHyphen = p.uniqueKey.replace("-", "").toLowerCase();
        const matchKeyWithHyphen = p.uniqueKey.toLowerCase();
        
        return (
          p.name.toLowerCase().includes(query) ||
          matchKeyNoHyphen.includes(query) ||
          matchKeyWithHyphen.includes(query) ||
          p.rating.toString() === query
        );
      })
      .slice(0, 6);
  }, [manualSearch, allProblems, solvedList]);

  // Handle marking a problem solved from manual search
  const handleManualSolve = (problem: Problem) => {
    onSolve(problem);
    setManualSearch("");
    setIsManualFocused(false);
  };

  // Filter solved list based on search query, typed rating and typed tags
  const filteredSolvedList = useMemo(() => {
    return solvedList.filter((item) => {
      const p = item.problem;
      const matchesSearch =
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.uniqueKey.toLowerCase().includes(searchText.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchText.toLowerCase()));

      const matchesRating =
        !ratingQuery ||
        ratingQuery.trim().toLowerCase() === "all" ||
        p.rating.toString().includes(ratingQuery.trim());

      const matchesTag =
        !tagQuery ||
        tagQuery.trim().toLowerCase() === "all" ||
        p.tags.some((t) => t.toLowerCase().includes(tagQuery.trim().toLowerCase()));

      return matchesSearch && matchesRating && matchesTag;
    });
  }, [solvedList, searchText, ratingQuery, tagQuery]);

  // Statistics summaries
  const stats = useMemo(() => {
    if (solvedList.length === 0) return { avgRating: 0, highestRating: 0, dominantTag: "None" };
    
    const sumRatings = solvedList.reduce((sum, s) => sum + s.problem.rating, 0);
    const avgRating = Math.round(sumRatings / solvedList.length);
    const highestRating = Math.max(...solvedList.map((s) => s.problem.rating));
    
    const tagCounts: Record<string, number> = {};
    solvedList.forEach((s) => {
      s.problem.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    let dominantTag = "None";
    let maxCount = 0;
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTag = tag;
      }
    });

    return { avgRating, highestRating, dominantTag };
  }, [solvedList]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative" id="solved-library">
      {/* Decorative top ambient glow line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

      {/* Sidebar Header */}
      <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400 animate-pulse-slow" />
            <h2 className="text-sm font-display font-black tracking-wider text-zinc-100 uppercase">
              Solved Library
            </h2>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            {solvedList.length} Solved
          </span>
        </div>

        {/* Rapid Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-[11px] mb-4">
          <div className="text-center border-r border-zinc-850/60">
            <span className="text-zinc-500 block font-mono text-[9px] uppercase tracking-wider">Avg Rating</span>
            <span className="font-bold font-mono text-zinc-200">{stats.avgRating || "—"}</span>
          </div>
          <div className="text-center border-r border-zinc-850/60">
            <span className="text-zinc-500 block font-mono text-[9px] uppercase tracking-wider">Highest</span>
            <span className="font-bold font-mono text-emerald-400">{stats.highestRating || "—"}</span>
          </div>
          <div className="text-center overflow-hidden">
            <span className="text-zinc-500 block font-mono text-[9px] uppercase tracking-wider">Top Tag</span>
            <span className="font-bold font-mono text-indigo-400 truncate block px-1 uppercase" title={stats.dominantTag}>
              {stats.dominantTag}
            </span>
          </div>
        </div>

        {/* Quick Search & Advanced Type Filters */}
        <div className="space-y-2.5">
          {/* Text/Tag Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search solved (name, tag, code)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-800 transition-all"
              id="library-search-input"
            />
          </div>

          <div className="flex gap-2">
            {/* Rating Filter (Advanced Type Input) */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type rating..."
                value={ratingQuery}
                onChange={(e) => {
                  setRatingQuery(e.target.value);
                  setIsRatingDropdownOpen(true);
                }}
                onFocus={() => setIsRatingDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsRatingDropdownOpen(false), 220)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                id="library-rating-filter-input"
              />
              <span className="absolute right-2 top-2.5 text-[9px] font-mono text-zinc-600 pointer-events-none uppercase">R</span>
              
              {isRatingDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin">
                  <button
                    onClick={() => setRatingQuery("")}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] font-mono hover:bg-zinc-900 text-zinc-400 transition-colors"
                  >
                    [SHOW ALL RATINGS]
                  </button>
                  {ALL_RATINGS.filter(r => r.includes(ratingQuery)).map((rating) => {
                    const ratingColor = getRatingColorClass(parseInt(rating));
                    return (
                      <button
                        key={rating}
                        onClick={() => setRatingQuery(rating)}
                        className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-zinc-900 text-zinc-300 transition-colors flex items-center justify-between"
                      >
                        <span className={`font-mono font-bold ${ratingColor.text}`}>{rating}</span>
                        {solvedRatings.includes(parseInt(rating)) && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded font-mono">solved</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tag Filter (Advanced Type Input) */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type tag..."
                value={tagQuery}
                onChange={(e) => {
                  setTagQuery(e.target.value);
                  setIsTagDropdownOpen(true);
                }}
                onFocus={() => setIsTagDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsTagDropdownOpen(false), 220)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                id="library-tag-filter-input"
              />
              <span className="absolute right-2 top-2.5 text-[9px] font-mono text-zinc-600 pointer-events-none uppercase">T</span>
              
              {isTagDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin">
                  <button
                    onClick={() => setTagQuery("")}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] font-mono hover:bg-zinc-900 text-zinc-400 transition-colors"
                  >
                    [SHOW ALL TAGS]
                  </button>
                  {allAvailableTags
                    .filter(t => t.toLowerCase().includes(tagQuery.toLowerCase()))
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTagQuery(tag)}
                        className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-zinc-900 text-zinc-300 transition-colors flex items-center justify-between truncate"
                      >
                        <span className="truncate text-zinc-300 font-mono">#{tag}</span>
                        {solvedTags.includes(tag) && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded font-mono shrink-0">solved</span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Solve Marker Adder */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 relative">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
            + Quick Add Solved Problem
          </label>
          <div className="relative">
            <Plus className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search CF db by name or code (e.g. 158A)..."
              value={manualSearch}
              onChange={(e) => {
                setManualSearch(e.target.value);
                setIsManualFocused(true);
              }}
              onFocus={() => setIsManualFocused(true)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-900/40 transition-all"
              id="manual-solve-input"
            />
            {manualSearch && (
              <button
                onClick={() => setManualSearch("")}
                className="absolute right-2.5 top-2 text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Panel */}
          {isManualFocused && manualSearchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-20 max-h-56 overflow-y-auto divide-y divide-zinc-900">
              {manualSearchSuggestions.map((prob) => {
                const ratingInfo = getRatingColorClass(prob.rating);
                return (
                  <button
                    key={prob.uniqueKey}
                    onClick={() => handleManualSolve(prob)}
                    className="w-full text-left p-2 hover:bg-zinc-900 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[10px] font-mono shrink-0">
                          {prob.uniqueKey}
                        </span>
                        <span className="truncate">{prob.name}</span>
                      </div>
                      <div className="flex gap-1 mt-0.5 overflow-hidden">
                        {prob.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[9px] text-zinc-500 font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${ratingInfo.badge}`}>
                      {prob.rating}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Autocomplete empty state helper */}
          {isManualFocused && manualSearch && manualSearchSuggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-20 text-[10px] text-zinc-500 font-mono text-center">
              No matching unsolved problems found.
            </div>
          )}
        </div>
      </div>

      {/* Solved Problems List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-950/20">
        {filteredSolvedList.length > 0 ? (
          filteredSolvedList.map((item) => {
            const p = item.problem;
            const ratingColor = getRatingColorClass(p.rating);
            return (
              <div
                key={item.problem.uniqueKey}
                className="p-2.5 bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-800 rounded-lg flex items-center justify-between gap-3 transition-all duration-150 group shadow-sm"
                id={`solved-item-${p.uniqueKey}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border shrink-0 ${ratingColor.badge}`}>
                      {p.rating}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {p.uniqueKey}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-300 truncate font-display group-hover:text-zinc-100">
                    {p.name}
                  </h4>

                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Solved {new Date(item.solvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onUnsolve(p)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                  title="Remove from Solved"
                  id={`remove-solved-btn-${p.uniqueKey}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-zinc-800" />
            {solvedList.length === 0 ? (
              <p>No solved problems yet. Mark a generated card solved or add one above!</p>
            ) : (
              <p>No matching solved problems found for filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
