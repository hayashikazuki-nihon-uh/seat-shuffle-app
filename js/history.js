import { store } from './store.js';
import { renderStaticSeatChart } from './seatChart.js';
import { exportSeatChartImage } from './imageExport.js';

function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function renderHistory(container) {
  const state = store.getState();
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'panel-intro';
  intro.textContent = '過去の座席配置を確認できます(閲覧のみ。次回の抽選には影響しません)。';
  container.appendChild(intro);

  if (state.history.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'まだ履歴がありません。';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'history-list';

  state.history.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const dateEl = document.createElement('span');
    dateEl.className = 'history-date';
    dateEl.textContent = formatDate(entry.timestamp);
    li.appendChild(dateEl);

    const viewBtn = document.createElement('button');
    viewBtn.className = 'primary-btn';
    viewBtn.textContent = '表示';
    viewBtn.addEventListener('click', () => openHistoryModal(entry));
    li.appendChild(viewBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn danger';
    delBtn.textContent = '削除';
    delBtn.addEventListener('click', () => {
      if (confirm('この履歴を削除しますか?')) {
        store.removeHistoryEntry(entry.id);
        renderHistory(container);
      }
    });
    li.appendChild(delBtn);

    list.appendChild(li);
  });

  container.appendChild(list);
}

function openHistoryModal(entry) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-box';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h3');
  title.textContent = formatDate(entry.timestamp) + ' の座席';
  header.appendChild(title);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn';
  closeBtn.textContent = '閉じる';
  closeBtn.addEventListener('click', () => {
    root.innerHTML = '';
  });
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const chartArea = document.createElement('div');
  chartArea.className = 'modal-chart-area';
  modal.appendChild(chartArea);
  renderStaticSeatChart(chartArea, entry.seats);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'primary-btn';
  saveBtn.textContent = '画像として保存';
  saveBtn.addEventListener('click', () => {
    exportSeatChartImage(entry.seats, `座席表(${formatDate(entry.timestamp)})`);
  });
  modal.appendChild(saveBtn);

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) root.innerHTML = '';
  });
  root.appendChild(overlay);
}
