const STORAGE_KEY = 'seatShuffleApp:v1';

export function defaultState() {
  return {
    roster: [],
    layout: { desks: [] },
    conditions: { byStudentId: {} },
    history: []
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const state = {
      ...defaultState(),
      ...parsed,
      layout: { ...defaultState().layout, ...(parsed.layout || {}) },
      conditions: { ...defaultState().conditions, ...(parsed.conditions || {}) }
    };
    // 旧バージョンのデータに manuallyPlaced が無い場合は、既存の配置を動かさないよう「配置済み」扱いにする
    state.layout.desks = state.layout.desks.map((d) =>
      d.manuallyPlaced === undefined ? { ...d, manuallyPlaced: true } : d
    );
    return state;
  } catch (e) {
    console.error('状態の読み込みに失敗しました', e);
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('状態の保存に失敗しました', e);
  }
}
