// PAGE LOG(독서 기록): PRD 11A/11B 규칙 — 양끝 포함 쪽수, 중복 구간 차단, 칩·XP 계산
(() => {
  const KEY = 'bookflex.log.v1';
  const BOOK0 = '어린 왕자'; // 처음 등록돼 있는 책(140쪽). 책은 직접 더 등록할 수 있다
  const BASE = { pages: 178, chips: 120, xp: 182 }; // 목업의 시작 수치(다른 책 기록 포함)
  const LV = [0, 50, 150, 300, 500];
  const $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = ymd(new Date());
  const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const SEED = [
    { date: '2026-10-20', book: '빨간 머리 앤', kind: 'done', pages: 0, chips: 40 }, // 완독 2권을 맞추려는 샘플
    { date: '2026-11-03', book: '노인과 바다', kind: 'done', pages: 0, chips: 40 },
    { date: '2026-11-05', book: BOOK0, kind: 'read', start: 61, end: 84, pages: 24, chips: 38 },
    { date: '2026-11-06', book: BOOK0, kind: 'read', start: 85, end: 96, pages: 12, chips: 34 },
  ];

  let st = { entries: SEED, chips: 0, xp: 0, missions: [], lib: [{ t: BOOK0, w: '앙투안 드 생텍쥐페리', total: 140 }], cur: BOOK0 };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.entries)) st = { ...st, ...s }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

  const cb = () => st.lib.find(b => b.t === st.cur) || st.lib[0];
  const tot = () => cb().total;
  const reads = () => st.entries.filter(e => e.kind === 'read' && e.book === cb().t);
  const reachedOf = b => Math.max(0, ...st.entries.filter(e => e.kind === 'read' && e.book === b.t).map(e => e.end));
  const reached = () => reachedOf(cb());
  // 완독까지 걸린 날수: 그 책의 첫 기록일부터 완독일까지(양끝 포함). 샘플 책은 기록이 없어 고정값
  const SAMPLE_DAYS = { '빨간 머리 앤': 9, '노인과 바다': 6 };
  function daysTaken(e) {
    const first = st.entries.filter(x => x.kind === 'read' && x.book === e.book).map(x => x.date).sort()[0];
    return first ? Math.max(1, Math.round((new Date(e.date) - new Date(first)) / 864e5) + 1) : SAMPLE_DAYS[e.book] || null;
  }

  // 하루 첫 기록 +10, 5쪽당 +2(하루 최대 20), 한 구절 +5. 미션 보상은 mission.js가 따로 지급한다.
  function reward(entries, missions, date, pages, quote) {
    const same = entries.filter(e => e.date === date && e.kind === 'read');
    const list = [];
    if (!same.length) list.push(['오늘 첫 기록', 10]);
    const left = 20 - same.reduce((s, e) => s + (e.pageChips || 0), 0);
    const pc = Math.max(0, Math.min(left, Math.floor(pages / 5) * 2));
    if (pc) list.push([`새로 읽은 ${pages}쪽`, pc]);
    if (quote && !same.some(e => e.quote)) list.push(['한 구절', 5]);
    const xp = list.reduce((s, [, n]) => s + n, 0);
    return { list, chips: xp, xp, pc };
  }
  // 자체 점검: 12쪽 + 한 구절 = 19칩, 19 XP
  { const r = reward([], [], today, 12, 'x'); console.assert(r.chips === 19 && r.xp === 19, 'reward 규칙 불일치', r); }

  function check(date, s, e) {
    if (!date || date > today || date < ago(7)) return '오늘부터 7일 전까지만 기록할 수 있어요.';
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1) return '시작 쪽과 끝 쪽을 입력해 주세요.';
    if (e < s) return '끝 쪽은 시작 쪽보다 크거나 같아야 해요.';
    if (e > tot()) return `내 판본은 ${tot()}쪽까지예요.`;
    const hit = reads().find(r => s <= r.end && e >= r.start);
    return hit ? `이미 기록한 ${hit.start}~${hit.end}쪽과 겹쳐요.` : '';
  }

  const vals = () => ({ date: $('fDate').value, s: parseInt($('fStart').value, 10), e: parseInt($('fEnd').value, 10), q: $('fQuote').value.trim() });

  function preview() {
    const { date, s, e, q } = vals();
    const filled = $('fStart').value && $('fEnd').value;
    const err = filled ? check(date, s, e) : '';
    $('logMsg').className = 'msg'; $('logMsg').textContent = err;
    const ok = filled && !err;
    const pages = ok ? e - s + 1 : 0;
    $('sumPages').textContent = pages;
    $('sumRange').textContent = ok ? `${s}~${e}쪽 · 이제 ${Math.max(e, reached())} / ${tot()}쪽` : '시작·끝 쪽을 입력하세요';
    $('sumLeft').textContent = ok ? `완독까지 ${tot() - Math.max(e, reached())}쪽 남음` : '';
    const r = ok ? reward(st.entries, st.missions, date, pages, q) : { list: [], chips: 0, xp: 0 };
    $('sumList').innerHTML = r.list.map(([l, n]) => `<li><span>${l}</span><b>+${n}칩</b></li>`).join('') +
      (ok ? `<li class="xpr"><span>독서 XP</span><b>+${r.xp} XP</b></li>` : '');
    $('saveBtn').textContent = ok ? `기록 저장하고 ${r.chips}칩 받기` : '기록 저장하기';
  }

  $('logForm').addEventListener('input', preview);
  $('logForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const { date, s, e, q } = vals();
    const err = check(date, s, e);
    if (err) { $('logMsg').className = 'msg'; $('logMsg').textContent = err; return; }
    const pages = e - s + 1, r = reward(st.entries, st.missions, date, pages, q);
    st.entries.push({ date, book: cb().t, kind: 'read', start: s, end: e, pages, quote: q, chips: r.chips, pageChips: r.pc, mine: true });
    st.chips += r.chips; st.xp += r.xp;
    const fin = reached() >= tot() && !cb().fin; // 끝 쪽까지 읽으면 완독 신청(선생님 승인 대기)
    if (fin) cb().fin = true;
    save();
    $('fEnd').value = ''; $('fQuote').value = '';
    $('fStart').value = reached() + 1;
    render();
    $('logMsg').className = 'msg okm';
    $('logMsg').textContent = `오늘의 PAGE LOG 완료! +${r.chips} 플렉스칩` + (fin ? ` · 「${cb().t}」을(를) 끝까지 읽었어요. 선생님 승인을 기다려요` : '');
    document.dispatchEvent(new Event('bf:change'));
  });

  // 달력
  let cm = new Date(); cm.setDate(1);
  function calendar() {
    const y = cm.getFullYear(), m = cm.getMonth();
    $('calT').textContent = `${y}년 ${m + 1}월`;
    const dates = d => st.entries.filter(e => e.date === d);
    let h = '일월화수목금토'.split('').map(d => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(new Date(y, m, 1).getDay());
    for (let d = 1, n = new Date(y, m + 1, 0).getDate(); d <= n; d++) {
      const key = ymd(new Date(y, m, d)), es = dates(key);
      const c = [es.some(e => e.kind === 'done') ? 'd' : es.length ? 'r' : '', key === today ? 't' : ''].join(' ');
      h += `<span class="day ${c}">${d}</span>`;
    }
    $('cal').innerHTML = h;
  }
  $('prevM').onclick = () => { cm.setMonth(cm.getMonth() - 1); calendar(); table(); };
  $('nextM').onclick = () => { cm.setMonth(cm.getMonth() + 1); calendar(); table(); };

  function table() {
    const p = `${cm.getFullYear()}-${String(cm.getMonth() + 1).padStart(2, '0')}`;
    const rows = st.entries.filter(e => e.date.startsWith(p)).sort((a, b) => b.date.localeCompare(a.date) || (b.end || 0) - (a.end || 0));
    $('logRows').innerHTML = rows.length ? rows.map(e =>
      `<tr><td>${e.date.slice(5).replace('-', '.')}</td><td><b>${e.book}</b></td><td>${e.kind === 'done' ? '완독 승인' : `${e.start}~${e.end}`}</td><td>${e.kind === 'done' ? '—' : e.pages + '쪽'}</td><td class="chp">+${e.chips}</td></tr>`).join('')
      : '<tr><td colspan="5">이 달에는 아직 기록이 없어요.</td></tr>';
  }

  // 홈 화면 수치도 같은 데이터에서 계산
  function sync() {
    const chips = BASE.chips + st.chips, xp = BASE.xp + st.xp;
    const days = new Set(st.entries.map(e => e.date)), reachedP = reached();
    const wk = [...Array(7).keys()].filter(i => days.has(ago(i))).length;
    let i = LV.length - 1; while (xp < LV[i]) i--;
    const next = LV[i + 1];
    $('chipN').textContent = `${chips} 칩`; $('lvPill').textContent = `Lv.${i + 1}`;
    $('totPages').textContent = BASE.pages + st.entries.reduce((s, e) => s + e.pages, 0);
    $('weekDays').textContent = wk;
    $('rdBar').style.width = `${Math.round(reachedP / tot() * 100)}%`; $('rdTxt').textContent = `${reachedP}/${tot()}`; $('rdBook').textContent = cb().t;
    $('lvTxt').textContent = next ? `Lv.${i + 1} · ${xp} XP · Lv.${i + 2}까지 ${next - xp} XP` : `Lv.${i + 1} · ${xp} XP · 최고 레벨`;
    $('xpBar').style.width = next ? `${Math.round((xp - LV[i]) / (next - LV[i]) * 100)}%` : '100%';
    $('bookInfo').textContent = `지난번 ${reachedP}쪽까지 · 내 판본 ${tot()}쪽`;
    $('bookSel').innerHTML = st.lib.map(b => `<option value="${esc(b.t)}"${b.t === st.cur ? ' selected' : ''}>${esc(b.t)}${b.ok ? ' (완독)' : b.fin ? ' (완독 신청)' : ''}</option>`).join('');
    const n = days.size;
    $('goal').innerHTML = n >= 7 ? '<b>일주일 책벌레</b> 조건 달성!' :
      `<b>일주일 책벌레까지</b><br>서로 다른 날 7일 중 ${n}일${days.has(today) ? '' : `<br><small>오늘 기록하면 ${n + 1}일째</small>`}`;
  }

  function render() { sync(); calendar(); table(); preview(); }
  function switched() { $('fStart').value = reached() + 1; $('fEnd').value = ''; save(); render(); document.dispatchEvent(new Event('bf:change')); }
  $('bookSel').addEventListener('change', e => { st.cur = e.target.value; switched(); });
  // 책 등록: 제목·쪽수는 필수. 이미 등록한 제목이면 새로 만들지 않고 그 책으로 바꾼다
  function addBook(t, w, n) {
    t = String(t || '').trim(); w = String(w || '').trim(); n = parseInt(n, 10);
    if (!t) return { err: '책 제목을 적어 주세요.' };
    if (t.length > 40) return { err: '책 제목은 40자까지 적을 수 있어요.' };
    if (!Number.isInteger(n) || n < 10 || n > 3000) return { err: '내 판본의 전체 쪽수를 10~3000 사이로 적어 주세요.' };
    const dup = st.lib.some(b => b.t === t);
    if (!dup) st.lib.push({ t, w: w || '저자 미상', total: n });
    st.cur = t; switched();
    return { ok: true, dup };
  }
  // 책 수정: 제목·저자·쪽수. 제목을 바꾸면 그 책의 기록도 새 제목으로 이어진다
  function editBook(t, w, n) {
    t = String(t || '').trim(); w = String(w || '').trim(); n = parseInt(n, 10);
    const bk = cb(), r = reached();
    if (!t) return { err: '책 제목을 적어 주세요.' };
    if (t.length > 40) return { err: '책 제목은 40자까지 적을 수 있어요.' };
    if (t !== bk.t && st.lib.some(x => x.t === t)) return { err: '이미 등록한 제목이에요.' };
    if (!Number.isInteger(n) || n < 10 || n > 3000) return { err: '내 판본의 전체 쪽수를 10~3000 사이로 적어 주세요.' };
    if (n < r) return { err: `이미 ${r}쪽까지 읽었어요. ${r}쪽보다 적게 바꿀 수 없어요.` };
    st.entries.forEach(e => { if (e.book === bk.t) e.book = t; });
    Object.assign(bk, { t, w: w || '저자 미상', total: n, fin: r >= n });
    st.cur = t; switched();
    return { ok: true };
  }
  let editing = false;
  function openForm(edit) {
    editing = edit; $('delRow').hidden = true; $('abMsg').textContent = '';
    $('addBook').hidden = false; $('abOk').textContent = edit ? '저장하기' : '등록하기';
    $('abT').value = edit ? cb().t : ''; $('abW').value = edit && cb().w !== '저자 미상' ? cb().w : ''; $('abN').value = edit ? cb().total : '';
    $('abT').focus();
  }
  const closeForm = () => { $('addBook').hidden = true; $('delRow').hidden = true; };
  $('addBookBtn').addEventListener('click', () => ($('addBook').hidden || editing ? openForm(false) : closeForm()));
  $('editBookBtn').addEventListener('click', () => ($('addBook').hidden || !editing ? openForm(true) : closeForm()));
  // 삭제: 읽는 책이 하나는 남아야 한다. 읽은 기록·칩·XP는 지우지 않고 책 목록에서만 뺀다
  $('delBookBtn').addEventListener('click', () => {
    $('logMsg').className = 'msg';
    if (st.lib.length < 2) { $('logMsg').textContent = '읽는 책이 하나는 있어야 해요. 다른 책을 먼저 등록해 주세요.'; return; }
    $('addBook').hidden = true; $('delRow').hidden = false; $('delTxt').textContent = `「${cb().t}」을(를) 책 목록에서 삭제할까요? 읽은 기록과 칩은 그대로 남아요.`;
  });
  $('delNo').addEventListener('click', () => ($('delRow').hidden = true));
  $('delYes').addEventListener('click', () => {
    const gone = cb().t;
    st.lib = st.lib.filter(x => x.t !== gone); st.cur = st.lib[0].t;
    $('delRow').hidden = true; switched();
    $('logMsg').className = 'msg okm'; $('logMsg').textContent = `「${gone}」을(를) 책 목록에서 삭제했어요. 「${st.cur}」을(를) 읽는 책으로 바꿨어요.`;
  });
  const doAdd = () => {
    const was = editing, r = (was ? editBook : addBook)($('abT').value, $('abW').value, $('abN').value), m = $('abMsg');
    m.className = r.err ? 'msg' : 'msg okm';
    m.textContent = r.err || (was ? `「${st.cur}」 정보를 저장했어요.` : r.dup ? '이미 등록한 책이에요. 이 책으로 바꿨어요.' : `「${st.cur}」을(를) 읽는 책으로 등록했어요. 읽은 쪽을 적어 보세요.`);
    if (r.ok) { ['abT', 'abW', 'abN'].forEach(i => ($(i).value = '')); closeForm(); $('logMsg').className = 'msg okm'; $('logMsg').textContent = m.textContent; }
  };
  $('abOk').addEventListener('click', doAdd);
  $('addBook').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

  $('fDate').max = today; $('fDate').min = ago(7); $('fDate').value = today;
  $('fStart').value = reached() + 1;
  render();

  // 다른 화면(FLEX CLASS)이 쓰는 같은 데이터 창구
  window.BF = {
    addChips(n) { st.chips += n; save(); sync(); },
    // 교사용: 완독 승인(분야 기록, +40칩)·반려
    pending: () => st.lib.filter(b => b.fin && !b.ok).map(b => ({ ...b })),
    approve(t, cat) {
      const b = st.lib.find(x => x.t === t);
      if (!b || !b.fin || b.ok) return false;
      b.ok = true; st.entries.push({ date: today, book: t, kind: 'done', pages: 0, chips: 40, cat: cat || '기타' });
      st.chips += 40; save(); render(); document.dispatchEvent(new Event('bf:change')); return true;
    },
    reject(t) { const b = st.lib.find(x => x.t === t); if (!b || !b.fin || b.ok) return false; b.fin = false; save(); render(); document.dispatchEvent(new Event('bf:change')); return true; },
    entries: () => st.entries.map(e => ({ ...e })),
    addBook,
    library: () => st.lib.map(b => b.t),
    // 책장 툴팁용: 읽는 중인 책 + 승인된 완독(최신순)
    books: () => [
      ...[cb(), ...st.lib.filter(b => b !== cb())].filter(b => !b.ok).map(b => ({ t: b.t, s: b.fin ? '승인 대기 · 끝까지 읽음' : `읽는 중 · ${reachedOf(b)}/${b.total}쪽` })),
      ...st.entries.filter(e => e.kind === 'done').sort((a, b) => b.date.localeCompare(a.date)).map(e => ({ t: e.book, s: `완독 · ${e.date.slice(5).replace('-', '.')}`, c: e.cat, n: daysTaken(e) })),
    ],
    quotes: () => st.entries.filter(e => e.quote).map(e => ({ id: `q-${e.date}-${e.start}`, date: e.date, text: e.quote, book: e.book, writer: (st.lib.find(b => b.t === e.book) || {}).w || '' })),
    stats() {
      const es = st.entries, sum = a => a.reduce((s, e) => s + e.pages, 0);
      return {
        pages: BASE.pages + sum(es),
        added: sum(es.filter(e => e.mine)),
        addedWeek: sum(es.filter(e => e.mine && e.date >= ago(6))),
        readToday: es.some(e => e.date === today && e.kind === 'read'),
        today,
        todayPages: sum(es.filter(e => e.date === today && e.kind === 'read')),
        todayQuotes: es.filter(e => e.date === today && e.quote).length,
        chips: BASE.chips + st.chips,
        xp: BASE.xp + st.xp,
        reads: es.filter(e => e.kind === 'read').length,
        days: new Set(es.map(e => e.date)).size,
        reached: reached(),
        total: tot(),
        book: cb().t,
        writer: cb().w,
      };
    },
  };

  // 탭 전환
  document.querySelectorAll('.tabs [data-view]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs [data-view]').forEach(x => { x.classList.toggle('on', x === b); x.toggleAttribute('aria-current', x === b); });
    ['home', 'log', 'shelf', 'board', 'titles'].forEach(n => ($('v-' + n).hidden = b.dataset.view !== n));
  }));
})();
