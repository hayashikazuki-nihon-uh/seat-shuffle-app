const BASE_SIZE_PCT = 9;
const MIN_SIZE_PCT = 4;
const MARGIN_X_PCT = 6;
const MARGIN_Y_PCT = 8;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/** 机の数に応じて、はみ出さずに収まる机1つあたりの大きさ(%)を求める */
export function getDeskSizePct(count) {
  if (count <= 0) return { wPct: BASE_SIZE_PCT, hPct: BASE_SIZE_PCT };
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * (4 / 3))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const wPct = clamp((100 - MARGIN_X_PCT * 2) / cols - 1, MIN_SIZE_PCT, BASE_SIZE_PCT);
  const hPct = clamp((100 - MARGIN_Y_PCT * 2) / rows - 1.5, MIN_SIZE_PCT, BASE_SIZE_PCT);
  return { wPct, hPct };
}

function positionAt(col, row, cols, rows, wPct, hPct) {
  const usableW = 100 - MARGIN_X_PCT * 2 - wPct;
  const usableH = 100 - MARGIN_Y_PCT * 2 - hPct;
  const xStep = cols > 1 ? usableW / (cols - 1) : 0;
  const yStep = rows > 1 ? usableH / (rows - 1) : 0;
  return {
    xPct: clamp(MARGIN_X_PCT + col * xStep, 0, 100 - wPct),
    yPct: clamp(MARGIN_Y_PCT + row * yStep, 0, 100 - hPct)
  };
}

/**
 * 机を1つずつ自動配置する際の位置(%)を求める。0〜100の範囲に必ず収まる。
 * @param {number} index その机が並ぶ順番(0始まり)
 * @param {number} count 自動配置の対象となる机の総数
 */
export function computeGridPosition(index, count) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * (4 / 3))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const { wPct, hPct } = getDeskSizePct(count);
  return positionAt(col, row, cols, rows, wPct, hPct);
}

/**
 * 指定した行数×列数の机の位置(%)をまとめて求める。0〜100の範囲に必ず収まる。
 * @param {number} rows 縦方向の机の数
 * @param {number} cols 横方向の机の数
 * @returns {Array<{xPct:number, yPct:number}>} 行優先(左上から右へ、行ごとに下へ)の順の位置一覧
 */
export function generateExplicitGrid(rows, cols) {
  const { wPct, hPct } = getDeskSizePct(rows * cols);
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push(positionAt(c, r, cols, rows, wPct, hPct));
    }
  }
  return positions;
}
