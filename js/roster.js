import { store } from './store.js';

const GENDER_LABEL = { none: '未設定', M: '男', F: '女' };

export function renderRoster(container) {
  const state = store.getState();
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'panel-intro';
  intro.textContent = 'クラスの名簿を登録します。性別は座席のバランス調整に使われます(任意)。';
  container.appendChild(intro);

  const addRow = document.createElement('form');
  addRow.className = 'add-row';
  addRow.innerHTML = `
    <input type="text" name="name" placeholder="生徒名を入力" autocomplete="off" />
    <button type="submit" class="primary-btn">追加</button>
  `;
  addRow.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = addRow.querySelector('input[name="name"]');
    const name = input.value.trim();
    if (!name) return;
    store.addStudent(name);
    input.value = '';
    input.focus();
  });
  container.appendChild(addRow);

  const countInfo = document.createElement('p');
  countInfo.className = 'count-info';
  countInfo.textContent = `登録人数: ${state.roster.length}人`;
  container.appendChild(countInfo);

  if (state.roster.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'まだ生徒が登録されていません。';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'roster-list';

  state.roster.forEach((student) => {
    const li = document.createElement('li');
    li.className = 'roster-item';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = student.name;
    nameInput.className = 'roster-name-input';
    nameInput.addEventListener('change', () => {
      const value = nameInput.value.trim();
      if (value) store.updateStudent(student.id, { name: value });
      else nameInput.value = student.name;
    });

    const genderSelect = document.createElement('select');
    genderSelect.className = 'roster-gender-select';
    Object.entries(GENDER_LABEL).forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (student.gender === value) opt.selected = true;
      genderSelect.appendChild(opt);
    });
    genderSelect.addEventListener('change', () => {
      store.updateStudent(student.id, { gender: genderSelect.value });
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn danger';
    delBtn.textContent = '削除';
    delBtn.addEventListener('click', () => {
      if (confirm(`「${student.name}」を名簿から削除しますか?`)) {
        store.removeStudent(student.id);
      }
    });

    li.appendChild(nameInput);
    li.appendChild(genderSelect);
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  container.appendChild(list);
}
