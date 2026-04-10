/**
 * ui/render.ts — 渲染层（仅含 DOM 操作，不含业务逻辑）
 */

import type { Question, SpecialQuestion, ComputeResult, Answers, DimensionKey } from '../types';
import { dom } from './dom';
import { dimensionMeta, typeImages, dimensionOrder } from '../data/index';
import { getDimExplanation } from '../core/scoring';
import { renderChart } from './chart';

// -------------------------------------------------------------------
// 屏幕管理
// -------------------------------------------------------------------

type ScreenName = 'intro' | 'test' | 'result';

const screens = { intro: dom.intro, test: dom.test, result: dom.result };

export function showScreen(name: ScreenName): void {
  (Object.entries(screens) as [ScreenName, HTMLElement][])
    .forEach(([key, el]) => el.classList.toggle('active', key === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------------
// 题目渲染
// -------------------------------------------------------------------

export type AnswerCallback = (questionId: string, value: number) => void;

export function renderQuestions(
  visibleQuestions: Array<Question | SpecialQuestion>,
  answers: Answers,
  previewMode: boolean,
  onAnswer: AnswerCallback,
): void {
  dom.questionList.innerHTML = '';
  visibleQuestions.forEach((q, index) => {
    const card = document.createElement('article');
    card.className = 'question';
    card.innerHTML = `
      <div class="question-meta">
        <div class="badge">第 ${index + 1} 题</div>
        <div>${getMetaLabel(q, previewMode)}</div>
      </div>
      <div class="question-title">${q.text}</div>
      <div class="options">
        ${q.options.map((opt, i) => {
          const code = ['A', 'B', 'C', 'D'][i] ?? String(i + 1);
          const checked = answers[q.id] === opt.value ? 'checked' : '';
          return `
            <label class="option">
              <input type="radio" name="${q.id}" value="${opt.value}" ${checked} />
              <div class="option-code">${code}</div>
              <div>${opt.label}</div>
            </label>`;
        }).join('')}
      </div>`;
    dom.questionList.appendChild(card);
  });

  dom.questionList.querySelectorAll('input[type="radio"]').forEach(input => {
    input.addEventListener('change', e => {
      const target = e.target as HTMLInputElement;
      onAnswer(target.name, Number(target.value));
    });
  });
}

function getMetaLabel(q: Question | SpecialQuestion, previewMode: boolean): string {
  if ('special' in q && q.special) return '补充题';
  return previewMode ? ('dim' in q ? dimensionMeta[q.dim as DimensionKey].name : '补充题') : '维度已隐藏';
}

// -------------------------------------------------------------------
// 进度条
// -------------------------------------------------------------------

export function updateProgress(done: number, total: number): void {
  const percent = total ? (done / total) * 100 : 0;
  dom.progressBar.style.width = `${percent}%`;
  dom.progressText.textContent = `${done} / ${total}`;
  const complete = done === total && total > 0;
  dom.submitBtn.disabled = !complete;
  dom.testHint.textContent = complete
    ? '都做完了。现在可以把你的电子魂魄交给结果页审判。'
    : '全选完才会放行。世界已经够乱了，起码把题做完整。';
}

// -------------------------------------------------------------------
// 结果页渲染
// -------------------------------------------------------------------

export function renderResult(result: ComputeResult): void {
  const { finalType: type } = result;

  dom.resultModeKicker.textContent = result.modeKicker;
  dom.resultTypeName.textContent = `${type.code}（${type.cn}）`;
  dom.matchBadge.textContent = result.badge;
  dom.resultTypeSub.textContent = result.sub;
  dom.resultDesc.textContent = type.desc;
  dom.posterCaption.textContent = type.intro;
  dom.funNote.textContent = result.special
    ? '本测试仅供娱乐。隐藏人格和傻乐兜底都属于作者故意埋的损招，请勿把它当成医学、心理学、相学、命理学或灵异学依据。'
    : '本测试仅供娱乐，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。你可以笑，但别太当真。';

  // 人格图片
  const imageSrc = typeImages[type.code];
  if (imageSrc) {
    dom.posterImage.src = imageSrc;
    dom.posterImage.alt = `${type.code}（${type.cn}）`;
    dom.posterImage.loading = 'lazy';
    dom.posterBox.classList.remove('no-image');
  } else {
    dom.posterImage.removeAttribute('src');
    dom.posterImage.alt = '';
    dom.posterBox.classList.add('no-image');
  }

  // 维度列表
  renderDimList(result);

  // 雷达图
  renderChart(result);

  showScreen('result');
}

function renderDimList(result: ComputeResult): void {
  dom.dimList.innerHTML = dimensionOrder.map(dim => {
    const level = result.levels[dim];
    const explanation = getDimExplanation(dim, level);
    return `
      <div class="dim-item">
        <div class="dim-item-top">
          <div class="dim-item-name">${dimensionMeta[dim].name}</div>
          <div class="dim-item-score">${level} / ${result.rawScores[dim]}分</div>
        </div>
        <p>${explanation}</p>
      </div>`;
  }).join('');
}
