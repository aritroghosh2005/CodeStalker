import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, CheckCircle, Circle, Flame, Tag, GitBranch, Loader2 } from "lucide-react";
import { Problem } from "../types";
import { getRatingColorClass } from "../utils/codeforces";

interface ProblemCardProps {
  problem: Problem;
  isSolved: boolean;
  onToggleSolve: (p: Problem) => void;
  onGetMoreLikeThis: (p: Problem) => void;
  moreLikeThisProblems?: Problem[];
  isLoadingMore: boolean;
  solvedKeys: Set<string>;
  onSubToggleSolve: (p: Problem) => void;
  onSubGetMoreLikeThis: (p: Problem) => void;
  subRecommendations?: Record<string, Problem[]>;
  subLoadingRecommendations?: Record<string, boolean>;
  depth?: number; // for nested recursive rendering depth indicator
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  isSolved,
  onToggleSolve,
  onGetMoreLikeThis,
  moreLikeThisProblems,
  isLoadingMore,
  solvedKeys,
  onSubToggleSolve,
  onSubGetMoreLikeThis,
  subRecommendations = {},
  subLoadingRecommendations = {},
  depth = 0,
}) => {
  const ratingDetails = getRatingColorClass(problem.rating);
  
  // Dynamic glow border for a "younger", lively dark-theme look
  const isCandidateMasterOrHigher = problem.rating >= 1900;
  const glowStyle = isSolved
    ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:bg-emerald-950/30"
    : isCandidateMasterOrHigher
    ? `${ratingDetails.border} ${ratingDetails.bg} shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-fuchsia-500/50`
    : `${ratingDetails.border} ${ratingDetails.bg} hover:border-zinc-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.2)]`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl border p-3 transition-all duration-150 ${glowStyle} group flex flex-col md:flex-row md:items-center justify-between gap-3`}
      id={`problem-card-${problem.uniqueKey}`}
    >
      {/* Visual Link Line for nested tree suggestions */}
      {depth > 0 && (
        <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-zinc-800/80" />
      )}

      {/* Left Block: Rating Badge & Problem Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rating Badge - Compact and colorful */}
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border shrink-0 ${ratingDetails.badge} flex items-center gap-1 shadow-sm shadow-black/10`}
          title={`${ratingDetails.name} Rank`}
        >
          <Flame className="w-3.5 h-3.5 text-current animate-pulse-slow" />
          <span>{problem.rating}</span>
        </span>

        {/* Index, Name & Inline tags */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link text-sm font-semibold text-zinc-100 hover:text-indigo-400 hover:underline transition-all flex items-center gap-1.5 truncate"
              id={`problem-link-${problem.uniqueKey}`}
            >
              <span className="text-zinc-500 font-mono text-xs shrink-0">{problem.index}</span>
              <span className={`truncate font-display tracking-wide ${isSolved ? "line-through text-zinc-500 font-medium" : ""}`}>
                {problem.name}
              </span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-indigo-400 shrink-0" />
            </a>
          </div>

          {/* Inline tags & Contest Info */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-zinc-500">
            <span className="font-mono text-zinc-600 font-semibold">
              {problem.contestId ? `CF ${problem.contestId}` : "Problemset"}
            </span>
            {problem.tags.length > 0 && (
              <>
                <span className="text-zinc-700 font-black">•</span>
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                  {problem.tags.length > 3 && (
                    <span className="text-[9px] text-zinc-600 font-mono" title={`${problem.tags.slice(3).join(", ")}`}>
                      +{problem.tags.length - 3} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Block: Actions (Similar recommendations, solve toggle) */}
      <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
        {/* Similar Recommendations Toggle Button */}
        <button
          onClick={() => onGetMoreLikeThis(problem)}
          disabled={isLoadingMore}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            moreLikeThisProblems && moreLikeThisProblems.length > 0
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30"
              : "bg-zinc-850/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700/60"
          } disabled:opacity-50`}
          title="Find similar standard Codeforces problems"
          id={`more-like-this-btn-${problem.uniqueKey}`}
        >
          {isLoadingMore ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <GitBranch className="w-3.5 h-3.5 text-indigo-400/80 group-hover:text-indigo-400" />
          )}
          <span>Similar</span>
        </button>

        {/* Mark Solved Toggle Button */}
        <button
          onClick={() => onToggleSolve(problem)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
            isSolved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
              : "bg-zinc-850/80 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
          title={isSolved ? "Mark as Unsolved" : "Mark as Solved"}
          id={`toggle-solve-btn-${problem.uniqueKey}`}
        >
          {isSolved ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10 shrink-0" />
              <span className="hidden sm:inline">Solved</span>
            </>
          ) : (
            <>
              <Circle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Mark Solved</span>
            </>
          )}
        </button>
      </div>

      {/* Nested Recommendations Panel */}
      <AnimatePresence>
        {moreLikeThisProblems && moreLikeThisProblems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden mt-2 pl-4 border-l-2 border-indigo-500/20 space-y-2 pt-2 col-span-1 md:col-span-12"
          >
            <div className="text-[10px] font-mono font-bold text-indigo-400/80 mb-1.5 flex items-center gap-1">
              <GitBranch className="w-3 h-3 rotate-90" />
              <span>PRACTICE NEST (RATED {problem.rating - Math.min(200, problem.rating - 800)} - {problem.rating + 300})</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreLikeThisProblems.map((subProblem) => {
                const subIsSolved = solvedKeys.has(subProblem.uniqueKey);
                return (
                  <ProblemCard
                    key={subProblem.uniqueKey}
                    problem={subProblem}
                    isSolved={subIsSolved}
                    onToggleSolve={onSubToggleSolve}
                    onGetMoreLikeThis={onSubGetMoreLikeThis}
                    moreLikeThisProblems={subRecommendations[subProblem.uniqueKey]}
                    isLoadingMore={!!subLoadingRecommendations[subProblem.uniqueKey]}
                    solvedKeys={solvedKeys}
                    onSubToggleSolve={onSubToggleSolve}
                    onSubGetMoreLikeThis={onSubGetMoreLikeThis}
                    subRecommendations={subRecommendations}
                    subLoadingRecommendations={subLoadingRecommendations}
                    depth={depth + 1}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
