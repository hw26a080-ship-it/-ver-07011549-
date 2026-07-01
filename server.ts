import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// ランキングファイルパス
const RANKING_FILE = path.join(process.cwd(), "ranking.json");

interface RankingEntry {
  id: string;
  name: string;
  score: number;
  stagesCleared: number;
  totalTime: number; // 秒数
  date: string;
}

// 初期ランキングデータ
const DEFAULT_RANKING: RankingEntry[] = [
  { id: "1", name: "アラン・チューリング", score: 4850, stagesCleared: 5, totalTime: 240, date: "2026-06-20" },
  { id: "2", name: "シャーロック・ホームズ", score: 4520, stagesCleared: 5, totalTime: 310, date: "2026-06-21" },
  { id: "3", name: "エルキュール・ポアロ", score: 4100, stagesCleared: 5, totalTime: 380, date: "2026-06-22" },
  { id: "4", name: "金田一耕助", score: 3750, stagesCleared: 5, totalTime: 450, date: "2026-06-23" },
  { id: "5", name: "江戸川コナン", score: 3200, stagesCleared: 4, totalTime: 520, date: "2026-06-24" },
];

function loadRanking(): RankingEntry[] {
  try {
    if (fs.existsSync(RANKING_FILE)) {
      const data = fs.readFileSync(RANKING_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading ranking file, using defaults:", err);
  }
  
  // ファイルがなければデフォルトを書き込む
  try {
    fs.writeFileSync(RANKING_FILE, JSON.stringify(DEFAULT_RANKING, null, 2));
  } catch (err) {
    console.error("Error writing default ranking file:", err);
  }
  return DEFAULT_RANKING;
}

function saveRanking(ranking: RankingEntry[]) {
  try {
    fs.writeFileSync(RANKING_FILE, JSON.stringify(ranking, null, 2));
  } catch (err) {
    console.error("Error writing ranking file:", err);
  }
}

// Gemini API の初期化 (Lazy load)
let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// API Routes
app.get("/api/ranking", (req, res) => {
  const ranking = loadRanking();
  // スコア順、同点ならタイムが短い順、クリアステージ数が多い順
  const sorted = [...ranking].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.stagesCleared !== a.stagesCleared) {
      return b.stagesCleared - a.stagesCleared;
    }
    return a.totalTime - b.totalTime;
  });
  res.json(sorted.slice(0, 50)); // 上位50件
});

app.post("/api/ranking", (req, res) => {
  const { name, score, stagesCleared, totalTime } = req.body;
  if (!name || score === undefined || stagesCleared === undefined || totalTime === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ranking = loadRanking();
  const newEntry: RankingEntry = {
    id: Math.random().toString(36).substring(2, 11),
    name: name.trim().slice(0, 15) || "名無しプレイヤー",
    score: Number(score),
    stagesCleared: Number(stagesCleared),
    totalTime: Number(totalTime),
    date: new Date().toISOString().split("T")[0],
  };

  ranking.push(newEntry);
  
  // スコア順に並べ替え
  const sorted = ranking.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.stagesCleared !== a.stagesCleared) {
      return b.stagesCleared - a.stagesCleared;
    }
    return a.totalTime - b.totalTime;
  });

  // トップ100件を残す
  const trimmed = sorted.slice(0, 100);
  saveRanking(trimmed);

  res.json({ success: true, entry: newEntry, ranking: trimmed.slice(0, 20) });
});

// Gemini ヒント API
app.post("/api/hint", async (req, res) => {
  const { levelId, levelTitle, question, hints, currentInput, userStuckMessage } = req.body;
  
  const systemInstruction = `
あなたは「論理の妖精・ログス」です。論理パズルゲームのガイド兼ヒント役です。
ユーザーから現在解いている論理パズルの詳細と、現在のユーザーの進行状況や悩み（困っていること）が送られます。
あなたの役割は、**答えを直接教えることなく、解き方のプロセスや手がかりに気づかせるヒントを提供すること**です。

以下のガイドラインを厳守してください：
1. 答えそのもの（「犯人はAです」「何回目にこれをする」など）は絶対に言わない。
2. ユーザーが論理的に考えるためのアプローチ（「まず、本当のことを言っている人が誰か仮定してみよう」「天秤をこういう風にグループ分けしたらどうなるかな？」など）をステップバイステップで促す。
3. 明るく優しく、少し知的でフレンドリーな「〜だよ」「〜だね」といった妖精らしい口調で日本語で話す。
4. 返答は150文字〜250文字程度で、分かりやすく簡潔にまとめる。
`;

  const prompt = `
レベル: ${levelId} - ${levelTitle}
問題内容: ${question}
用意されている基本的なヒント: ${JSON.stringify(hints)}
現在のユーザーの状況・回答状況: ${JSON.stringify(currentInput)}
ユーザーからの質問/悩み: "${userStuckMessage || "次にどう考えればいいか分かりません。"}"

この情報を元に、答えを明かさず、次に考えるべきポイントを優しく論理的に示すヒントを作成してください。
`;

  try {
    const aiInstance = getAI();
    if (!aiInstance) {
      // APIキーがない場合のフォールバック
      const fallbackHints = [
        "まずは前提条件を1つずつ整理してみよう！矛盾がないか確かめるのがコツだよ。",
        "「もしAが正しかったらどうなるか？」と仮定して、そこから生まれる結果を考えてみてね！",
        "複雑な情報は紙に書いたり、頭の中で整理しやすいように分けてみるといいよ。"
      ];
      const randomFallback = fallbackHints[Math.floor(Math.random() * fallbackHints.length)];
      return res.json({ 
        hint: `（AI接続オフモード）\n「${levelTitle}」のパズルだね！\n${randomFallback}\n諦めずにじっくり考えてみてね！応援しているよ！` 
      });
    }

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });

    res.json({ hint: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "AIヒントの取得中にエラーが発生しました。" });
  }
});

async function startServer() {
  // Viteのミドルウェア設定
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
