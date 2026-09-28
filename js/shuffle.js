import { getDeskSizePct } from './deskGrid.js';

const MAX_ATTEMPTS = 800;
const ADJACENCY_FACTOR = 1.8;

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function distance(a, b) {
  const dx = a.xPct - b.xPct;
  const dy = a.yPct - b.yPct;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 机同士の「隣接」関係を判定する。
 * 実際に画面上で表示される机の大きさを基準にすることで、
 * 机の間隔が均一でないレイアウト(手動で自由に配置した場合など)でも
 * 「隣接」の判定がずれないようにしている。
 */
function buildAdjacency(desks) {
  const { wPct, hPct } = getDeskSizePct(desks.length);
  const threshold = Math.max(wPct, hPct) * ADJACENCY_FACTOR;
  const adjacency = new Map(desks.map((d) => [d.id, new Set()]));
  for (let i = 0; i < desks.length; i++) {
    for (let j = i + 1; j < desks.length; j++) {
      if (distance(desks[i], desks[j]) <= threshold) {
        adjacency.get(desks[i].id).add(desks[j].id);
        adjacency.get(desks[j].id).add(desks[i].id);
      }
    }
  }
  return adjacency;
}

/**
 * 条件を満たすようにランダムに座席を決定する。
 * @returns {{ok: true, assignment: Record<string,string>} | {ok: false, message: string}}
 */
export function runShuffle({ roster, desks, conditions }) {
  if (roster.length === 0 || desks.length === 0) {
    return { ok: false, message: '生徒または机が登録されていません。' };
  }
  if (roster.length !== desks.length) {
    return { ok: false, message: '机の数と生徒数が一致していません。設定を確認してください。' };
  }

  const adjacency = buildAdjacency(desks);
  const getCondition = (studentId) =>
    conditions.byStudentId[studentId] || { fixedDeskId: null, frontRequired: false, separateFrom: [] };

  const deskIds = new Set(desks.map((d) => d.id));

  const fixedAssignment = {}; // deskId -> studentId
  const fixedStudentIds = new Set();
  for (const student of roster) {
    const cond = getCondition(student.id);
    if (cond.fixedDeskId && deskIds.has(cond.fixedDeskId) && !fixedAssignment[cond.fixedDeskId]) {
      fixedAssignment[cond.fixedDeskId] = student.id;
      fixedStudentIds.add(student.id);
    }
  }

  const separatePairs = [];
  const seenPairs = new Set();
  for (const student of roster) {
    const cond = getCondition(student.id);
    for (const otherId of cond.separateFrom || []) {
      const key = [student.id, otherId].sort().join('|');
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      separatePairs.push([student.id, otherId]);
    }
  }

  const remainingDesks = desks.filter((d) => !fixedAssignment[d.id]);
  const remainingStudents = roster.filter((s) => !fixedStudentIds.has(s.id));
  const frontDesks = remainingDesks.filter((d) => d.frontZone);
  const frontRequiredStudents = remainingStudents.filter((s) => getCondition(s.id).frontRequired);

  if (frontRequiredStudents.length > frontDesks.length) {
    return {
      ok: false,
      message: '前方指定の生徒数が、前方ゾーンに設定された机の数より多いため、座席を決定できません。'
    };
  }

  const otherDesks = remainingDesks.filter((d) => !d.frontZone);
  const otherStudents = remainingStudents.filter((s) => !getCondition(s.id).frontRequired);

  let best = null; // { assignment, genderScore }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const assignment = { ...fixedAssignment };

    const shuffledFrontDesks = shuffleArray(frontDesks);
    frontRequiredStudents.forEach((student, i) => {
      assignment[shuffledFrontDesks[i].id] = student.id;
    });
    // 前方指定の生徒に使われなかった前方ゾーンの机は、前方指定なしの生徒も座れる候補にする
    const flexFrontDesks = shuffledFrontDesks.slice(frontRequiredStudents.length);

    const poolDesks = shuffleArray([...otherDesks, ...flexFrontDesks]);
    const poolStudents = shuffleArray(otherStudents);
    poolStudents.forEach((student, i) => {
      assignment[poolDesks[i].id] = student.id;
    });

    let separationViolations = 0;
    for (const [a, b] of separatePairs) {
      const deskA = Object.keys(assignment).find((k) => assignment[k] === a);
      const deskB = Object.keys(assignment).find((k) => assignment[k] === b);
      if (deskA && deskB && adjacency.get(deskA)?.has(deskB)) {
        separationViolations++;
      }
    }

    if (separationViolations > 0) continue;

    let genderScore = 0;
    for (const desk of desks) {
      const studentId = assignment[desk.id];
      const gender = studentId ? (roster.find((s) => s.id === studentId) || {}).gender : null;
      if (!gender || gender === 'none') continue;
      for (const neighborDeskId of adjacency.get(desk.id) || []) {
        if (neighborDeskId <= desk.id) continue; // 重複カウント防止(文字列比較で十分)
        const neighborStudentId = assignment[neighborDeskId];
        const neighborGender = neighborStudentId
          ? (roster.find((s) => s.id === neighborStudentId) || {}).gender
          : null;
        if (neighborGender && neighborGender === gender) genderScore++;
      }
    }

    if (!best || genderScore < best.genderScore) {
      best = { assignment, genderScore };
      if (genderScore === 0) break;
    }
  }

  if (!best) {
    return {
      ok: false,
      message: '条件を満たす座席配置が見つかりませんでした。「離す」設定を見直してください。'
    };
  }

  return { ok: true, assignment: best.assignment };
}
