import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Flame,
  Award,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Database,
  WifiOff,
  BookOpen,
  LayoutGrid,
  TrendingUp,
  Github
} from "lucide-react";
import { Problem, SolvedProblem, Generation } from "./types";
import {
  fetchProblemSet,
  generateInitialProblems,
  generateMoreLikeThis,
  getRatingColorClass
} from "./utils/codeforces";
import { ProblemCard } from "./components/ProblemCard";
import { SolvedLibrary } from "./components/SolvedLibrary";

export default function App() {
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbStatus, setDbStatus] = useState("Connecting to Codeforces API...");
  const [isOffline, setIsOffline] = useState(false);
  const [dbRefreshCount, setDbRefreshCount] = useState(0);

  // User control state
  const [baseRating, setBaseRating] = useState<number>(1200);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);

  // Solved problems library synced with localStorage
  const [solvedList, setSolvedList] = useState<SolvedProblem[]>(() => {
    try {
      const data = localStorage.getItem("codestalker_solved_problems");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  // Set of solved keys for rapid O(1) lookups
  const solvedKeys = useMemo(() => new Set(solvedList.map((item) => item.problem.uniqueKey)), [solvedList]);

  // Nested recommendations states (key: subproblem key -> problems)
  const [subRecommendations, setSubRecommendations] = useState<Record<string, Problem[]>>({});
  const [subLoadingRecommendations, setSubLoadingRecommendations] = useState<Record<string, boolean>>({});

  // Mobile layout tab toggle: "generator" vs "library"
  const [activeTab, setActiveTab] = useState<"generator" | "library">("generator");

  // Load the full Codeforces problemset on mount or when refresh is triggered
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoadingDb(true);
      try {
        const result = await fetchProblemSet((status) => {
          if (active) setDbStatus(status);
        }, dbRefreshCount > 0); // force refresh on explicit user trigger
        
        if (active) {
          setAllProblems(result.problems);
          setIsOffline(result.isOfflineFallback);
          setIsLoadingDb(false);
        }
      } catch (err) {
        if (active) {
          setDbStatus("Database indexing failed.");
          setIsLoadingDb(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [dbRefreshCount]);

  // Auto-generate some starter problems once the database loads
  useEffect(() => {
    if (!isLoadingDb && allProblems.length > 0 && !currentGeneration) {
      handleGenerate();
    }
  }, [allProblems, isLoadingDb]);

  // Main Generator: selects 5 random problems (X, X+100, X+200, X+300, X+400)
  const handleGenerate = () => {
    if (allProblems.length === 0) return;

    // Reset sub-level recursive recommendation states to keep things tidy
    setSubRecommendations({});
    setSubLoadingRecommendations({});

    const selected = generateInitialProblems(allProblems, baseRating, solvedKeys);
    
    setCurrentGeneration({
      baseRating,
      generatedAt: new Date().toISOString(),
      problems: selected,
      recommendations: {},
      loadingRecommendations: {}
    });
  };

  // Toggle solved state of a problem
  const handleToggleSolve = (p: Problem) => {
    const isCurrentlySolved = solvedKeys.has(p.uniqueKey);
    let updatedList: SolvedProblem[];

    if (isCurrentlySolved) {
      updatedList = solvedList.filter((item) => item.problem.uniqueKey !== p.uniqueKey);
    } else {
      const newSolvedItem: SolvedProblem = {
        problem: p,
        solvedAt: new Date().toISOString()
      };
      updatedList = [newSolvedItem, ...solvedList];
    }

    setSolvedList(updatedList);
    localStorage.setItem("codestalker_solved_problems", JSON.stringify(updatedList));
  };

  // Generate 5 recommendations for a top-level problem
  const handleGetMoreLikeThis = (p: Problem) => {
    if (!currentGeneration) return;

    // Toggle close if already open
    if (currentGeneration.recommendations[p.uniqueKey]) {
      setCurrentGeneration((prev) => {
        if (!prev) return null;
        const updatedRecs = { ...prev.recommendations };
        delete updatedRecs[p.uniqueKey];
        return {
          ...prev,
          recommendations: updatedRecs
        };
      });
      return;
    }

    // Set loading indicator
    setCurrentGeneration((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        loadingRecommendations: { ...prev.loadingRecommendations, [p.uniqueKey]: true }
      };
    });

    // 400ms loading delay for extreme technical immersion effect
    setTimeout(() => {
      const recs = generateMoreLikeThis(allProblems, p, currentGeneration.baseRating, solvedKeys);
      setCurrentGeneration((prev) => {
        if (!prev) return null;
        const updatedLoading = { ...prev.loadingRecommendations };
        delete updatedLoading[p.uniqueKey];
        return {
          ...prev,
          recommendations: { ...prev.recommendations, [p.uniqueKey]: recs },
          loadingRecommendations: updatedLoading
        };
      });
    }, 400);
  };

  // Generate recommendations recursively for similar suggestions
  const handleSubGetMoreLikeThis = (p: Problem) => {
    if (subRecommendations[p.uniqueKey]) {
      setSubRecommendations((prev) => {
        const next = { ...prev };
        delete next[p.uniqueKey];
        return next;
      });
      return;
    }

    setSubLoadingRecommendations((prev) => ({ ...prev, [p.uniqueKey]: true }));

    setTimeout(() => {
      const recs = generateMoreLikeThis(allProblems, p, currentGeneration?.baseRating || 1200, solvedKeys);
      setSubRecommendations((prev) => ({ ...prev, [p.uniqueKey]: recs }));
      setSubLoadingRecommendations((prev) => {
        const next = { ...prev };
        delete next[p.uniqueKey];
        return next;
      });
    }, 400);
  };

  // Map out the targeted ratings array for UI display
  const targetedRatings = useMemo(() => {
    return [baseRating, baseRating + 100, baseRating + 200, baseRating + 300, baseRating + 400];
  }, [baseRating]);

  // Compute stats milestones
  const solveBadgeInfo = useMemo(() => {
    const solvedCount = solvedList.length;
    if (solvedCount < 5) return { rank: "Newbie Scout", description: "Solving first assignments" };
    if (solvedCount < 15) return { rank: "Specialist Raider", description: "Navigating common tricksets" };
    if (solvedCount < 30) return { rank: "Expert Stalker", description: "Mastering ratings with speed" };
    return { rank: "Grandmaster Stalker", description: "Untangled the toughest algorithms" };
  }, [solvedList]);

  // Calculate dynamic circular progress tracker for the current Hunt
  const huntSolvedCount = useMemo(() => {
    if (!currentGeneration) return 0;
    return currentGeneration.problems.filter((p) => solvedKeys.has(p.uniqueKey)).length;
  }, [currentGeneration, solvedKeys]);

  // SVG Progress Tracker math
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (huntSolvedCount / 5) * circumference;

  // Codeforces rating to hex color mapping for range slider track and active highlights
  const getRatingHexColor = (rating: number): string => {
    if (rating < 1200) return "#808080"; // Gray
    if (rating < 1400) return "#008000"; // Dark Green
    if (rating < 1600) return "#03a89e"; // Cyan
    if (rating < 1900) return "#3b82f6"; // Blue
    if (rating < 2200) return "#aa00aa"; // Violet/Purple
    if (rating < 2400) return "#ff8c00"; // Orange
    return "#ff0000"; // Red
  };

  const currentHexColor = getRatingHexColor(baseRating);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white" id="codestalker-app">
      {/* Decorative ambient glowing grids in background for lively 'young' look */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-indigo-500/5 via-fuchsia-500/0 to-transparent pointer-events-none" />

      {/* Immersive Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-10 py-4 px-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-xl bg-zinc-950 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent uppercase font-display">
                  CodeStalker
                </h1>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                    CF Engine v2.0
                  </span>
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)] font-mono px-2.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
                    <span>made with 💖 by Aritro</span>
                    <span className="text-zinc-600 font-bold">•</span>
                    <a href="https://codeforces.com/profile/Greninja2005" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline hover:text-fuchsia-300">Greninja2005</a>
                  </span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium mt-0.5">
                Target, track, and practice Codeforces problems on demand
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Database Sync Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 shadow-inner">
              {isLoadingDb ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Indexing...</span>
                </>
              ) : isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-400 font-medium">Offline library loaded</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">
                    CF Database Online ({allProblems.length.toLocaleString()})
                  </span>
                </>
              )}
              {!isLoadingDb && (
                <button
                  onClick={() => setDbRefreshCount((c) => c + 1)}
                  className="ml-2 p-1 text-zinc-500 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                  title="Reload Codeforces library"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Solved Count display */}
            <div className="flex items-center gap-3 bg-zinc-900/60 px-4 py-2 border border-zinc-800 rounded-xl shadow-lg">
              <div className="text-right">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{solveBadgeInfo.rank}</div>
                <div className="text-[10px] text-zinc-500">{solveBadgeInfo.description}</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold font-mono text-emerald-400 text-sm shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse-slow">
                {solvedList.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Database Fetching / Loading Screen */}
      <AnimatePresence>
        {isLoadingDb && allProblems.length === 0 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 relative">
              <Target className="w-8 h-8 text-indigo-400 animate-pulse" />
              <div className="absolute inset-0 border border-indigo-500/20 rounded-2xl animate-ping opacity-75" />
            </div>
            <h2 className="text-lg font-display font-bold text-zinc-100 mb-2 uppercase tracking-wide">
              Initializing CodeStalker
            </h2>
            <div className="font-mono text-xs text-zinc-400 space-y-1 bg-zinc-950 p-3 rounded-lg border border-zinc-800 w-full text-left">
              <div className="text-emerald-400/80">&gt; npm run fetch-problemset</div>
              <div>&gt; status: {dbStatus}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      {!isLoadingDb && allProblems.length > 0 && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          {/* Mobile view navigation tab switch (only visible on small screens) */}
          <div className="lg:hidden flex w-full p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl col-span-1 shadow-md">
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "generator" ? "bg-zinc-800 text-zinc-50 shadow-md" : "text-zinc-400"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Hunt Panel</span>
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "library" ? "bg-zinc-800 text-zinc-50 shadow-md" : "text-zinc-400"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Solved Library ({solvedList.length})</span>
            </button>
          </div>

          {/* COLUMN 1 (LEFT SIDE): The Solved Problems Library (4 cols on lg) - INTERCHANGED TO LEFT */}
          <div
            className={`col-span-1 lg:col-span-4 h-[calc(100vh-140px)] sticky top-[92px] ${
              activeTab === "library" ? "block" : "hidden lg:block"
            }`}
          >
            <SolvedLibrary
              solvedList={solvedList}
              allProblems={allProblems}
              onUnsolve={handleToggleSolve}
              onSolve={handleToggleSolve}
            />
          </div>

          {/* COLUMN 2 (RIGHT SIDE): Controls & Core Problem Generation Grid (8 cols on lg) - INTERCHANGED TO RIGHT */}
          <div
            className={`col-span-1 lg:col-span-8 space-y-6 ${
              activeTab === "generator" ? "block" : "hidden lg:block"
            }`}
          >
            {/* Rating Target Selection Block */}
            <section className="p-6 bg-zinc-900/25 border border-zinc-850 rounded-2xl relative overflow-hidden shadow-lg backdrop-blur-sm">
              {/* Vibrant subtle glow inside range block */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] font-display font-black text-6xl text-fuchsia-400 pointer-events-none select-none">
                TARGET
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-sm font-display font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-fuchsia-400" />
                    Set Stalking Range
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select a rating X. CodeStalker will generate problems starting from X up to X+400.
                  </p>
                </div>

                {/* Rating Display Panel */}
                <div className="flex items-center gap-2 font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 shadow-inner">
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Rating X</span>
                    <span className="text-sm font-bold text-fuchsia-400">{baseRating}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                  <div className="text-left">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Ceiling</span>
                    <span className="text-sm font-bold text-indigo-400">{baseRating + 400}</span>
                  </div>
                </div>
              </div>

              {/* Slider for Rating X Selection */}
              <div className="space-y-4">
                <input
                  type="range"
                  min="800"
                  max="3100"
                  step="100"
                  value={baseRating}
                  onChange={(e) => setBaseRating(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer h-2.5 rounded-lg appearance-none shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-zinc-800 transition-all focus:outline-none"
                  style={{
                    accentColor: currentHexColor,
                    background: "linear-gradient(to right, #808080 0%, #808080 17.39%, #008000 17.39%, #008000 26.09%, #03a89e 26.09%, #03a89e 34.78%, #3b82f6 34.78%, #3b82f6 47.83%, #aa00aa 47.83%, #aa00aa 60.87%, #ff8c00 60.87%, #ff8c00 69.57%, #ff0000 69.57%, #ff0000 100%)"
                  }}
                  id="rating-range-slider"
                />

                {/* Targeted rating milestones list */}
                <div className="grid grid-cols-5 gap-1.5 pt-2">
                  {targetedRatings.map((rating, index) => {
                    const ratingColor = getRatingColorClass(rating);
                    return (
                      <div
                        key={rating}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          index === 0
                            ? `${ratingColor.bg} ${ratingColor.border} ${ratingColor.text} shadow-lg shadow-black/15 scale-[1.03] ring-1 ring-zinc-750`
                            : "bg-zinc-950/40 border-zinc-850"
                        }`}
                      >
                        <div className={`text-[9px] font-mono font-bold ${index === 0 ? "" : ratingColor.text}`}>
                          +{index * 100}
                        </div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${index === 0 ? "text-white" : "text-zinc-200"}`}>
                          {rating}
                        </div>
                        <div className="text-[8px] text-zinc-500 truncate mt-0.5 hidden sm:block font-mono">
                          {ratingColor.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Action Block */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerate}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 active:translate-y-0.5 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all group cursor-pointer"
                    id="generate-stalk-btn"
                  >
                    <Target className="w-4 h-4 transition-transform group-hover:rotate-45" />
                    <span>GENERATE NEW HUNT</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Generated Problems List Display */}
            {currentGeneration ? (
              <section className="space-y-4">
                {/* Hunt Header with progress circle and metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl shadow-md">
                  <div className="space-y-1">
                    <h2 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-fuchsia-400" />
                      Active Hunt created {new Date(currentGeneration.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Autofocus range: <span className="text-fuchsia-400 font-bold">{currentGeneration.baseRating}</span> to <span className="text-indigo-400 font-bold">{currentGeneration.baseRating + 400}</span>
                    </p>
                  </div>
                  
                  {/* Dynamic Circular Hunt Progress Tracker */}
                  <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-850 rounded-xl px-4 py-2 shadow-inner self-end sm:self-auto shrink-0">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Circle path outline */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-zinc-800"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        {/* Glowing progress stroke */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-emerald-400 transition-all duration-300 ease-out"
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Dynamic fractional indicator */}
                      <span className="absolute text-[10px] font-bold font-mono text-emerald-400">
                        {huntSolvedCount}/5
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Hunt Status</span>
                      <span className="text-xs font-black text-zinc-200">
                        {huntSolvedCount === 5 ? "🎉 Target Cleared!" : `${5 - huntSolvedCount} remaining`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact, rectangular strips list */}
                <div className="grid grid-cols-1 gap-2.5" id="generated-problems-list">
                  {currentGeneration.problems.map((problem) => {
                    const isSolved = solvedKeys.has(problem.uniqueKey);
                    return (
                      <ProblemCard
                        key={problem.uniqueKey}
                        problem={problem}
                        isSolved={isSolved}
                        onToggleSolve={handleToggleSolve}
                        onGetMoreLikeThis={handleGetMoreLikeThis}
                        moreLikeThisProblems={currentGeneration.recommendations[problem.uniqueKey]}
                        isLoadingMore={!!currentGeneration.loadingRecommendations[problem.uniqueKey]}
                        solvedKeys={solvedKeys}
                        onSubToggleSolve={handleToggleSolve}
                        onSubGetMoreLikeThis={handleSubGetMoreLikeThis}
                        subRecommendations={subRecommendations}
                        subLoadingRecommendations={subLoadingRecommendations}
                      />
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="p-16 text-center text-zinc-500 font-mono text-xs bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                Choose a rating and click Generate above to track target problems!
              </div>
            )}
          </div>
        </main>
      )}

      {/* Elegant Footer */}
      <footer className="mt-auto py-4 border-t border-zinc-900 text-center text-[10px] font-mono text-zinc-500 px-6 bg-zinc-950 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 CodeStalker • Powered by Codeforces free public API • Made with 💖 by{" "}
            <a href="https://codeforces.com/profile/Greninja2005" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold">Aritro (Greninja2005)</a>
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-400">
              Session Problems Generated: <b className="text-zinc-200">{allProblems.length > 0 ? "24" : "0"}</b> • Unique Tags: <b className="text-zinc-200">12</b>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
