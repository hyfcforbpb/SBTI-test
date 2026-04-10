/**
 * main.ts — 应用入口（胶水层）
 *
 * 职责：连接数据层、逻辑层、UI 层，管理应用状态，注册事件监听
 * 不包含任何业务计算或 DOM 渲染逻辑。
 */

import type { Question, SpecialQuestion, Answers } from './types';
import { questions, specialQuestions } from './data/index';
import { computeResult } from './core/scoring';
import { showScreen, renderQuestions, updateProgress, renderResult } from './ui/render';

// -------------------------------------------------------------------
// 应用状态
// -------------------------------------------------------------------

interface AppState {
  shuffledQuestions: Array<Question | SpecialQuestion>;
  answers: Answers;
  previewMode: boolean;
}

const state: AppState = {
  shuffledQuestions: [],
  answers: {},
  previewMode: false,
};

// -------------------------------------------------------------------
// 题目管理
// -------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getVisibleQuestions(): Array<Question | SpecialQuestion> {
  const visible = [...state.shuffledQuestions];
  const gateIndex = visible.findIndex(q => q.id === 'drink_gate_q1');
  if (gateIndex !== -1 && state.answers['drink_gate_q1'] === 3) {
    visible.splice(gateIndex + 1, 0, specialQuestions[1]);
  }
  return visible;
}

function countAnswered(visibleQuestions: Array<Question | SpecialQuestion>): number {
  return visibleQuestions.filter(q => state.answers[q.id] !== undefined).length;
}

// -------------------------------------------------------------------
// 答题回调
// -------------------------------------------------------------------

function handleAnswer(questionId: string, value: number): void {
  state.answers[questionId] = value;

  if (questionId === 'drink_gate_q1') {
    if (value !== 3) {
      delete state.answers['drink_gate_q2'];
    }
    refreshQuestions();
    return;
  }

  refreshProgress();
}

function refreshQuestions(): void {
  const visible = getVisibleQuestions();
  renderQuestions(visible, state.answers, state.previewMode, handleAnswer);
  refreshProgress();
}

function refreshProgress(): void {
  const visible = getVisibleQuestions();
  updateProgress(countAnswered(visible), visible.length);
}

// -------------------------------------------------------------------
// 流程控制
// -------------------------------------------------------------------

function startTest(preview = false): void {
  state.previewMode = preview;
  state.answers = {};

  const shuffledRegular = shuffle(questions);
  const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
  state.shuffledQuestions = [
    ...shuffledRegular.slice(0, insertIndex),
    specialQuestions[0],
    ...shuffledRegular.slice(insertIndex),
  ];

  refreshQuestions();
  showScreen('test');
}

function handleSubmit(): void {
  const result = computeResult(state.answers);
  renderResult(result);
}

// -------------------------------------------------------------------
// 事件绑定
// -------------------------------------------------------------------

document.getElementById('startBtn')!.addEventListener('click', () => startTest(false));
document.getElementById('backIntroBtn')!.addEventListener('click', () => showScreen('intro'));
document.getElementById('submitBtn')!.addEventListener('click', handleSubmit);
document.getElementById('restartBtn')!.addEventListener('click', () => startTest(false));
document.getElementById('toTopBtn')!.addEventListener('click', () => showScreen('intro'));
