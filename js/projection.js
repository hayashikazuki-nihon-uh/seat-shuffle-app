import { store } from './store.js';
import { runShuffle } from './shuffle.js';
import { playSlotAnimation } from './animation.js';
import { exportSeatChartImage } from './imageExport.js';
import { getDeskSizePct } from './deskGrid.js';

const VIEW_LABEL = { podium: '教卓側', student: '生徒側' };

let currentAssignment = null; // deskId -> studentId
let currentSeatsSnapshot = null;
let isAnimating = false;
let viewMode = 'podium'; // 'podium' = 元のレイアウト通り, 'student' = 180度回転(生徒から見た向き)
let flipBtnEl = null;
let controlsEl = null;

const STAGE_BOTTOM_GAP_PX = 8;
const STAGE_MIN_HEIGHT_PX = 120;

/**
 * 右下の操作ボタンの実際の位置を計測し、座席表がその上端までに収まるよう高さを決める。
 * (ボタンの大きさや画面の向き・サイズが変わっても、重ならないように追従する)
 */
function fitStageToControls(stageEl) {
  const stage = stageEl.querySelector('.seat-chart-stage');
  if (!stage || !controlsEl) return;
  const controlsTop = controlsEl.getBoundingClientRect().top;
  if (controlsTop <= 0) return; // 投影モードが非表示のときは計測できない
  const stageTop = stage.getBoundingClientRect().top;
  const height = Math.max(STAGE_MIN_HEIGHT_PX, controlsTop - STAGE_BOTTOM_GAP_PX - stageTop);
  stage.style.height = `${height}px`;
}

export function initProjection({ stageEl, shuffleBtn, saveImageBtn, flipBtn, errorEl }) {
  flipBtnEl = flipBtn;
  controlsEl = document.getElementById('projection-controls');
  updateFlipButtonLabel();
  renderStage(stageEl);
  saveImageBtn.disabled = true;

  // ボタンの大きさが変わった時・画面サイズや向きが変わった時・投影モードが表示された時に、座席表の大きさを再計測する
  const refit = () => fitStageToControls(stageEl);
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  if (typeof ResizeObserver !== 'undefined' && controlsEl) {
    new ResizeObserver(refit).observe(controlsEl);
  }

  shuffleBtn.addEventListener('click', () => {
    if (isAnimating) return;
    hideError(errorEl);

    const state = store.getState();
    const result = runShuffle({
      roster: state.roster,
      desks: state.layout.desks,
      conditions: state.conditions
    });

    if (!result.ok) {
      showError(errorEl, result.message);
      return;
    }

    isAnimating = true;
    shuffleBtn.disabled = true;
    saveImageBtn.disabled = true;

    // アニメーション開始前は必ず空欄で描画する(先に正解が見えてしまわないように)
    const reels = renderStage(stageEl, state.layout.desks, { forceBlank: true });
    currentAssignment = result.assignment;
    const nameById = new Map(state.roster.map((s) => [s.id, s.name]));
    const reelData = reels.map((reel) => ({
      deskEl: reel.el,
      finalName: nameById.get(currentAssignment[reel.desk.id]) || ''
    }));
    const namePool = state.roster.map((s) => s.name);

    playSlotAnimation(reelData, namePool, () => {
      isAnimating = false;
      shuffleBtn.disabled = false;
      saveImageBtn.disabled = false;

      currentSeatsSnapshot = state.layout.desks.map((desk) => ({
        xPct: desk.xPct,
        yPct: desk.yPct,
        frontZone: !!desk.frontZone,
        studentName: nameById.get(currentAssignment[desk.id]) || ''
      }));
      store.addHistoryEntry({ timestamp: Date.now(), seats: currentSeatsSnapshot });
    });
  });

  saveImageBtn.addEventListener('click', () => {
    if (!currentSeatsSnapshot) return;
    exportSeatChartImage(currentSeatsSnapshot, '座席表', {
      rotate180: viewMode === 'student',
      showFrontZone: false
    });
  });

  flipBtn.addEventListener('click', () => {
    if (isAnimating) return;
    viewMode = viewMode === 'podium' ? 'student' : 'podium';
    updateFlipButtonLabel();
    renderStage(stageEl);
  });
}

export function refreshProjectionStage(stageEl) {
  currentAssignment = null;
  currentSeatsSnapshot = null;
  renderStage(stageEl);
}

function updateFlipButtonLabel() {
  if (!flipBtnEl) return;
  flipBtnEl.textContent = `🔄 ${VIEW_LABEL[viewMode]}`;
}

/**
 * 座席を描画する。すでに抽選済みの場合は現在の割り当てを反映し、
 * 未抽選の場合は空の机を並べる。生徒側表示のときは上下左右とも反転する。
 */
function renderStage(stageEl, desksOverride, { forceBlank = false } = {}) {
  const state = store.getState();
  const desks = desksOverride || state.layout.desks;
  const nameById = !forceBlank && currentAssignment ? new Map(state.roster.map((s) => [s.id, s.name])) : null;
  const rotate180 = viewMode === 'student';

  stageEl.innerHTML = '';
  const stage = document.createElement('div');
  stage.className = 'seat-chart-stage';
  stageEl.appendChild(stage);

  const { wPct, hPct } = getDeskSizePct(desks.length);

  const reels = desks.map((desk) => {
    const el = document.createElement('div');
    el.className = 'desk desk-display';
    el.style.left = `${rotate180 ? 100 - desk.xPct - wPct : desk.xPct}%`;
    el.style.top = `${rotate180 ? 100 - desk.yPct - hPct : desk.yPct}%`;
    el.style.width = `${wPct}%`;
    el.style.height = `${hPct}%`;
    el.textContent = nameById ? nameById.get(currentAssignment[desk.id]) || '' : '';
    stage.appendChild(el);
    return { desk, el };
  });

  fitStageToControls(stageEl);
  return reels;
}

function showError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError(errorEl) {
  errorEl.classList.add('hidden');
}
