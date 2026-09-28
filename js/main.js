import { store } from './store.js';
import { renderRoster } from './roster.js';
import { renderLayout } from './layout.js';
import { renderConditions } from './conditions.js';
import { renderHistory } from './history.js';
import { initProjection, refreshProjectionStage } from './projection.js';
import { showToast } from './toast.js';

const UPDATE_CHECK_INTERVAL_MS = 60000;

const TAB_RENDERERS = {
  roster: renderRoster,
  layout: renderLayout,
  conditions: renderConditions,
  history: renderHistory
};

let activeTab = 'roster';

function renderActiveTab() {
  const panel = document.getElementById(`tab-${activeTab}`);
  if (panel) TAB_RENDERERS[activeTab](panel);
}

function renderMismatchBanner() {
  const banner = document.getElementById('mismatch-banner');
  const state = store.getState();
  const rosterCount = state.roster.length;
  const deskCount = state.layout.desks.length;
  if (rosterCount > 0 && deskCount > 0 && rosterCount !== deskCount) {
    banner.textContent = `⚠ 生徒数(${rosterCount}人)と机の数(${deskCount}個)が一致していません。抽選を行うには一致させてください。`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `tab-${activeTab}`);
      });
      renderActiveTab();
    });
  });
}

function setupModeSwitch() {
  const body = document.body;
  const goProjectionBtn = document.getElementById('go-projection-btn');
  const exitProjectionBtn = document.getElementById('exit-projection-btn');
  const stageEl = document.getElementById('projection-stage');

  goProjectionBtn.addEventListener('click', () => {
    body.classList.remove('mode-admin');
    body.classList.add('mode-projection');
    refreshProjectionStage(stageEl);
  });

  exitProjectionBtn.addEventListener('click', () => {
    body.classList.remove('mode-projection');
    body.classList.add('mode-admin');
    renderActiveTab();
    renderMismatchBanner();
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // すでに古いバージョンに制御されているページ(=再訪問)かどうかを覚えておく。
  // 新規インストール直後の初回切り替えでは再読み込みしない。
  const hadController = !!navigator.serviceWorker.controller;
  let lastCheckAt = 0;

  navigator.serviceWorker
    .register('./service-worker.js')
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('新しいバージョンが見つかったので更新します。しばらくお待ちください…', {
              persistent: true
            });
          }
        });
      });

      const checkForUpdate = () => {
        const now = Date.now();
        if (now - lastCheckAt < UPDATE_CHECK_INTERVAL_MS) return;
        lastCheckAt = now;
        showToast('更新を確認しています…');
        registration.update().catch(() => {});
      };

      // アプリを開いた/再表示したタイミングで、新しいバージョンがないか確認する
      checkForUpdate();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    })
    .catch((e) => {
      console.error('Service Worker registration failed', e);
    });

  if (hadController) {
    // 新しいバージョンが有効化されたら、最新のコードを使うため自動的に再読み込みする
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

function main() {
  setupTabs();
  setupModeSwitch();
  registerServiceWorker();

  const stageEl = document.getElementById('projection-stage');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const saveImageBtn = document.getElementById('save-image-btn');
  const flipBtn = document.getElementById('flip-btn');
  const errorEl = document.getElementById('projection-error');
  initProjection({ stageEl, shuffleBtn, saveImageBtn, flipBtn, errorEl });

  store.subscribe(() => {
    renderActiveTab();
    renderMismatchBanner();
  });

  renderActiveTab();
  renderMismatchBanner();
}

main();
