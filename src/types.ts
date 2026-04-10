/**
 * types.ts — 全局类型定义
 *
 * 职责：所有数据结构的 TypeScript 接口，杜绝 any。
 */

/** 维度代码 */
export type DimensionKey =
  | 'S1' | 'S2' | 'S3'
  | 'E1' | 'E2' | 'E3'
  | 'A1' | 'A2' | 'A3'
  | 'Ac1' | 'Ac2' | 'Ac3'
  | 'So1' | 'So2' | 'So3';

/** 等级：低/中/高 */
export type Level = 'L' | 'M' | 'H';

/** 选项 */
export interface Option {
  label: string;
  value: number;
}

/** 题目 */
export interface Question {
  id: string;
  dim: DimensionKey;
  text: string;
  options: Option[];
}

/** 特殊题目（饮酒门控等） */
export interface SpecialQuestion {
  id: string;
  special: true;
  kind: 'drink_gate' | 'drink_trigger';
  text: string;
  options: Option[];
}

/** 维度元数据 */
export interface DimensionMeta {
  name: string;
  model: string;
}

/** 人格类型定义 */
export interface PersonalityType {
  code: string;
  cn: string;
  intro: string;
  desc: string;
}

/** 常规匹配类型 */
export interface NormalType {
  code: string;
  pattern: string; // "HHH-HMH-MHH-HHH-MHM"
}

/** 匹配结果 */
export interface MatchResult extends PersonalityType {
  pattern: string;
  distance: number;
  exact: number;
  similarity: number;
}

/** 维度解读 */
export type DimExplanations = Record<DimensionKey, Record<Level, string>>;

/** 图片映射 */
export type TypeImages = Record<string, string>;

/** 原始分数 */
export type RawScores = Record<DimensionKey, number>;

/** 维度等级 */
export type DimensionLevels = Record<DimensionKey, Level>;

/** 用户答案 */
export type Answers = Record<string, number>;

/** 计算结果 */
export interface ComputeResult {
  rawScores: RawScores;
  levels: DimensionLevels;
  ranked: MatchResult[];
  bestNormal: MatchResult;
  finalType: PersonalityType;
  modeKicker: string;
  badge: string;
  sub: string;
  special: boolean;
}

/** 应用状态 */
export interface AppState {
  shuffledQuestions: Array<Question | SpecialQuestion>;
  answers: Answers;
  previewMode: boolean;
  screen: 'intro' | 'test' | 'result';
}
