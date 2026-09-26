function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 各机の名前表示を、スロットマシン風に高速→減速させて最終結果に着地させる。
 * @param {Array<{deskEl: HTMLElement, finalName: string}>} reels
 * @param {string[]} namePool 高速回転中に表示するランダムな名前候補
 * @param {() => void} onComplete
 */
export function playSlotAnimation(reels, namePool, onComplete) {
  if (reels.length === 0) {
    onComplete();
    return;
  }

  const pool = namePool.length > 0 ? namePool : reels.map((r) => r.finalName);
  let remaining = reels.length;

  reels.forEach((reel, index) => {
    const baseTicks = 22;
    const staggerTicks = Math.floor(index * 1.5) % 10;
    const totalTicks = baseTicks + staggerTicks;
    let tick = 0;

    reel.deskEl.classList.add('reel-spinning');
    reel.deskEl.classList.remove('reel-landed');

    function step() {
      tick++;
      const progress = tick / totalTicks;
      if (tick >= totalTicks) {
        reel.deskEl.textContent = reel.finalName;
        reel.deskEl.classList.remove('reel-spinning');
        reel.deskEl.classList.add('reel-landed');
        remaining--;
        if (remaining === 0) onComplete();
        return;
      }
      reel.deskEl.textContent = pool[Math.floor(Math.random() * pool.length)];
      const delay = 45 + easeOutCubic(progress) * 260;
      setTimeout(step, delay);
    }

    setTimeout(step, index * 40);
  });
}
