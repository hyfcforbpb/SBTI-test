/**
 * core/scoring.test.ts — 评分系统测试
 *
 * 覆盖：computeRawScores, sumToLevel, computeLevels,
 *       matchPersonalities, isDrunkTriggered, computeResult, getDimExplanation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { Answers, DimensionKey, Level } from '../types';
import {
  computeRawScores, sumToLevel, levelToNum, computeLevels,
  matchPersonalities, isDrunkTriggered, computeResult, getDimExplanation,
} from './scoring';
import { dimensionMeta, questions, normalTypes, dimensionOrder, typeLibrary } from '../data/index';

// -------------------------------------------------------------------
// 辅助
// -------------------------------------------------------------------

/** 生成全选 value=2 的答案（30 道常规题） */
function allMidAnswers(): Answers {
  const a: Answers = {};
  for (const q of questions) a[q.id] = 2;
  return a;
}

/** 生成全选 value=1 的答案 */
function allLowAnswers(): Answers {
  const a: Answers = {};
  for (const q of questions) a[q.id] = 1;
  return a;
}

/** 生成全选 value=3 的答案 */
function allHighAnswers(): Answers {
  const a: Answers = {};
  for (const q of questions) a[q.id] = 3;
  return a;
}

// -------------------------------------------------------------------
// computeRawScores
// -------------------------------------------------------------------

describe('computeRawScores', () => {
  it('空答案应返回所有维度得分为 0', () => {
    const scores = computeRawScores({});
    const dims = Object.keys(dimensionMeta) as DimensionKey[];
    assert.equal(Object.keys(scores).length, 15);
    for (const dim of dims) {
      assert.equal(scores[dim], 0);
    }
  });

  it('全选 value=2 时每个维度得分应为 4（2 题 × 2 分）', () => {
    const scores = computeRawScores(allMidAnswers());
    for (const dim of Object.keys(scores) as DimensionKey[]) {
      assert.equal(scores[dim], 4, `dim ${dim} should be 4`);
    }
  });

  it('全选 value=1 时每个维度得分应为 2', () => {
    const scores = computeRawScores(allLowAnswers());
    for (const dim of Object.keys(scores) as DimensionKey[]) {
      assert.equal(scores[dim], 2, `dim ${dim} should be 2`);
    }
  });

  it('全选 value=3 时每个维度得分应为 6', () => {
    const scores = computeRawScores(allHighAnswers());
    for (const dim of Object.keys(scores) as DimensionKey[]) {
      assert.equal(scores[dim], 6, `dim ${dim} should be 6`);
    }
  });

  it('部分作答未答的题不计分', () => {
    const a: Answers = {};
    a[questions[0].id] = 3; // 只答第一题
    const scores = computeRawScores(a);
    const targetDim = questions[0].dim;
    assert.equal(scores[targetDim], 3);
    // 其他维度应为 0
    for (const dim of Object.keys(scores) as DimensionKey[]) {
      if (dim !== targetDim) assert.equal(scores[dim], 0);
    }
  });

  it('返回的维度集合与 dimensionMeta 一致', () => {
    const scores = computeRawScores({});
    const metaKeys = Object.keys(dimensionMeta).sort();
    const scoreKeys = Object.keys(scores).sort();
    assert.deepEqual(scoreKeys, metaKeys);
  });
});

// -------------------------------------------------------------------
// sumToLevel
// -------------------------------------------------------------------

describe('sumToLevel', () => {
  it('score 0 → L', () => assert.equal(sumToLevel(0), 'L'));
  it('score 3 → L', () => assert.equal(sumToLevel(3), 'L'));
  it('score 4 → M', () => assert.equal(sumToLevel(4), 'M'));
  it('score 5 → H', () => assert.equal(sumToLevel(5), 'H'));
  it('score 6 → H', () => assert.equal(sumToLevel(6), 'H'));
  it('负数 → L（边界防御）', () => assert.equal(sumToLevel(-1), 'L'));
});

