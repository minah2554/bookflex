// PAGE LOG(독서 기록): PRD 11A/11B 규칙 — 양끝 포함 쪽수, 중복 구간 차단, 칩·XP 계산
(() => {
  const KEY = 'bookflex.log.v1';
  const BOOK = '어린 왕자', TOTAL = 140;
  const BASE = { pages: 178, chips: 120, xp: 182 }; // 목업의 시작 수치(다른 책 기록 포함)
  const LV = [0, 50, 150, 300, 500];
  const $ = id => document.getElementById(id);
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = ymd(new Date());
  const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const SEED = [
    { date: '2026-11-03', book: '노인과 바다', kind: 'done', pages: 0, chips: 40 },
    { date: '2026-11-05', book: BOOK, kind: 'read', start: 61, end: 84, pages: 24, chips: 38 },
    { date: '2026-11-06', book: BOOK, kind: 'read', start: 85, end: 96, pages: 12, chips: 34 },
  ];

  let st = { entries: SEED, chips: 0, xp: 0, missions: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.entries)) st = s; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

  const reads = () => st.entries.filter(e => e.kind === 'read' && e.book === BOOK);
  const reached = () => Math.max(0, ...reads().map(e => e.end));

  // 하루 첫 기록 +10, 5쪽당 +2(하루 최대 20), 한 구절 +5, 오늘의 미션(10쪽 이상) +15칩. XP는 미션 제외.
  function reward(entries, missions, date, pages, quote) {
    const same = entries.filter(e => e.date === date && e.kind === 'read');
    const list = [];
    if (!same.length) list.push(['오늘 첫 기록', 10]);
    const left = 20 - same.reduce((s, e) => s + (e.pageChips || 0), 0);
    const pc = Math.max(0, Math.min(left, Math.floor(pages / 5) * 2));
    if (pc) list.push([`새로 읽은 ${pages}쪽`, pc]);
    if (quote && !same.some(e => e.quote)) list.push(['한 구절', 5]);
    const xp = list.reduce((s, [, n]) => s + n, 0);
    const dayPages = same.reduce((s, e) => s + e.pages, 0) + pages;
    if (date === today && dayPages >= 10 && !missions.includes(date)) list.push(['미션 · 10쪽 이상', 15]);
    return { list, chips: list.reduce((s, [, n]) => s + n, 0), xp, pc, mission: list.some(([l]) => l.startsWith('미션')) };
  }
  // 자체 점검: 목업의 12쪽 + 한 구절 = 34칩, 19 XP
  { const r = reward([], [], today, 12, 'x'); console.assert(r.chips === 34 && r.xp === 19, 'reward 규칙 불일치', r); }

  function check(date, s, e) {
    if (!date || date > today || date < ago(7)) return '오늘부터 7일 전까지만 기록할 수 있어요.';
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1) return '시작 쪽과 끝 쪽을 입력해 주세요.';
    if (e < s) return '끝 쪽은 시작 쪽보다 크거나 같아야 해요.';
    if (e > TOTAL) return `내 판본은 ${TOTAL}쪽까지예요.`;
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
    $('sumRange').textContent = ok ? `${s}~${e}쪽 · 이제 ${Math.max(e, reached())} / ${TOTAL}쪽` : '시작·끝 쪽을 입력하세요';
    $('sumLeft').textContent = ok ? `완독까지 ${TOTAL - Math.max(e, reached())}쪽 남음` : '';
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
    st.entries.push({ date, book: BOOK, kind: 'read', start: s, end: e, pages, quote: q, chips: r.chips, pageChips: r.pc, mine: true });
    st.chips += r.chips; st.xp += r.xp;
    if (r.mission) st.missions.push(date);
    save();
    $('fEnd').value = ''; $('fQuote').value = '';
    $('fStart').value = reached() + 1;
    render();
    $('logMsg').className = 'msg okm';
    $('logMsg').textContent = `오늘의 PAGE LOG 완료! +${r.chips} 플렉스칩`;
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
    const todayPages = st.entries.filter(e => e.date === today && e.kind === 'read').reduce((s, e) => s + e.pages, 0);
    let i = LV.length - 1; while (xp < LV[i]) i--;
    const next = LV[i + 1];
    $('chipN').textContent = `${chips} 칩`; $('lvPill').textContent = `Lv.${i + 1}`;
    $('totPages').textContent = BASE.pages + st.entries.reduce((s, e) => s + e.pages, 0);
    $('weekDays').textContent = wk;
    $('rdBar').style.width = `${Math.round(reachedP / TOTAL * 100)}%`; $('rdTxt').textContent = `${reachedP}/${TOTAL}`;
    $('msBar').style.width = `${Math.min(100, todayPages * 10)}%`;
    $('lvTxt').textContent = next ? `Lv.${i + 1} · ${xp} XP · Lv.${i + 2}까지 ${next - xp} XP` : `Lv.${i + 1} · ${xp} XP · 최고 레벨`;
    $('xpBar').style.width = next ? `${Math.round((xp - LV[i]) / (next - LV[i]) * 100)}%` : '100%';
    $('bookInfo').textContent = `지난번 ${reachedP}쪽까지 · 내 판본 ${TOTAL}쪽`;
    const n = days.size;
    $('goal').innerHTML = n >= 7 ? '<b>일주일 책벌레</b> 조건 달성!' :
      `<b>일주일 책벌레까지</b><br>서로 다른 날 7일 중 ${n}일${days.has(today) ? '' : `<br><small>오늘 기록하면 ${n + 1}일째</small>`}`;
  }

  function render() { sync(); calendar(); table(); preview(); }

  $('fDate').max = today; $('fDate').min = ago(7); $('fDate').value = today;
  $('fStart').value = reached() + 1;
  render();

  // 다른 화면(FLEX CLASS)이 쓰는 같은 데이터 창구
  window.BF = {
    addChips(n) { st.chips += n; save(); sync(); },
    stats() {
      const es = st.entries, sum = a => a.reduce((s, e) => s + e.pages, 0);
      return {
        pages: BASE.pages + sum(es),
        added: sum(es.filter(e => e.mine)),
        addedWeek: sum(es.filter(e => e.mine && e.date >= ago(6))),
        readToday: es.some(e => e.date === today && e.kind === 'read'),
        today,
        chips: BASE.chips + st.chips,
        days: new Set(es.map(e => e.date)).size,
        reached: reached(),
        total: TOTAL,
      };
    },
  };

  // 탭 전환
  document.querySelectorAll('.tabs [data-view]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs [data-view]').forEach(x => { x.classList.toggle('on', x === b); x.toggleAttribute('aria-current', x === b); });
    $('v-home').hidden = b.dataset.view !== 'home';
    $('v-log').hidden = b.dataset.view !== 'log';
  }));
})();
