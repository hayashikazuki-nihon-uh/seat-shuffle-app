/**
 * 画面下部に短いメッセージを表示する。
 * @param {string} message
 * @param {{persistent?: boolean, duration?: number}} [options] persistent=true の場合は自動で消えない(ページ遷移などで消える想定)
 * @returns {HTMLElement} 生成したトースト要素
 */
export function showToast(message, options = {}) {
  const { persistent = false, duration = 3200 } = options;
  const toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  if (!persistent) {
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  return toast;
}

/** persistent なトーストを消す */
export function hideToast(toast) {
  if (!toast) return;
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 400);
}
