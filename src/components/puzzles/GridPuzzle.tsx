import { useState } from "react";
import { GridLevel } from "../../types";
import { HelpCircle, Sparkles, Check, X, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface GridPuzzleProps {
  level: GridLevel;
  onSuccess: (score: number) => void;
  onFail: () => void;
}

export default function GridPuzzle({ level, onSuccess, onFail }: GridPuzzleProps) {
  // メモ用マトリックスの状態（3人 × (フルーツ3 + 趣味3) ＝ 3 × 6）
  // 値: 0 = 空欄, 1 = ○, 2 = ×
  const categories = [...level.fruits, ...level.hobbies];
  const [gridMemo, setGridMemo] = useState<{ [key: string]: number }>({});

  // 最終回答フォームの状態
  const [answers, setAnswers] = useState<{
    [person: string]: { fruit: string; hobby: string };
  }>({
    アリス: { fruit: "", hobby: "" },
    ボブ: { fruit: "", hobby: "" },
    チャーリー: { fruit: "", hobby: "" },
  });

  const [errorMsg, setErrorMsg] = useState("");

  // グリッドメモをクリックした時のトグル
  const handleGridClick = (person: string, category: string) => {
    const key = `${person}-${category}`;
    const currentValue = gridMemo[key] || 0;
    // 0 (空) -> 1 (○) -> 2 (×) -> 0 (空)
    const nextValue = (currentValue + 1) % 3;
    setGridMemo((prev) => ({ ...prev, [key]: nextValue }));
  };

  // ドロップダウンで回答をセット
  const handleAnswerChange = (person: string, type: "fruit" | "hobby", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [type]: value,
      },
    }));
    setErrorMsg("");
  };

  const checkSolution = () => {
    // すべて入力されているか確認
    for (const person of level.people) {
      if (!answers[person].fruit || !answers[person].hobby) {
        setErrorMsg("全員の「好きなフルーツ」と「趣味」をすべて選択してください。");
        return;
      }
    }

    // 重複チェック (1つのフルーツと1つの趣味は、別々の1人にしか割り当てられない)
    const selectedFruits = level.people.map((p) => answers[p].fruit);
    const selectedHobbies = level.people.map((p) => answers[p].hobby);

    if (new Set(selectedFruits).size < 3 || new Set(selectedHobbies).size < 3) {
      setErrorMsg("同じフルーツや趣味を複数人に重複して割り当てることはできません。");
      onFail();
      return;
    }

    // 正解判定
    let isAllCorrect = true;
    for (const person of level.people) {
      const correctFruit = level.correctMapping[person].fruit;
      const correctHobby = level.correctMapping[person].hobby;

      if (answers[person].fruit !== correctFruit || answers[person].hobby !== correctHobby) {
        isAllCorrect = false;
        break;
      }
    }

    if (isAllCorrect) {
      onSuccess(level.points);
    } else {
      setErrorMsg("おっと、その組み合わせだとヒントの条件のどれかに矛盾が発生するよ。グリッドを活用してじっくり考え直してみてね！");
      onFail();
    }
  };

  // メモ表示用ヘルパー
  const renderGridCell = (person: string, category: string) => {
    const value = gridMemo[`${person}-${category}`] || 0;
    if (value === 1) return <Check className="w-4 h-4 text-emerald-400" />;
    if (value === 2) return <X className="w-4 h-4 text-rose-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" /> 推理ヒントと問題
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line">
          {level.question}
        </p>
      </div>

      {/* Logic Grid Sheet (Interactive Draft Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="mb-3 flex justify-between items-center border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            📝 推理用メモグリッド（タップで ○ / × 切り替え）
          </h4>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            ※回答には直接影響しない下書きスペースです
          </span>
        </div>

        {/* Responsive horizontal scrollable wrapper */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs select-none min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-2.5 px-3 text-slate-500 font-bold w-24">人物 \ 項目</th>
                {/* Fruits Header */}
                {level.fruits.map((f) => (
                  <th key={f} className="py-2.5 px-2 text-slate-300 font-semibold text-center border-l border-slate-800/60 bg-blue-950/10">
                    🍊 {f}
                  </th>
                ))}
                {/* Hobbies Header */}
                {level.hobbies.map((h) => (
                  <th key={h} className="py-2.5 px-2 text-slate-300 font-semibold text-center border-l border-slate-800 bg-indigo-950/10">
                    🎨 {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {level.people.map((person) => (
                <tr key={person} className="border-b border-slate-800/60 hover:bg-slate-950/20">
                  <td className="py-3 px-3 font-bold text-slate-200 bg-slate-950/20">{person}</td>
                  {/* Fruits Cells */}
                  {level.fruits.map((f) => (
                    <td
                      key={f}
                      onClick={() => handleGridClick(person, f)}
                      className="py-3 px-2 text-center border-l border-slate-800/40 cursor-pointer hover:bg-slate-800/40 bg-blue-950/5"
                    >
                      <div className="flex items-center justify-center h-5 w-5 mx-auto">
                        {renderGridCell(person, f)}
                      </div>
                    </td>
                  ))}
                  {/* Hobbies Cells */}
                  {level.hobbies.map((h) => (
                    <td
                      key={h}
                      onClick={() => handleGridClick(person, h)}
                      className="py-3 px-2 text-center border-l border-slate-800 cursor-pointer hover:bg-slate-800/40 bg-indigo-950/5"
                    >
                      <div className="flex items-center justify-center h-5 w-5 mx-auto">
                        {renderGridCell(person, h)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer Form Panel */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
          🔑 最終的な回答を決定する
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {level.people.map((person) => (
            <div key={person} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
              <h5 className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                🧑‍🎓 {person}
              </h5>

              {/* Fruit Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  好きなフルーツ
                </label>
                <select
                  value={answers[person].fruit}
                  onChange={(e) => handleAnswerChange(person, "fruit", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="">-- 選択してください --</option>
                  {level.fruits.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hobby Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  趣味
                </label>
                <select
                  value={answers[person].hobby}
                  onChange={(e) => handleAnswerChange(person, "hobby", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="">-- 選択してください --</option>
                  {level.hobbies.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Answer submission status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div className="text-center sm:text-left">
            {errorMsg ? (
              <p className="text-xs font-semibold text-rose-400 animate-pulse">
                ⚠️ {errorMsg}
              </p>
            ) : (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                全員分の項目が1対1の正しいペアになるように推理してください。
              </p>
            )}
          </div>

          <button
            id="submit-grid-answer"
            onClick={checkSolution}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5 text-sm"
          >
            <Sparkles className="w-4 h-4" /> 回答を提出する
          </button>
        </div>
      </div>
    </div>
  );
}
