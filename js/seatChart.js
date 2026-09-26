import { getDeskSizePct } from './deskGrid.js';

/**
 * 座席チャートを DOM に描画する(読み取り専用)。
 * @param {HTMLElement} container
 * @param {Array<{xPct:number, yPct:number, frontZone?:boolean, studentName?:string}>} seats
 * @returns {HTMLElement[]} 生成した机要素の配列(座席の順序と対応)
 */
export function renderStaticSeatChart(container, seats) {
  container.innerHTML = '';
  const stage = document.createElement('div');
  stage.className = 'seat-chart-stage';
  container.appendChild(stage);

  const { wPct, hPct } = getDeskSizePct(seats.length);

  const deskEls = seats.map((seat) => {
    const el = document.createElement('div');
    el.className = 'desk desk-display';
    if (seat.frontZone) el.classList.add('desk-front');
    el.style.left = `${seat.xPct}%`;
    el.style.top = `${seat.yPct}%`;
    el.style.width = `${wPct}%`;
    el.style.height = `${hPct}%`;
    el.textContent = seat.studentName || '';
    stage.appendChild(el);
    return el;
  });

  return deskEls;
}
