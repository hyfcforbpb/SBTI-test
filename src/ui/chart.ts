/**
 * ui/chart.ts — Chart.js 雷达图
 *
 * 职责：将 15 维度得分渲染为雷达图
 */

import {
  Chart, RadarController, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import type { ComputeResult } from '../types';
import { dom } from './dom';
import { dimensionOrder, dimensionMeta } from '../data/index';

// 注册 Chart.js 组件（Tree-shaking 友好）
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

let chartInstance: Chart | null = null;

/**
 * 渲染雷达图
 */
export function renderChart(result: ComputeResult): void {
  // 销毁旧图表
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const labels = dimensionOrder.map(
    dim => dimensionMeta[dim].name.replace(/^S\d+\s|^E\d+\s|^A\d+\s|^Ac\d+\s|^So\d+\s/, ''),
  );
  const data = dimensionOrder.map(dim => result.rawScores[dim]);

  chartInstance = new Chart(dom.dimChart, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: '维度得分',
          data,
          backgroundColor: 'rgba(108, 141, 113, 0.2)',
          borderColor: 'rgba(77, 106, 83, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(77, 106, 83, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 6,
          min: 0,
          ticks: {
            stepSize: 1,
            backdropColor: 'transparent',
            font: { size: 11 },
          },
          pointLabels: {
            font: { size: 12, weight: 'bold' },
            color: '#304034',
          },
          grid: {
            color: 'rgba(219, 232, 221, 0.6)',
          },
          angleLines: {
            color: 'rgba(219, 232, 221, 0.4)',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}分`,
          },
        },
      },
    },
  });
}
