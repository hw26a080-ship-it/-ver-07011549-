import React, { useState } from "react";
import { Level } from "../types";
import { Sparkles, X, MessageSquare, Send, Bot, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIHintDialogProps {
  level: Level;
  currentInputState?: any; // パズルの現在の解答状態
  onClose: () => void;
}

export default function AIHintDialog({ level, currentInputState, onClose }: AIHintDialogProps) {
  const [query, setQuery] = useState("");
  const [hintResponse, setHintResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    try {
      setLoading(true);
      setError("");
      setHintResponse("");

      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          levelTitle: level.title,
          question: level.question,
          hints: level.hints,
          currentInput: currentInputState || {},
          userStuckMessage: cleanQuery,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHintResponse(data.hint);
        setQuery(""); // テキストボックスをクリア
      } else {
        throw new Error("ヒントの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("妖精ログスとの交信に失敗したよ。もう一度試してみてね！");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center text-xl shadow">
              🧚
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                論理の妖精・ログス
                <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded font-mono">AI GUIDANCE</span>
              </h3>
              <p className="text-[10px] text-slate-400">答えを教えずに、解決の手がかりを授けるよ</p>
            </div>
          </div>
          <button
            id="close-hint-dialog"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800/40 border border-slate-800/80 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Main Content Area */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[340px] flex-grow">
          {/* Default Logs Welcome message */}
          <div className="flex items-start gap-3">
            <div className="text-2xl p-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex-shrink-0">🧚</div>
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed">
              「やあ！ボクはログスだよ。今解いている『{level.title}』で何か気になることや、どこで考えが詰まっちゃったか教えてほしいな。
              考えるヒントを一緒に探そう！」
            </div>
          </div>

          {/* AI Response Bubble */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3"
              >
                <div className="text-2xl p-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex-shrink-0 animate-bounce">🧚</div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-500 italic flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ログスが思考の糸を紡いでいるよ...
                </div>
              </motion.div>
            )}

            {hintResponse && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="text-2xl p-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex-shrink-0">🧚</div>
                <div className="bg-indigo-600/10 border border-indigo-500/30 text-slate-200 rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-lg">
                  {hintResponse}
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-rose-950/30 border border-rose-900/40 text-rose-400 text-xs rounded-xl p-3 text-center font-semibold"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dialog Query Input Panel */}
        <div className="bg-slate-950/40 border-t border-slate-800/80 p-4">
          <form onSubmit={handleSendQuery} className="flex gap-2">
            <input
              id="ai-query-input"
              type="text"
              maxLength={100}
              disabled={loading}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: 天秤の1回目の分け方がわかりません"
              className="flex-grow bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs outline-none transition disabled:opacity-50"
            />
            <button
              id="ai-query-send-btn"
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
