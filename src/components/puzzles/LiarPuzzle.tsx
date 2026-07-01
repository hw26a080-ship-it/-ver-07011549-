import { useState } from "react";
import { LiarLevel } from "../../types";
import { ShieldCheck, User, HelpCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LiarPuzzleProps {
  level: LiarLevel;
  onSuccess: (score: number) => void;
  onFail: () => void;
}

export default function LiarPuzzle({ level, onSuccess, onFail }: LiarPuzzleProps) {
  // A, B, C それぞれに選択された役割を保持する
  // 選択肢: "knight" (騎士), "knave" (悪漢), "spy" (平民)
  const [selections, setSelections] = useState<{ [suspectId: string]: string }>({
    A: "",
    B: "",
    C: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelect = (suspectId: string, role: string) => {
    setSelections((prev) => ({
      ...prev,
      [suspectId]: role,
    }));
    setErrorMsg("");
  };

  const checkSolution = () => {
    const { A, B, C } = selections;
    if (!A || !B || !C) {
      setErrorMsg("全員の正体を選択してください。");
      return;
    }

    // 重複チェック (1人は騎士、1人は悪漢、1人は平民でなければならない)
    const uniqueRoles = new Set([A, B, C]);
    if (uniqueRoles.size < 3) {
      setErrorMsg("同じ役割を複数人に割り当てることはできません。3人はそれぞれ異なる役割です。");
      onFail(); // お手つきペナルティ
      return;
    }

    // 答え合わせ
    // 正解の文字列: "A:knight, B:knave, C:spy"
    const currentAnswer = `A:${A}, B:${B}, C:${C}`;
    if (currentAnswer === level.correctValue) {
      onSuccess(level.points);
    } else {
      setErrorMsg("その役割の組み合わせだと、どこかで矛盾が生じてしまうよ。もう一度よく考えてみてね！");
      onFail(); // お手つきペナルティ
    }
  };

  const roleLabels: { [key: string]: string } = {
    knight: "騎士 (常に真実)",
    knave: "悪漢 (常に嘘)",
    spy: "平民 (真偽ランダム)"
  };

  return (
    <div className="space-y-6">
      {/* Question and explanation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-indigo-400" /> 推理の問題
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-medium">
            {level.question}
          </p>
        </div>

        <div className="border-t border-slate-800/80 pt-3">
          <h4 className="text-xs font-bold text-slate-400 mb-2">【役職の定義】</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5 text-xs">
              <span className="font-bold text-indigo-400 block mb-0.5">🛡️ 騎士 (Knight)</span>
              <p className="text-slate-400">常に「真実」を言います。嘘をつくことはできません。</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5 text-xs">
              <span className="font-bold text-rose-400 block mb-0.5">👿 悪漢 (Knave)</span>
              <p className="text-slate-400">常に「嘘」を言います。真実を言うことはできません。</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5 text-xs">
              <span className="font-bold text-amber-400 block mb-0.5">🧑‍🌾 平民 (Spy)</span>
              <p className="text-slate-400">本当のこと（真実）も嘘も、どちらも言うことができます。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suspects Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {level.suspects.map((sus) => {
          const selectedRole = selections[sus.id];

          return (
            <motion.div
              key={sus.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                selectedRole 
                  ? "bg-slate-900 border-indigo-500/50" 
                  : "bg-slate-900/40 border-slate-800"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                {/* Character Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl p-1 bg-slate-950/60 rounded-xl w-12 h-12 flex items-center justify-center border border-slate-800">
                    {sus.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-200">{sus.name}</h4>
                      {selectedRole && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          selectedRole === "knight" 
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                            : selectedRole === "knave"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {selectedRole === "knight" ? "騎士" : selectedRole === "knave" ? "悪漢" : "平民"}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {sus.id}</span>
                  </div>
                </div>

                {/* Speech Bubble */}
                <div className="relative bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 mb-6 italic leading-relaxed min-h-[64px] flex items-center">
                  <div className="absolute -top-2 left-5 w-4 h-4 bg-slate-950 border-t border-l border-slate-800 rotate-45"></div>
                  {sus.statement}
                </div>
              </div>

              {/* Role Selection Buttons */}
              <div className="space-y-2">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  正体を割り当てる
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.keys(roleLabels).map((role) => {
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => handleSelect(sus.id, role)}
                        className={`text-[10px] font-bold py-2 rounded-lg border transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        {role === "knight" ? "騎士" : role === "knave" ? "悪漢" : "平民"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Answer status / Action area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
        <div className="text-center sm:text-left">
          {errorMsg ? (
            <p className="text-xs font-semibold text-rose-400 animate-pulse">
              ⚠️ {errorMsg}
            </p>
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              全員に重複なく異なる役割（騎士・悪漢・平民）を割り当ててください。
            </p>
          )}
        </div>

        <button
          id="submit-liar-answer"
          onClick={checkSolution}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5 text-sm"
        >
          <Sparkles className="w-4 h-4" /> 回答を提出する
        </button>
      </div>
    </div>
  );
}
