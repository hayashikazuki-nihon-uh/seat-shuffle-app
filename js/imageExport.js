const CANVAS_W = 1600;
const CANVAS_H = 1200;
const DESK_W = 150;
const DESK_H = 110;

function fitFontSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `bold ${size}px sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `bold ${size}px sans-serif`;
  }
  return size;
}

function buildFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `座席表_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}.png`;
}

function drawSeatChart(seats, title, rotate180, showFrontZone) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f4f7fb';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#1f2d4a';
  ctx.font = 'bold 40px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 40, 30);

  const areaTop = 110;
  const areaHeight = CANVAS_H - areaTop - 30;

  for (const seat of seats) {
    const effectiveXPct = rotate180 ? 100 - seat.xPct : seat.xPct;
    const effectiveYPct = rotate180 ? 100 - seat.yPct : seat.yPct;
    const cx = (effectiveXPct / 100) * CANVAS_W;
    const cy = areaTop + (effectiveYPct / 100) * areaHeight;
    const x = cx - DESK_W / 2;
    const y = cy - DESK_H / 2;
    const radius = 16;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + DESK_W, y, x + DESK_W, y + DESK_H, radius);
    ctx.arcTo(x + DESK_W, y + DESK_H, x, y + DESK_H, radius);
    ctx.arcTo(x, y + DESK_H, x, y, radius);
    ctx.arcTo(x, y, x + DESK_W, y, radius);
    ctx.closePath();
    ctx.fillStyle = showFrontZone && seat.frontZone ? '#ffe8b0' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2d5aa0';
    ctx.stroke();

    const name = seat.studentName || '';
    const fontSize = fitFontSize(ctx, name, DESK_W - 24, 34);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#1f2d4a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  return canvas;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('画像を保存しました。「ファイル」アプリの「ダウンロード」フォルダをご確認ください。');
}

/**
 * 座席表を画像として書き出す。iPadでは共有シートを開き、
 * 「写真に保存」または「”ファイル”に保存」を選べるようにする。
 * @param {Array<{xPct:number, yPct:number, frontZone?:boolean, studentName:string}>} seats
 * @param {string} title
 * @param {{rotate180?: boolean, showFrontZone?: boolean}} [options]
 */
export async function exportSeatChartImage(seats, title, options = {}) {
  const showFrontZone = options.showFrontZone !== false;
  const canvas = drawSeatChart(seats, title, !!options.rotate180, showFrontZone);
  const filename = buildFilename();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;

  if (navigator.canShare && navigator.share) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // 共有シートをキャンセルした場合は何もしない
        // 共有に失敗した場合はダウンロードにフォールバック
      }
    }
  }

  downloadBlob(blob, filename);
}