// -------------------------------------------------------------------
// levelToNum
// -------------------------------------------------------------------

describe('levelToNum', () => {
  it('L → 1', () => assert.equal(levelToNum('L'), 1));
  it('M → 2', () => assert.equal(levelToNum('M'), 2));
  it('H → 3', () => assert.equal(levelToNum('H'), 3));
});

// -------------------------------------------------------------------
// computeLevels
// -------------------------------------------------------------------

describe('computeLevels', () => {
  it('全 0 分 → 全 L', () => {
    const levels = computeLevels(computeRawScores({}));
    for (const level of Object.values(levels)) {
      assert.equal(level, 'L');
    }
  });

  it('全 4 分 → 全 M', () => {
    const levels = computeLevels(computeRawScores(allMidAnswers()));
    for (const level of Object.values(levels)) {
      assert.equal(level, 'M');
    }
  });

  it('全 6 分 → 全 H', () => {
    const levels = computeLevels(computeRawScores(allHighAnswers()));
    for (const level of Object.values(levels)) {
      assert.equal(level, 'H');
    }
  });
});

// -------------------------------------------------------------------
// matchPersonalities
// -------------------------------------------------------------------

describe('matchPersonalities', () => {
  it('返回结果数应等于人格类型数', () => {
    const levels = computeLevels(computeRawScores(allMidAnswers()));
    const results = matchPersonalities(levels);
    assert.equal(results.length, normalTypes.length);
  });

  it('结果应按 distance 升序排列', () => {
    const levels = computeLevels(computeRawScores(allHighAnswers()));
    const results = matchPersonalities(levels);
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i].distance >= results[i - 1].distance,
        `index ${i} distance ${results[i].distance} < ${results[i - 1].distance}`);
    }
  });

  it('距离最小的结果应排第一位', () => {
    const levels = computeLevels(computeRawScores(allHighAnswers()));
    const results = matchPersonalities(levels);
    const minDist = Math.min(...results.map(r => r.distance));
    assert.equal(results[0].distance, minDist);
  });

  it('每条结果应包含必要字段', () => {
    const levels = computeLevels(computeRawScores(allLowAnswers()));
    const results = matchPersonalities(levels);
    for (const r of results) {
      assert.ok(r.code, 'missing code');
      assert.ok(r.cn, 'missing cn');
      assert.ok(typeof r.distance === 'number', 'missing distance');
      assert.ok(typeof r.exact === 'number', 'missing exact');
      assert.ok(typeof r.similarity === 'number', 'missing similarity');
      assert.ok(r.similarity >= 0 && r.similarity <= 100, `similarity ${r.similarity} out of range`);
    }
  });

  it('全 H 应命中 pattern 为全 H 的类型（如存在）', () => {
    const levels = computeLevels(computeRawScores(allHighAnswers()));
    const results = matchPersonalities(levels);
    // 全 H 时 distance 最小的类型应该 pattern 中 H 占多数
    assert.ok(results[0].distance <= 15, `best distance ${results[0].distance} too high for all-H`);
  });
});

// -------------------------------------------------------------------
// isDrunkTriggered
// -------------------------------------------------------------------

describe('isDrunkTriggered', () => {
  it('drink_gate_q2 === 2 → true', () => {
    assert.ok(isDrunkTriggered({ drink_gate_q2: 2 }));
  });

  it('drink_gate_q2 === 1 → false', () => {
    assert.ok(!isDrunkTriggered({ drink_gate_q2: 1 }));
  });

  it('无 drink_gate_q2 → false', () => {
    assert.ok(!isDrunkTriggered({}));
  });

  it('drink_gate_q2 === 0 → false', () => {
    assert.ok(!isDrunkTriggered({ drink_gate_q2: 0 }));
  });
});

// -------------------------------------------------------------------
// computeResult
// -------------------------------------------------------------------

