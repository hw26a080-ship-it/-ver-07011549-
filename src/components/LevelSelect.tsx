import { Level } from "../types";
import { Lock, Unlock, CheckCircle, ArrowLeft, Trophy, Star, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface LevelSelectProps {
  levels: Level[];
  clearedLevelIds: number[];
  levelScores: { [levelId: number]: number };
  levelTimes: { [levelId: number]: number };
  playerName: string;
  onSelectLevel: (levelId: number) => void;
  onBackToWelcome: () => void;
}

export default function LevelSelect({
  levels,
  clearedLevelIds,
  levelScores,
  levelTimes,
  playerName,
  onSelectLevel,
  onBackToWelcome,
}: LevelSelectProps) {
  
  const totalScore = Object.values(levelScores).reduce((sum, score) => sum + score, 0);
  const totalCleared = clearedLevelIds.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans overflow-x-hidden relative flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full z-10 flex-grow">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-8">
          <button
            id="back-to-welcome-btn"
            onClick={onBackToWelcome}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> タイトルへ戻る
          </button>
        </div>

        {/* Current status card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold mb-1">現在のスコア</span>
            <span id="total-score-display" className="text-2xl font-bold text-indigo-400 font-mono">
              {totalScore.toLocaleString()} <span className="text-xs text-slate-500">pts</span>
            </span>
          </div>
          <div className="flex flex-col justify-center sm:items-end">
            {totalCleared === levels.length && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <Trophy className="w-3.5 h-3.5 animate-bounce" /> すべての謎を解き明かした！
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
          <Unlock className="w-4 h-4 text-indigo-400" /> ステージを選択
        </h2>

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((level, index) => {
            // すべてのステージを最初からプレイ可能にする
            const isUnlocked = true;
            const isCleared = clearedLevelIds.includes(level.id);
            const score = levelScores[level.id] || 0;
            const time = levelTimes[level.id] || 0;

            const difficultyColors = {
              Easy: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              Medium: "bg-blue-500/10 border-blue-500/30 text-blue-400",
              Hard: "bg-amber-500/10 border-amber-500/30 text-amber-400",
              Expert: "bg-rose-500/10 border-rose-500/30 text-rose-400",
            };

            return (
              <motion.div
                key={level.id}
                whileHover={isUnlocked ? { y: -4, scale: 1.01 } : {}}
                transition={{ duration: 0.2 }}
                className={`relative rounded-2xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 cursor-pointer shadow-lg"
                    : "bg-slate-950 border-slate-900 opacity-50 cursor-not-allowed select-none"
                }`}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
              >
                <div className="p-5 flex-grow">
                  {/* Badge & Info Row */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${difficultyColors[level.difficulty]}`}>
                      {level.difficulty}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {isCleared && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" /> クリア済
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1.5">
                    <span className="text-slate-400 text-xs font-mono">Lv.{level.id}</span>
                    {level.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {level.description}
                  </p>
                </div>

                {/* Foot/Stats Bar */}
                <div className="border-t border-slate-800/60 px-5 py-3 bg-slate-950/40 rounded-b-2xl flex justify-between items-center text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Star className="w-3.5 h-3.5 text-indigo-400" />
                    基準点: <span className="font-bold text-slate-300 font-mono">{level.points} pts</span>
                  </div>
                  {isCleared && (
                    <div className="text-right">
                      <span className="font-semibold text-emerald-400 font-mono">{score} pts</span>
                      <span className="mx-1">/</span>
                      <span className="font-mono">{Math.floor(time / 60)}分{time % 60}秒</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-slate-700 z-10 mt-12 max-w-4xl mx-auto w-full border-t border-slate-900/50">
        <p>© 2026 論理パズル・クエスト. Designed with Pure Logic.</p>
      </footer>
    </div>
  );
}
