/**
 * ui/dom.ts — DOM 引用集中管理
 * 所有 getElementById 在此注册，其他模块不直接操作 DOM ID
 */

export const dom = {
  // 屏幕
  intro: document.getElementById('intro') as HTMLElement,
  test: document.getElementById('test') as HTMLElement,
  result: document.getElementById('result') as HTMLElement,

  // 答题页
  questionList: document.getElementById('questionList') as HTMLElement,
  progressBar: document.getElementById('progressBar') as HTMLElement,
  progressText: document.getElementById('progressText') as HTMLElement,
  submitBtn: document.getElementById('submitBtn') as HTMLButtonElement,
  testHint: document.getElementById('testHint') as HTMLElement,

  // 结果页
  posterBox: document.getElementById('posterBox') as HTMLElement,
  posterImage: document.getElementById('posterImage') as HTMLImageElement,
  posterCaption: document.getElementById('posterCaption') as HTMLElement,
  resultModeKicker: document.getElementById('resultModeKicker') as HTMLElement,
  resultTypeName: document.getElementById('resultTypeName') as HTMLElement,
  matchBadge: document.getElementById('matchBadge') as HTMLElement,
  resultTypeSub: document.getElementById('resultTypeSub') as HTMLElement,
  resultDesc: document.getElementById('resultDesc') as HTMLElement,
  dimList: document.getElementById('dimList') as HTMLElement,
  dimChart: document.getElementById('dimChart') as HTMLCanvasElement,
  funNote: document.getElementById('funNote') as HTMLElement,
};
