export type LevelType = "liar" | "river" | "chests" | "grid" | "scale";

export interface BaseLevel {
  id: number;
  title: string;
  type: LevelType;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  points: number;
  description: string;
  question: string;
  hints: string[];
}

export interface LiarLevel extends BaseLevel {
  type: "liar";
  suspects: {
    id: string;
    name: string;
    statement: string;
    avatar: string;
  }[];
  options: {
    label: string;
    value: string; // "A=Knight, B=Knave, C=Spy" などの正解判定用
  }[];
  correctValue: string;
}

export interface RiverLevel extends BaseLevel {
  type: "river";
  items: {
    id: string;
    name: string;
    icon: string;
    eats?: string; // これがいないと食べちゃう
  }[];
}

export interface ChestsLevel extends BaseLevel {
  type: "chests";
  chests: {
    id: string;
    color: string;
    label: string;
    statement: string;
  }[];
  correctChestId: string;
}

export interface GridLevel extends BaseLevel {
  type: "grid";
  people: string[];
  fruits: string[];
  hobbies: string[];
  correctMapping: {
    [person: string]: { fruit: string; hobby: string };
  };
}

export interface ScaleLevel extends BaseLevel {
  type: "scale";
  coinCount: number;
  fakeCoinIndex: number; // 0-based index of the fake (lighter) coin
  maxMeasures: number;
}

export type Level = LiarLevel | RiverLevel | ChestsLevel | GridLevel | ScaleLevel;

export interface RankingEntry {
  id: string;
  name: string;
  score: number;
  stagesCleared: number;
  totalTime: number;
  date: string;
}
