import { store } from './store.js';

export function renderConditions(container) {
  const state = store.getState();
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'panel-intro';
  intro.textContent = '生徒ごとに「前方固定」「特定の机への固定」「離す相手」を設定できます。';
  container.appendChild(intro);

  if (state.roster.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = '先に「名簿」タブで生徒を登録してください。';
    container.appendChild(empty);
    return;
  }
  if (state.layout.desks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = '先に「レイアウト」タブで机を配置してください。';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'conditions-list';

  state.roster.forEach((student) => {
    list.appendChild(renderStudentConditionRow(student, state, container));
  });

  container.appendChild(list);
}

function renderStudentConditionRow(student, state, fullContainer) {
  const cond = store.getCondition(student.id);
  const row = document.createElement('div');
  row.className = 'condition-row';

  const nameEl = document.createElement('div');
  nameEl.className = 'condition-name';
  nameEl.textContent = student.name;
  row.appendChild(nameEl);

  const frontLabel = document.createElement('label');
  frontLabel.className = 'checkbox-row';
  const frontCheckbox = document.createElement('input');
  frontCheckbox.type = 'checkbox';
  frontCheckbox.checked = !!cond.frontRequired;
  frontCheckbox.addEventListener('change', () => {
    store.setCondition(student.id, { frontRequired: frontCheckbox.checked });
  });
  frontLabel.appendChild(frontCheckbox);
  frontLabel.appendChild(document.createTextNode(' 前方固定'));
  row.appendChild(frontLabel);

  const fixedSelect = document.createElement('select');
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = '固定席: 指定なし';
  fixedSelect.appendChild(noneOpt);
  state.layout.desks.forEach((desk, i) => {
    const opt = document.createElement('option');
    opt.value = desk.id;
    opt.textContent = `固定席: 机 ${i + 1}`;
    if (cond.fixedDeskId === desk.id) opt.selected = true;
    fixedSelect.appendChild(opt);
  });
  fixedSelect.addEventListener('change', () => {
    store.setCondition(student.id, { fixedDeskId: fixedSelect.value || null });
  });
  row.appendChild(fixedSelect);

  const details = document.createElement('details');
  details.className = 'separate-details';
  const summary = document.createElement('summary');
  const separateCount = (cond.separateFrom || []).length;
  summary.textContent = `離す相手を設定${separateCount > 0 ? `(${separateCount}人)` : ''}`;
  details.appendChild(summary);

  const others = state.roster.filter((s) => s.id !== student.id);
  if (others.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-msg';
    p.textContent = '他に生徒がいません。';
    details.appendChild(p);
  } else {
    const grid = document.createElement('div');
    grid.className = 'separate-grid';
    others.forEach((other) => {
      const label = document.createElement('label');
      label.className = 'checkbox-row';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = (cond.separateFrom || []).includes(other.id);
      checkbox.addEventListener('change', () => {
        store.toggleSeparate(student.id, other.id);
        renderConditions(fullContainer);
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + other.name));
      grid.appendChild(label);
    });
    details.appendChild(grid);
  }
  row.appendChild(details);

  return row;
}
