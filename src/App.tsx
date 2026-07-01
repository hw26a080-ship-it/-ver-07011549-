import { useState, useEffect, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LevelSelect from "./components/LevelSelect";
import AIHintDialog from "./components/AIHintDialog";
import LiarPuzzle from "./components/puzzles/LiarPuzzle";
import RiverPuzzle from "./components/puzzles/RiverPuzzle";
import ChestsPuzzle from "./components/puzzles/ChestsPuzzle";
import GridPuzzle from "./components/puzzles/GridPuzzle";
import ScalePuzzle from "./components/puzzles/ScalePuzzle";
import { levels } from "./data/levels";
import { Level, RankingEntry } from "./types";
import { 
  Trophy, Clock, Award, ShieldAlert, ChevronRight, HelpCircle, 
  Sparkles, ArrowLeft, Lightbulb, UserCheck, MessageSquare, ListMusic, Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("logic_quest_player_name") || "";
  });

  // 画面遷移: "welcome" | "level_select" | "gameplay" | "victory"
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "level_select" | "gameplay" | "victory">("welcome");

  // ゲームクリア履歴
  const [clearedLevelIds, setClearedLevelIds] = useState<number[]>([]);
  const [levelScores, setLevelScores] = useState<{ [levelId: number]: number }>({});
  const [levelTimes, setLevelTimes] = useState<{ [levelId: number]: number }>({});

  // プレイ中レベル
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  
  // 現在のレベル内でのタイマー
  const [levelTimer, setLevelTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 現在のレベル内でのミス回数
  const [missCount, setMissCount] = useState(0);

  // 通常ヒントの開示数 (0〜3)
  const [hintCount, setHintCount] = useState(0);

  // AIヒントダイアログの表示
  const [showAIHint, setShowAIHint] = useState(false);

  // レベル5用: ランダムに選ばれる偽金貨のインデックス
  const [fakeCoinIndex, setFakeCoinIndex] = useState(0);

  // 全レベルクリア（ゲーム全体の勝利）時のランキング登録状態
  const [rankingSubmitted, setRankingSubmitted] = useState(false);
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [submittingRanking, setSubmittingRanking] = useState(false);

  // タイマーの起動と停止
  useEffect(() => {
    if (currentScreen === "gameplay") {
      setLevelTimer(0);
      timerRef.current = setInterval(() => {
        setLevelTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentScreen, currentLevelId]);

  // ローカルストレージへの名前保存
  const handleStartGame = (name: string) => {
    setPlayerName(name);
    localStorage.setItem("logic_quest_player_name", name);
    setCurrentScreen("level_select");
  };

  // レベル選択時の初期化
  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setMissCount(0);
    setHintCount(0);
    setShowAIHint(false);
    
    // レベル5なら偽の金貨を動的に決定
    if (levelId === 5) {
      const randIndex = Math.floor(Math.random() * 8);
      setFakeCoinIndex(randIndex);
      console.log(`[DEBUG] Level 5 Fake Coin Index is: ${randIndex}`);
    }

    setCurrentScreen("gameplay");
  };

  // レベルクリア時の処理
  const handleLevelClear = (basePoints: number) => {
    if (!currentLevelId) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // スコア計算: Base - (時間ペナルティ: 1秒ごとに2点) - (ミスペナルティ: 1ミスにつき100点)
    const timePenalty = levelTimer * 2;
    const missPenalty = missCount * 100;
    const finalScore = Math.max(100, basePoints - timePenalty - missPenalty);

    // クリア状態を反映
    setLevelScores((prev) => ({ ...prev, [currentLevelId]: finalScore }));
    setLevelTimes((prev) => ({ ...prev, [currentLevelId]: levelTimer }));
    
    setClearedLevelIds((prev) => {
      if (!prev.includes(currentLevelId)) {
        return [...prev, currentLevelId];
      }
      return prev;
    });

    // 演出表示後に全クリア判定（すべてのレベルがクリアされたか） or レベル選択画面へ
    const allCleared = [...new Set([...clearedLevelIds, currentLevelId])].length === levels.length;
    setTimeout(() => {
      if (allCleared) {
        setCurrentScreen("victory");
        fetchGlobalRanking();
      } else {
        setCurrentScreen("level_select");
      }
      setCurrentLevelId(null);
    }, 500);
  };

  // 回答失敗（お手つきペナルティ）
  const handleLevelFail = () => {
    setMissCount((prev) => prev + 1);
  };

  // グローバルランキングの取得
  const fetchGlobalRanking = async () => {
    try {
      const res = await fetch("/api/ranking");
      if (res.ok) {
        const data = await res.json();
        setGlobalRanking(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // スコアのサーバー送信
  const handleSubmitRanking = async () => {
    const stagesCleared = clearedLevelIds.length;

    try {
      setSubmittingRanking(true);
      const res = await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          score: totalScore,
          stagesCleared,
          totalTime,
        }),
      });

      if (res.ok) {
        setRankingSubmitted(true);
        fetchGlobalRanking(); // 最新のランキングを反映
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRanking(false);
    }
  };

  // 完全リセットしてタイトルへ
  const handleResetAllAndWelcome = () => {
    setClearedLevelIds([]);
    setLevelScores({});
    setLevelTimes({});
    setCurrentLevelId(null);
    setRankingSubmitted(false);
    setCurrentScreen("welcome");
  };

  // 現在プレイ中のレベル情報
  const currentLevel = levels.find((l) => l.id === currentLevelId);

  // トータルのスコアとタイムの算出
  const totalScore = (Object.values(levelScores) as number[]).reduce((sum, score) => sum + score, 0);
  const totalTime = (Object.values(levelTimes) as number[]).reduce((sum, time) => sum + time, 0);

  // リアルタイムの現在の予想獲得スコアの計算
  const getEstimatedScore = () => {
    if (!currentLevel) return 0;
    const timePenalty = levelTimer * 2;
    const missPenalty = missCount * 100;
    return Math.max(100, currentLevel.points - timePenalty - missPenalty);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Welcome Screen */}
      {currentScreen === "welcome" && (
        <WelcomeScreen 
          onStart={handleStartGame} 
          savedName={playerName} 
        />
      )}

      {/* 2. Level Select Screen */}
      {currentScreen === "level_select" && (
        <LevelSelect
          levels={levels}
          clearedLevelIds={clearedLevelIds}
          levelScores={levelScores}
          levelTimes={levelTimes}
          playerName={playerName}
          onSelectLevel={handleSelectLevel}
          onBackToWelcome={() => setCurrentScreen("welcome")}
        />
      )}

      {/* 3. Gameplay Screen */}
      {currentScreen === "gameplay" && currentLevel && (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8 relative">
          
          {/* Header dashboard */}
          <div className="max-w-5xl mx-auto w-full z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-6 gap-3">
              
              {/* Left Back and Title info */}
              <div className="flex items-center gap-3">
                <button
                  id="quit-game-btn"
                  onClick={() => setCurrentScreen("level_select")}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="ステージ選択に戻る"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">STAGE {currentLevel.id}</span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-1.5">
                    {currentLevel.title}
                  </h2>
                </div>
              </div>

              {/* Right current metrics */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                {/* Timer metric */}
                <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{Math.floor(levelTimer / 60)}分{levelTimer % 60}秒</span>
                </div>

                {/* Miss metric */}
                <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>お手つき: <strong className="text-amber-400 font-mono">{missCount}</strong> 回</span>
                </div>

                {/* Realtime estimated score */}
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>予想スコア: <strong className="text-slate-100 font-mono">{getEstimatedScore()}</strong> pts</span>
                </div>
              </div>
            </div>

            {/* Dynamic rendering of specific logic puzzles */}
            <main className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-20">
              
              {/* Puzzle Interactive Canvas */}
              <div className="md:col-span-8 space-y-6">
                {currentLevel.type === "liar" && (
                  <LiarPuzzle
                    level={currentLevel as any}
                    onSuccess={handleLevelClear}
                    onFail={handleLevelFail}
                  />
                )}
                {currentLevel.type === "river" && (
                  <RiverPuzzle
                    level={currentLevel as any}
                    onSuccess={handleLevelClear}
                    onFail={handleLevelFail}
                  />
                )}
                {currentLevel.type === "chests" && (
                  <ChestsPuzzle
                    level={currentLevel as any}
                    onSuccess={handleLevelClear}
                    onFail={handleLevelFail}
                  />
                )}
                {currentLevel.type === "grid" && (
                  <GridPuzzle
                    level={currentLevel as any}
                    onSuccess={handleLevelClear}
                    onFail={handleLevelFail}
                  />
                )}
                {currentLevel.type === "scale" && (
                  <ScalePuzzle
                    level={currentLevel as any}
                    fakeCoinIndex={fakeCoinIndex}
                    onSuccess={handleLevelClear}
                    onFail={handleLevelFail}
                  />
                )}
              </div>

              {/* Sidebar Helpers (Regular clues / Logs guidance trigger) */}
              <div className="md:col-span-4 space-y-4">
                
                {/* Standard hints revealing card */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> 標準ヒント一覧
                  </h4>

                  {hintCount === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500 mb-4">考えるヒントが用意されています。</p>
                      <button
                        id="reveal-hint-btn"
                        onClick={() => setHintCount(1)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition"
                      >
                        第1のヒントを見る
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentLevel.hints.slice(0, hintCount).map((hint, idx) => (
                        <div key={idx} className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800 leading-relaxed">
                          <span className="font-bold text-amber-400 block mb-1">ヒント {idx + 1}:</span>
                          {hint}
                        </div>
                      ))}

                      {hintCount < currentLevel.hints.length && (
                        <button
                          id="reveal-next-hint-btn"
                          onClick={() => setHintCount((prev) => prev + 1)}
                          className="w-full text-center py-2 text-[10px] text-slate-400 hover:text-slate-200 font-bold bg-slate-950/20 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer"
                        >
                          次のヒントを開く ({hintCount} / {currentLevel.hints.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Logs Fairy Banner */}
                <div className="bg-indigo-950/15 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex gap-3">
                    <span className="text-3xl p-1 bg-indigo-500/10 rounded-xl w-12 h-12 flex items-center justify-center border border-indigo-500/20">🧚</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        論理の妖精・ログス
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        「もっと深くヒントが欲しいかい？ボクに質問してくれたら、答えを言わずに推理を手伝うよ！」
                      </p>
                      <button
                        id="open-ai-hint-btn"
                        onClick={() => setShowAIHint(true)}
                        className="mt-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/10 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" /> ログスに直接質問する
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </main>
          </div>

          {/* AI Hint Dialog Modal */}
          <AnimatePresence>
            {showAIHint && (
              <AIHintDialog
                level={currentLevel}
                onClose={() => setShowAIHint(false)}
              />
            )}
          </AnimatePresence>

        </div>
      )}

      {/* 4. Victory / Leaderboard Submission Screen */}
      {currentScreen === "victory" && (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans overflow-x-hidden relative flex flex-col justify-between">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto w-full z-10 flex-grow py-8 text-center space-y-8">
            {/* Victory Title Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <div className="text-5xl sm:text-6xl animate-bounce">👑</div>
              <h1 id="victory-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-amber-400">
                おめでとう！
              </h1>
            </motion.div>

            {/* Final Performance Metrics card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto grid grid-cols-2 gap-4 text-center backdrop-blur-md">
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  最終トータルスコア
                </span>
                <span id="final-total-score" className="text-xl sm:text-2xl font-extrabold text-indigo-400 font-mono">
                  {totalScore.toLocaleString()} <span className="text-xs text-slate-500">pts</span>
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  総クリア時間
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-200 font-mono">
                  {Math.floor(totalTime / 60)}分
                  {totalTime % 60}秒
                </span>
              </div>
            </div>
            {/* Back action */}
            <div className="pt-4">
              <button
                id="reset-and-home-btn"
                onClick={handleResetAllAndWelcome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 transition cursor-pointer bg-slate-900 border border-slate-800/80 px-4 py-2.5 rounded-xl"
              >
                <Home className="w-3.5 h-3.5" /> タイトル画面に戻る
              </button>
            </div>
          </div>

          <footer className="text-center py-6 text-xs text-slate-700 z-10 mt-8 max-w-4xl mx-auto w-full border-t border-slate-900/50">
            <p>© 2026 論理パズル・クエスト. 完全攻略ありがとうございました。</p>
          </footer>
        </div>
      )}

    </div>
  );
}
