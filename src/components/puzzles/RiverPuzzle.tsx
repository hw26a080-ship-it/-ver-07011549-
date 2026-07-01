import { useState, useEffect } from "react";
import { RiverLevel } from "../../types";
import { HelpCircle, RefreshCw, ArrowRight, ArrowLeft, Waves } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RiverPuzzleProps {
  level: RiverLevel;
  onSuccess: (score: number) => void;
  onFail: () => void;
}

type Bank = "left" | "right";

interface ItemState {
  id: string;
  name: string;
  icon: string;
  bank: Bank;
}

export default function RiverPuzzle({ level, onSuccess, onFail }: RiverPuzzleProps) {
  // アイテムたちの現在地 (初期はすべて左岸 "left")
  const [items, setItems] = useState<ItemState[]>(
    level.items.map((item) => ({ ...item, bank: "left" }))
  );
  
  // ボートの位置 ("left" または "right")
  const [boatBank, setBoatBank] = useState<Bank>("left");
  
  // ボートに乗っているアイテム (null または アイテムID)
  const [passengerId, setPassengerId] = useState<string | null>(null);

  // ゲーム状態
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["ゲーム開始！全員を右岸へ渡してください。"]);

  // リセット
  const handleReset = (isFailure = false) => {
    setItems(level.items.map((item) => ({ ...item, bank: "left" })));
    setBoatBank("left");
    setPassengerId(null);
    setGameOverReason(null);
    if (isFailure) {
      onFail(); // お手つき
      setLog((prev) => ["【再挑戦】全員を左岸に戻しました。"]);
    } else {
      setLog(["【リセット】初期状態に戻しました。"]);
    }
  };

  // ボートに乗せる / 降ろす
  const handleItemClick = (itemId: string) => {
    if (gameOverReason) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // 乗客がボートに乗っている場合、クリックで降ろす
    if (passengerId === itemId) {
      setPassengerId(null);
      setLog((prev) => [`${item.name}をボートから降ろしました。`, ...prev]);
      return;
    }

    // 乗客が乗っていない、または別の乗客がいる場合
    if (item.bank === boatBank) {
      // すでに別の乗客がいれば、その乗客をまず降ろす
      if (passengerId) {
        const currentPassenger = items.find((i) => i.id === passengerId);
        setLog((prev) => [`${currentPassenger?.name}をボートから降ろし、${item.name}を乗せました。`, ...prev]);
      } else {
        setLog((prev) => [`${item.name}をボートに乗せました。`, ...prev]);
      }
      setPassengerId(itemId);
    }
  };

  // ボートを移動させる
  const moveBoat = () => {
    if (gameOverReason) return;

    const nextBank: Bank = boatBank === "left" ? "right" : "left";
    
    // 乗客がいる場合、その乗客の位置も一緒に移動
    let movedPassengerName = "";
    const updatedItems = items.map((item) => {
      if (item.id === passengerId) {
        movedPassengerName = item.name;
        return { ...item, bank: nextBank };
      }
      return item;
    });

    setItems(updatedItems);
    setBoatBank(nextBank);

    const logMsg = movedPassengerName 
      ? `船頭が${movedPassengerName}と一緒に対岸（${nextBank === "left" ? "左岸" : "右岸"}）へ渡りました。`
      : `船頭が1人で対岸（${nextBank === "left" ? "左岸" : "右岸"}）へ渡りました。`;

    setLog((prev) => [logMsg, ...prev]);
  };

  // 危険状態の判定とクリア判定をuseEffectで一元管理
  useEffect(() => {
    if (gameOverReason) return;

    // 船頭（ボート）がいない側の岸を取得
    const otherBank: Bank = boatBank === "left" ? "right" : "left";

    // その岸にいるアイテムたち
    const itemsOnOtherBank = items.filter((i) => i.bank === otherBank).map((i) => i.id);

    // 狼と羊が取り残されている場合
    if (itemsOnOtherBank.includes("wolf") && itemsOnOtherBank.includes("sheep")) {
      setGameOverReason("🐺 オオカミが🐑 ヒツジを食べてしまいました！");
      return;
    }

    // 羊とキャベツが取り残されている場合
    if (itemsOnOtherBank.includes("sheep") && itemsOnOtherBank.includes("cabbage")) {
      setGameOverReason("🐑 ヒツジが🥬 キャベツを食べてしまいました！");
      return;
    }

    // 全員が右岸に無事到着したか
    const allOnRight = items.every((i) => i.bank === "right") && boatBank === "right" && !passengerId;
    if (allOnRight) {
      const timer = setTimeout(() => {
        onSuccess(level.points);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [items, boatBank, passengerId, gameOverReason, level.points, onSuccess]);

  // 乗客オブジェクトの取得
  const passenger = passengerId ? items.find((i) => i.id === passengerId) : null;

  // 岸ごとのアイテム
  const leftBankItems = items.filter((i) => i.bank === "left" && i.id !== passengerId);
  const rightBankItems = items.filter((i) => i.bank === "right" && i.id !== passengerId);

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" /> パズルルール
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {level.question}
        </p>
      </div>

      {/* Main River Simulation Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden min-h-[340px] flex flex-col justify-between">
        
        {/* River visual backdrop */}
        <div className="absolute inset-y-0 left-1/3 right-1/3 bg-blue-950/20 border-l border-r border-blue-900/30 flex items-center justify-center">
          <Waves className="w-8 h-8 text-blue-900/30 animate-pulse" />
        </div>

        {/* Banks and River layout */}
        <div className="grid grid-cols-12 gap-2 flex-grow items-center relative z-10">
          
          {/* Left Bank */}
          <div className="col-span-4 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 min-h-[220px] flex flex-col items-center justify-start gap-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              左岸 (出発地点)
            </span>
            <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
              {leftBankItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  disabled={boatBank !== "left" || !!gameOverReason}
                  className={`flex flex-col items-center gap-1 p-2 w-16 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl transition ${
                    boatBank === "left" ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* River & Boat Area */}
          <div className="col-span-4 flex flex-col items-center justify-center gap-4 h-full">
            <div className="w-full flex justify-between relative h-20 px-2">
              
              {/* Boat visual container */}
              <div 
                className={`absolute top-0 bottom-0 flex items-center transition-all duration-500 ease-in-out ${
                  boatBank === "left" ? "left-0" : "right-0"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="text-[10px] bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold mb-1 shadow">
                    ⛵ ボート
                  </div>
                  <div 
                    onClick={() => passengerId && handleItemClick(passengerId)}
                    className={`w-20 h-11 bg-amber-900/80 hover:bg-amber-800/95 border-b-4 border-amber-950 rounded-b-xl flex items-center justify-around px-2 relative cursor-pointer shadow-lg transition`}
                  >
                    <span className="text-xl" title="船頭">🧑‍🌾</span>
                    {passenger ? (
                      <span className="text-xl animate-bounce">{passenger.icon}</span>
                    ) : (
                      <span className="text-[10px] text-amber-500 border border-amber-600/40 border-dashed rounded px-1.5 py-0.5 font-medium">空席</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boat Controls */}
            {!gameOverReason && (
              <button
                id="move-boat-btn"
                onClick={moveBoat}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
              >
                {boatBank === "left" ? (
                  <>渡る <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <><ArrowLeft className="w-3.5 h-3.5" /> 戻る</>
                )}
              </button>
            )}
          </div>

          {/* Right Bank */}
          <div className="col-span-4 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 min-h-[220px] flex flex-col items-center justify-start gap-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              右岸 (対岸・ゴール)
            </span>
            <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
              {rightBankItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  disabled={boatBank !== "right" || !!gameOverReason}
                  className={`flex flex-col items-center gap-1 p-2 w-16 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl transition ${
                    boatBank === "right" ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulation Log or Error message */}
        <div className="mt-4 border-t border-slate-800/60 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative z-10">
          <div className="text-left w-full sm:w-2/3">
            {gameOverReason ? (
              <div className="text-rose-400 font-bold bg-rose-950/30 border border-rose-900/40 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
                <span>⚠️ {gameOverReason}</span>
                <button
                  onClick={() => handleReset(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> 再挑戦
                </button>
              </div>
            ) : (
              <p className="text-slate-400 font-medium line-clamp-1">
                <span className="text-slate-500 font-mono font-bold mr-1.5">履歴:</span>
                {log[0]}
              </p>
            )}
          </div>

          {!gameOverReason && (
            <button
              onClick={() => handleReset(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> 最初からリセット
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
