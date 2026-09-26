import { loadState, saveState } from './storage.js';
import { uid } from './id.js';
import { computeGridPosition, generateExplicitGrid } from './deskGrid.js';

class Store {
  constructor() {
    this.state = loadState();
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  _commit() {
    saveState(this.state);
    this.listeners.forEach((fn) => fn(this.state));
  }

  // ---------- 名簿 ----------
  addStudent(name) {
    const student = { id: uid(), name: name.trim(), gender: 'none' };
    this.state.roster.push(student);
    this._commit();
    return student;
  }

  updateStudent(id, patch) {
    const s = this.state.roster.find((r) => r.id === id);
    if (!s) return;
    Object.assign(s, patch);
    this._commit();
  }

  removeStudent(id) {
    this.state.roster = this.state.roster.filter((r) => r.id !== id);
    delete this.state.conditions.byStudentId[id];
    for (const key of Object.keys(this.state.conditions.byStudentId)) {
      const cond = this.state.conditions.byStudentId[key];
      cond.separateFrom = (cond.separateFrom || []).filter((sid) => sid !== id);
    }
    this._commit();
  }

  // ---------- レイアウト ----------
  addDesk() {
    const desk = { id: uid(), xPct: 0, yPct: 0, frontZone: false, manuallyPlaced: false };
    this.state.layout.desks.push(desk);
    this._autoArrangeUnplaced();
    this._commit();
    return desk;
  }

  updateDesk(id, patch) {
    const d = this.state.layout.desks.find((d) => d.id === id);
    if (!d) return;
    Object.assign(d, patch);
    this._commit();
  }

  /** 手動で位置を動かしていない机だけを、はみ出さないグリッドに再配置する */
  _autoArrangeUnplaced() {
    const unplaced = this.state.layout.desks.filter((d) => !d.manuallyPlaced);
    unplaced.forEach((d, i) => {
      const pos = computeGridPosition(i, unplaced.length);
      d.xPct = pos.xPct;
      d.yPct = pos.yPct;
    });
  }

  removeDesk(id) {
    this.state.layout.desks = this.state.layout.desks.filter((d) => d.id !== id);
    for (const key of Object.keys(this.state.conditions.byStudentId)) {
      const cond = this.state.conditions.byStudentId[key];
      if (cond.fixedDeskId === id) cond.fixedDeskId = null;
    }
    this._commit();
  }

  /** 現在の机をすべて置き換えて、指定した行数×列数のグリッドを作成する */
  setGridLayout(rows, cols) {
    const positions = generateExplicitGrid(rows, cols);
    this.state.layout.desks = positions.map((pos) => ({
      id: uid(),
      xPct: pos.xPct,
      yPct: pos.yPct,
      frontZone: false,
      manuallyPlaced: true
    }));
    for (const key of Object.keys(this.state.conditions.byStudentId)) {
      this.state.conditions.byStudentId[key].fixedDeskId = null;
    }
    this._commit();
  }

  // ---------- 条件 ----------
  getCondition(studentId) {
    return (
      this.state.conditions.byStudentId[studentId] || {
        fixedDeskId: null,
        frontRequired: false,
        separateFrom: []
      }
    );
  }

  setCondition(studentId, patch) {
    const current = this.getCondition(studentId);
    this.state.conditions.byStudentId[studentId] = { ...current, ...patch };
    this._commit();
  }

  toggleSeparate(studentIdA, studentIdB) {
    const condA = this.getCondition(studentIdA);
    const setA = new Set(condA.separateFrom || []);
    const condB = this.getCondition(studentIdB);
    const setB = new Set(condB.separateFrom || []);
    if (setA.has(studentIdB)) {
      setA.delete(studentIdB);
      setB.delete(studentIdA);
    } else {
      setA.add(studentIdB);
      setB.add(studentIdA);
    }
    this.state.conditions.byStudentId[studentIdA] = { ...condA, separateFrom: [...setA] };
    this.state.conditions.byStudentId[studentIdB] = { ...condB, separateFrom: [...setB] };
    this._commit();
  }

  // ---------- 履歴 ----------
  addHistoryEntry(entry) {
    this.state.history.unshift({ id: uid(), ...entry });
    this._commit();
  }

  removeHistoryEntry(id) {
    this.state.history = this.state.history.filter((h) => h.id !== id);
    this._commit();
  }
}

export const store = new Store();
