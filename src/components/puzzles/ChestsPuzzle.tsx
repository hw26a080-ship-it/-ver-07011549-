import { useState } from "react";
import { ChestsLevel } from "../../types";
import { HelpCircle, Sparkles, Gem, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChestsPuzzleProps {
  level: ChestsLevel;
  onSuccess: (score: number) => void;
  onFail: () => void;
}

export default function ChestsPuzzle({ level, onSuccess, onFail }: ChestsPuzzleProps) {
  // 開けられた宝箱ID
  const [openedChestId, setOpenedChestId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOpenChest = (chestId: string) => {
    if (openedChestId) return; // すでに開けている場合は何もしない

    setOpenedChestId(chestId);
    setErrorMsg("");

    if (chestId === level.correctChestId) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(level.points);
      }, 2000);
    } else {
      setIsSuccess(false);
      setErrorMsg("宝箱を開けたが、中身は空っぽだった！碑文の真偽をもう一度よく読み解いてみよう。");
      onFail(); // お手つきペナルティ
    }
  };

  const handleRetry = () => {
    setOpenedChestId(null);
    setErrorMsg("");
    setIsSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" /> 碑文の謎
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {level.question}
        </p>
      </div>

      {/* Chests visual board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {level.chests.map((chest) => {
          const isThisOpened = openedChestId === chest.id;
          const isCorrect = chest.id === level.correctChestId;

          return (
            <motion.div
              key={chest.id}
              whileHover={!openedChestId ? { y: -6, scale: 1.02 } : {}}
              className={`rounded-2xl border p-5 flex flex-col items-center justify-between min-h-[260px] text-center relative transition ${
                openedChestId 
                  ? isThisOpened
                    ? isCorrect
                      ? "bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "bg-rose-950/20 border-rose-500 shadow-lg shadow-rose-500/10"
                    : "bg-slate-900/10 border-slate-900 opacity-40"
                  : "bg-slate-900/40 border-slate-800 hover:border-amber-500/30 cursor-pointer"
              }`}
              onClick={() => !openedChestId && handleOpenChest(chest.id)}
            >
              <div className="w-full">
                {/* Chest Label */}
                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${chest.color} mb-4`}>
                  {chest.label}
                </span>

                {/* Speech Bubble / Inscription */}
                <div className="relative bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 italic min-h-[60px] flex items-center justify-center">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-t border-l border-slate-800 rotate-45"></div>
                  {chest.statement}
                </div>
              </div>

              {/* Chest Chest Visual Animation */}
              <div className="my-6">
                <AnimatePresence mode="wait">
                  {isThisOpened ? (
                    isCorrect ? (
                      <motion.div
                        key="opened-correct"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, 0] }}
                        className="text-6xl filter drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] flex flex-col items-center gap-1"
                      >
                        💎
                        <span className="text-[10px] text-amber-400 font-bold tracking-wider animate-pulse mt-2">
                          賢者の石 発見！
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="opened-incorrect"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl grayscale filter contrast-75 flex flex-col items-center gap-1"
                      >
                        💨
                        <span className="text-[10px] text-slate-500 font-bold mt-2">
                          空っぽ...
                        </span>
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      key="closed"
                      className="text-6xl hover:scale-105 active:scale-95 transition"
                    >
                      🧰
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status footer button inside card */}
              {!openedChestId && (
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-lg">
                  この宝箱を開ける
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Feedback status log */}
      <AnimatePresence>
        {openedChestId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5 text-xs">
              {isSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 px-3 py-2 rounded-xl font-bold">
                  <Sparkles className="w-4 h-4 animate-spin" /> 見事に正解！賢者の石を手に入れた！
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/20 border border-rose-500/30 px-3 py-2 rounded-xl font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {errorMsg}
                </div>
              )}
            </div>

            {!isSuccess && (
              <button
                id="retry-chest-btn"
                onClick={handleRetry}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                別の宝箱を試す
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