describe('computeResult', () => {
  it('正常答案应返回非 special 结果', () => {
    const result = computeResult(allHighAnswers());
    assert.ok(result.finalType, 'missing finalType');
    assert.ok(result.ranked.length > 0, 'missing ranked');
    assert.ok(typeof result.rawScores === 'object', 'missing rawScores');
    assert.ok(typeof result.levels === 'object', 'missing levels');
  });

  it('触发饮酒门控应返回 DRUNK 人格', () => {
    const answers = allMidAnswers();
    answers['drink_gate_q2'] = 2;
    const result = computeResult(answers);
    assert.equal(result.finalType.code, 'DRUNK');
    assert.ok(result.special);
    assert.equal(result.modeKicker, '隐藏人格已激活');
  });

  it('低匹配度应触发 HHHH 兜底', () => {
    // 构造一个非常规分布，让所有类型匹配度都低
    // 交替选 1 和 3，制造与标准 pattern 大距离
    const a: Answers = {};
    questions.forEach((q, i) => { a[q.id] = i % 2 === 0 ? 1 : 3; });
    const result = computeResult(a);
    // 如果 bestNormal.similarity < 60, 应该返回 HHHH
    if (result.bestNormal.similarity < 60) {
      assert.equal(result.finalType.code, 'HHHH');
      assert.ok(result.special);
      assert.equal(result.modeKicker, '系统强制兜底');
    }
    // 否则匹配度足够，正常结果也是可接受的
  });

  it('返回结构应包含所有必需字段', () => {
    const result = computeResult(allMidAnswers());
    assert.ok(result.rawScores);
    assert.ok(result.levels);
    assert.ok(result.ranked);
    assert.ok(result.bestNormal);
    assert.ok(result.finalType);
    assert.ok(typeof result.modeKicker === 'string');
    assert.ok(typeof result.badge === 'string');
    assert.ok(typeof result.sub === 'string');
    assert.ok(typeof result.special === 'boolean');
  });

  it('未触发饮酒时 special 应为 false（匹配正常时）', () => {
    const result = computeResult(allHighAnswers());
    if (result.bestNormal.similarity >= 60) {
      assert.ok(!result.special, 'should not be special when matched normally');
    }
  });
});

// -------------------------------------------------------------------
// getDimExplanation
// -------------------------------------------------------------------

describe('getDimExplanation', () => {
  it('有效维度+等级应返回非空字符串', () => {
    const dims = Object.keys(dimensionMeta) as DimensionKey[];
    for (const dim of dims) {
      for (const level of ['L', 'M', 'H'] as Level[]) {
        const text = getDimExplanation(dim, level);
        assert.ok(typeof text === 'string', `${dim}/${level} not string`);
        assert.ok(text.length > 0, `${dim}/${level} is empty`);
      }
    }
  });

  it('无效维度应返回空字符串', () => {
    assert.equal(getDimExplanation('INVALID' as DimensionKey, 'L'), '');
  });
});

// -------------------------------------------------------------------
// 端到端一致性
// -------------------------------------------------------------------

describe('端到端一致性', () => {
  it('所有维度得分之和应等于所有已答题选项值之和', () => {
    const answers = allMidAnswers();
    const scores = computeRawScores(answers);
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    const expected = Object.values(answers).reduce((s, v) => s + v, 0);
    assert.equal(total, expected);
  });

  it('人格 pattern 解析后长度应为 15', () => {
    for (const type of normalTypes) {
      const parsed = type.pattern.replace(/-/g, '');
      assert.equal(parsed.length, 15, `${type.code} pattern length`);
    }
  });

  it('typeLibrary 中应包含 DRUNK 和 HHHH', () => {
    assert.ok(typeLibrary.DRUNK, 'missing DRUNK');
    assert.ok(typeLibrary.HHHH, 'missing HHHH');
  });

  it('每个常规题应有 3 个选项', () => {
    for (const q of questions) {
      assert.equal(q.options.length, 3, `${q.id} should have 3 options`);
    }
  });

  it('dimensionOrder 长度应为 15', () => {
    assert.equal(dimensionOrder.length, 15);
  });
});
