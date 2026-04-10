/**
 * core/scoring.ts — 评分与人格匹配（纯函数，零副作用）
 */

import type {
  DimensionKey, Level, Answers, RawScores,
  DimensionLevels, MatchResult, ComputeResult, PersonalityType,
} from '../types';

import {
  questions, normalTypes, typeLibrary,
  dimExplanations, dimensionMeta, dimensionOrder,
} from '../data/index';

// -------------------------------------------------------------------
// 维度得分
// -------------------------------------------------------------------

export function computeRawScores(answers: Answers): RawScores {
  const scores = {} as RawScores;
  for (const dim of Object.keys(dimensionMeta) as DimensionKey[]) {
    scores[dim] = 0;
  }
  for (const q of questions) {
    scores[q.dim] += (answers[q.id] ?? 0);
  }
  return scores;
}

// -------------------------------------------------------------------
// 等级映射
// -------------------------------------------------------------------

export function sumToLevel(score: number): Level {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

export function levelToNum(level: Level): number {
  const map: Record<Level, number> = { L: 1, M: 2, H: 3 };
  return map[level];
}

export function computeLevels(rawScores: RawScores): DimensionLevels {
  const levels = {} as DimensionLevels;
  for (const [dim, score] of Object.entries(rawScores) as [DimensionKey, number][]) {
    levels[dim] = sumToLevel(score);
  }
  return levels;
}

// -------------------------------------------------------------------
// 人格匹配
// -------------------------------------------------------------------

function parsePattern(pattern: string): Level[] {
  return pattern.replace(/-/g, '').split('') as Level[];
}

function manhattanDistance(
  userVec: number[], typeVec: number[],
): { distance: number; exact: number } {
  let distance = 0;
  let exact = 0;
  for (let i = 0; i < userVec.length; i++) {
    const diff = Math.abs(userVec[i] - typeVec[i]);
    distance += diff;
    if (diff === 0) exact += 1;
  }
  return { distance, exact };
}

export function matchPersonalities(levels: DimensionLevels): MatchResult[] {
  const userVec = dimensionOrder.map(dim => levelToNum(levels[dim]));

  return normalTypes
    .map(type => {
      const lib = typeLibrary[type.code];
      const typeVec = parsePattern(type.pattern).map(levelToNum);
      const { distance, exact } = manhattanDistance(userVec, typeVec);
      const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
      return {
        code: type.code,
        cn: lib.cn,
        intro: lib.intro,
        desc: lib.desc,
        pattern: type.pattern,
        distance,
        exact,
        similarity,
      } as MatchResult;
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (b.exact !== a.exact) return b.exact - a.exact;
      return b.similarity - a.similarity;
    });
}

// -------------------------------------------------------------------
// 特殊人格判定
// -------------------------------------------------------------------

export function isDrunkTriggered(answers: Answers): boolean {
  return answers['drink_gate_q2'] === 2;
}

export function computeResult(answers: Answers): ComputeResult {
  const rawScores = computeRawScores(answers);
  const levels = computeLevels(rawScores);
  const ranked = matchPersonalities(levels);
  const bestNormal = ranked[0];
  const drunkTriggered = isDrunkTriggered(answers);

  let finalType: PersonalityType;
  let modeKicker = '你的主类型';
  let badge = `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/15 维`;
  let sub = '维度命中度较高，当前结果可视为你的第一人格画像。';
  let special = false;

  if (drunkTriggered) {
    finalType = typeLibrary.DRUNK;
    modeKicker = '隐藏人格已激活';
    badge = '匹配度 100% · 酒精异常因子已接管';
    sub = '乙醇亲和性过强，系统已直接跳过常规人格审判。';
    special = true;
  } else if (bestNormal.similarity < 60) {
    finalType = typeLibrary.HHHH;
    modeKicker = '系统强制兜底';
    badge = `标准人格库最高匹配仅 ${bestNormal.similarity}%`;
    sub = '标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。';
    special = true;
  } else {
    finalType = bestNormal;
  }

  return { rawScores, levels, ranked, bestNormal, finalType, modeKicker, badge, sub, special };
}

export function getDimExplanation(dim: DimensionKey, level: Level): string {
  return dimExplanations[dim]?.[level] ?? '';
}
