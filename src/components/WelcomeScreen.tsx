import React, { useState } from "react";
import { Info } from "lucide-react";
import { motion } from "motion/react";

interface WelcomeScreenProps {
  onStart: (playerName: string) => void;
  savedName: string;
}

export default function WelcomeScreen({ onStart, savedName }: WelcomeScreenProps) {
  const [showRules, setShowRules] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart("名無し探偵");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans overflow-x-hidden relative">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <main className="max-w-lg mx-auto w-full z-10 my-auto space-y-6">
        <div className="text-center">
          <h1 id="app-title" className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-300 drop-shadow-sm pb-1">
            論理パズル・クエスト
          </h1>
        </div>

        {/* Play & Info Section */}
        <motion.div 
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <button
              id="start-game-btn"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group cursor-pointer text-base"
            >
              開始
            </button>
          </form>

          {/* Collapsible Rules */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <button
              id="toggle-rules-btn"
              onClick={() => setShowRules(!showRules)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" /> 
              {showRules ? "ルール説明を閉じる" : "このゲームのルールと得点システム"}
            </button>

            {showRules && (
              <motion.div 
                className="mt-4 text-xs text-slate-400 space-y-2.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <p>💡 <strong className="text-slate-200">ステージ制パズル</strong>: レベルが上がるごとに難易度も上昇。すべての謎を解き明かしてください。</p>
                <p>⏱️ <strong className="text-slate-200">得点算出システム</strong>: 各レベルには基準点（1000〜2200点）があります。クリアまでの経過時間と、回答のミス（お手つき）の数によって持ち点が減点されます。</p>
                <p>🧚 <strong className="text-slate-200">AI妖精ログス</strong>: プレイ中にいつでも画面下の「ログス」に相談できます。答えを直接教えることなく、論理的な思考をサポートする優しいヒントをくれます（※Gemini AIを使用）。</p>
                <p>🏆 <strong className="text-slate-200">ランキング共有</strong>: 最終ステージクリア時のトータルスコアがランキングに登録され、世界中のプレイヤーと共有されます！</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 z-10 mt-8 max-w-4xl mx-auto w-full border-t border-slate-900/50">
        <p>© 2026 論理パズル・クエスト. Designed with Pure Logic.</p>
      </footer>
    </div>
  );
}
