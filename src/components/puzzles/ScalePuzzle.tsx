import { useState, useEffect } from "react";
import { ScaleLevel } from "../../types";
import { HelpCircle, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, ArrowDown, Scale as ScaleIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ScalePuzzleProps {
  level: ScaleLevel;
  fakeCoinIndex: number; // 0-based index, dynamic from parent
  onSuccess: (score: number) => void;
  onFail: () => void;
}

type CoinPosition = "desk" | "left" | "right";

interface MeasureResult {
  id: number;
  leftCoins: number[];
  rightCoins: number[];
  outcome: "left-light" | "right-light" | "balanced" | "invalid";
  outcomeText: string;
}

export default function ScalePuzzle({ level, fakeCoinIndex, onSuccess, onFail }: ScalePuzzleProps) {
  // コイン(0〜7)の現在位置
  const [coinPositions, setCoinPositions] = useState<CoinPosition[]>(
    Array(level.coinCount).fill("desk")
  );

  // 測定結果の履歴
  const [measureHistory, setMeasureHistory] = useState<MeasureResult[]>([]);
  
  // 現在の天秤の状態
  const [scaleState, setScaleState] = useState<"idle" | "left-up" | "right-up" | "balanced">("idle");
  const [measureCount, setMeasureCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handlePositionChange = (coinIndex: number, newPos: CoinPosition) => {
    if (measureCount >= level.maxMeasures && newPos !== "desk") {
      setErrorMsg(`測定回数は最大${level.maxMeasures}回までだよ。すでに測定限度に達しています。`);
      return;
    }
    setCoinPositions((prev) => {
      const copy = [...prev];
      copy[coinIndex] = newPos;
      return copy;
    });
    setErrorMsg("");
  };

  // 天秤で測定
  const handleMeasure = () => {
    if (measureCount >= level.maxMeasures) {
      setErrorMsg("測定可能回数を超えています。これ以上は測定できません！金貨を選択して回答してね。");
      return;
    }

    const leftCoins: number[] = [];
    const rightCoins: number[] = [];

    coinPositions.forEach((pos, idx) => {
      if (pos === "left") leftCoins.push(idx);
      if (pos === "right") rightCoins.push(idx);
    });

    if (leftCoins.length === 0 && rightCoins.length === 0) {
      setErrorMsg("天秤のお皿に金貨を乗せてから測定ボタンを押してね。");
      return;
    }

    // 左右のコインの枚数が違う場合は不適切（警告を出すが、一応物理計算としては可能）
    let isInvalid = false;
    let outcomeText = "";
    let outcome: "left-light" | "right-light" | "balanced" | "invalid" = "balanced";

    // 本物のコインの重さ=10、偽物のコインの重さ=9 (軽い)
    const leftWeight = leftCoins.length * 10 - (leftCoins.includes(fakeCoinIndex) ? 1 : 0);
    const rightWeight = rightCoins.length * 10 - (rightCoins.includes(fakeCoinIndex) ? 1 : 0);

    if (leftCoins.length !== rightCoins.length) {
      isInvalid = true;
      outcomeText = "左右のお皿の枚数が違います！正しい比較ができません。";
      outcome = "invalid";
      setScaleState("idle");
    } else {
      if (leftWeight < rightWeight) {
        outcome = "left-light";
        outcomeText = `左が軽いです！ (左皿が上がりました)`;
        setScaleState("left-up");
      } else if (rightWeight < leftWeight) {
        outcome = "right-light";
        outcomeText = `右が軽いです！ (右皿が上がりました)`;
        setScaleState("right-up");
      } else {
        outcome = "balanced";
        outcomeText = "釣り合っています。";
        setScaleState("balanced");
      }
    }

    const newResult: MeasureResult = {
      id: measureCount + 1,
      leftCoins,
      rightCoins,
      outcome,
      outcomeText,
    };

    setMeasureHistory((prev) => [...prev, newResult]);
    setMeasureCount((prev) => prev + 1);
    setErrorMsg("");
  };

  // 答え合わせ
  const checkAnswer = () => {
    if (selectedAnswer === null) {
      setErrorMsg("偽物だと思う金貨の番号を1つ選択してください。");
      return;
    }

    if (selectedAnswer === fakeCoinIndex) {
      setSuccessMsg("おめでとう！見事に軽い偽物の金貨を特定したよ！");
      setTimeout(() => {
        onSuccess(level.points);
      }, 1800);
    } else {
      setErrorMsg(`残念！ ${selectedAnswer}番の金貨は本物（重い方）だったよ！偽物の配置が変わったから再挑戦してね。`);
      onFail(); // お手つき
      handleReset(true);
    }
  };

  // 測定のリセット（新しい偽物の特定のために全体リセットではなく、現在の測定のみクリア、または再測定用）
  const handleReset = (fullReset = false) => {
    setCoinPositions(Array(level.coinCount).fill("desk"));
    setMeasureHistory([]);
    setScaleState("idle");
    setMeasureCount(0);
    setSelectedAnswer(null);
    setSuccessMsg("");
    if (!fullReset) {
      setErrorMsg("測定状況をリセットしました。");
    }
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" /> 王宮天秤のルール
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {level.question}
        </p>
      </div>

      {/* Visual Balance Scale and Coins */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
        {/* Scale visual backdrop */}
        <div className="absolute top-2 right-4 text-[10px] bg-slate-950/60 border border-slate-800 text-slate-500 font-mono font-bold px-3 py-1.5 rounded-lg">
          測定回数: <span className="text-indigo-400 font-bold">{measureCount}</span> / {level.maxMeasures}
        </div>

        {/* The interactive Balance Scale graphics */}
        <div className="flex flex-col items-center justify-center my-4 relative">
          <div className="flex justify-between items-start w-full max-w-[420px] h-32 relative">
            
            {/* Left Plate */}
            <motion.div 
              animate={{
                y: scaleState === "left-up" ? -15 : scaleState === "right-up" ? 15 : 0
              }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex flex-col items-center w-28 absolute left-0"
            >
              <div className="h-6 w-0.5 bg-slate-600"></div>
              <div className="w-24 h-5 bg-slate-800 border-2 border-slate-700 rounded-b-full flex flex-wrap items-center justify-center gap-0.5 px-1 py-0.5 relative shadow-inner">
                {coinPositions.map((pos, idx) => pos === "left" && (
                  <span key={idx} className="w-4 h-4 bg-amber-400 border border-amber-500 text-[8px] font-bold text-amber-900 rounded-full flex items-center justify-center shadow">
                    {idx}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-bold mt-1">左のお皿</span>
            </motion.div>

            {/* Scale Center Beam */}
            <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-0">
              <ScaleIcon className="w-12 h-12 text-slate-700" />
              <div className="h-10 w-2 bg-slate-800 rounded-t border-b border-slate-700"></div>
              <div className="w-20 h-2 bg-slate-800 border border-slate-700 rounded shadow"></div>
            </div>

            {/* Right Plate */}
            <motion.div 
              animate={{
                y: scaleState === "right-up" ? -15 : scaleState === "left-up" ? 15 : 0
              }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex flex-col items-center w-28 absolute right-0"
            >
              <div className="h-6 w-0.5 bg-slate-600"></div>
              <div className="w-24 h-5 bg-slate-800 border-2 border-slate-700 rounded-b-full flex flex-wrap items-center justify-center gap-0.5 px-1 py-0.5 relative shadow-inner">
                {coinPositions.map((pos, idx) => pos === "right" && (
                  <span key={idx} className="w-4 h-4 bg-amber-400 border border-amber-500 text-[8px] font-bold text-amber-900 rounded-full flex items-center justify-center shadow">
                    {idx}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-bold mt-1">右のお皿</span>
            </motion.div>
          </div>

          {/* Scale Base and prompt */}
          <div className="text-center mt-6">
            <button
              id="measure-btn"
              onClick={handleMeasure}
              disabled={measureCount >= level.maxMeasures}
              className={`bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-6 py-2 rounded-xl transition shadow flex items-center gap-1.5 mx-auto text-xs cursor-pointer ${
                measureCount >= level.maxMeasures ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ScaleIcon className="w-4 h-4" /> 天秤を動かす (測定する)
            </button>
          </div>
        </div>

        {/* Coin assignment panel */}
        <div className="border-t border-slate-800/60 pt-4 mt-2">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-center sm:text-left">
            🪙 各金貨の位置を選択
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array(level.coinCount).fill(0).map((_, idx) => {
              const currentPos = coinPositions[idx];
              return (
                <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-amber-400 border border-amber-500 text-[10px] font-bold text-amber-950 rounded-full flex items-center justify-center shadow-md">
                      {idx}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">金貨 {idx}</span>
                  </div>
                  {/* Select button group */}
                  <div className="grid grid-cols-3 gap-0.5 w-full bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => handlePositionChange(idx, "left")}
                      className={`text-[8px] font-bold py-1 rounded transition cursor-pointer text-center ${
                        currentPos === "left"
                          ? "bg-indigo-600/30 text-indigo-300 font-extrabold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      左
                    </button>
                    <button
                      onClick={() => handlePositionChange(idx, "desk")}
                      className={`text-[8px] font-bold py-1 rounded transition cursor-pointer text-center ${
                        currentPos === "desk"
                          ? "bg-slate-800 text-slate-300 font-extrabold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      机
                    </button>
                    <button
                      onClick={() => handlePositionChange(idx, "right")}
                      className={`text-[8px] font-bold py-1 rounded transition cursor-pointer text-center ${
                        currentPos === "right"
                          ? "bg-indigo-600/30 text-indigo-300 font-extrabold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      右
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History of measurements */}
        {measureHistory.length > 0 && (
          <div className="mt-4 bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-500 block mb-1">🔍 測定履歴:</span>
            {measureHistory.map((res) => (
              <div key={res.id} className="flex justify-between items-center py-0.5 border-b border-slate-900 last:border-0">
                <span>
                  {res.id}回目: 左[{res.leftCoins.join(",")}] vs 右[{res.rightCoins.join(",")}]
                </span>
                <span className={`font-semibold ${
                  res.outcome === "invalid" ? "text-rose-400" : "text-indigo-400"
                }`}>
                  {res.outcomeText}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer Area */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
          🎯 軽い偽物の金貨の選択と回答
        </h4>

        <div className="flex flex-wrap gap-2 justify-center py-2">
          {Array(level.coinCount).fill(0).map((_, idx) => {
            const isSelected = selectedAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedAnswer(idx);
                  setErrorMsg("");
                }}
                className={`w-11 h-11 rounded-xl font-mono text-sm font-bold border transition cursor-pointer flex flex-col items-center justify-center relative ${
                  isSelected
                    ? "bg-amber-400 border-amber-500 text-amber-950 scale-105 shadow-lg shadow-amber-400/20"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span className="text-[10px] text-slate-500 font-sans block leading-none mb-0.5">#{idx}</span>
                🪙
              </button>
            );
          })}
        </div>

        {/* Submission Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div className="text-center sm:text-left">
            {errorMsg ? (
              <p className="text-xs font-semibold text-rose-400 animate-pulse">
                ⚠️ {errorMsg}
              </p>
            ) : successMsg ? (
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                🎉 {successMsg}
              </p>
            ) : (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                偽物だと思う金貨の番号（0〜7）を1つ選んで回答してください。
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleReset(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 測定リセット
            </button>
            <button
              id="submit-scale-answer"
              onClick={checkAnswer}
              className="flex-grow sm:flex-grow-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> 偽物を回答する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
