// FLEX MISSION: 날짜 시드로 매일 고정되는 개인·학급 미션, 달성 시 하루 1회 보상(PRD 11C)
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.mission.v1', TOTAL = 27, P_CHIP = 15, C_CHIP = 30;
  const visits = () => { try { const v = JSON.parse(localStorage.getItem('bookflex.visit.v1')); return v && v.date === window.BF.stats().today ? v.names.length : 0; } catch { return 0; } };

  const comments = () => { try { const f = JSON.parse(localStorage.getItem('bookflex.feed.v1')); return (f && f.v && f.v[window.BF.stats().today]) || 0; } catch { return 0; } };
  const PERSONAL = [
    { title: '오늘 10쪽 이상 읽고 기록하기', goal: 10, unit: '쪽', how: '당일 중복 제외 페이지 합계 10쪽 이상', val: s => s.todayPages },
    { title: '오늘의 한 구절 남기기', goal: 1, unit: '개', how: '당일 한 구절 저장', val: s => s.todayQuotes },
    { title: '친구 2명의 서재 방문하기', goal: 2, unit: '명', how: '당일 서로 다른 친구 2명 방문', val: () => visits() },
    { title: '친구 글에 댓글 1개 달기', goal: 1, unit: '개', how: '당일 친구 글에 10자 이상 댓글 1개', val: () => comments() },
  ];
  // base: 오늘 이미 달성한 샘플 인원(학급 서버가 생기기 전 값)
  const CLASS = [
    { title: '모두 1쪽 이상 읽기', base: 21, more: '읽으면', how: '학급 전원 유효 기록', mine: s => s.readToday },
    { title: '모두 한 구절 남기기', base: 18, more: '남기면', how: '학급 전원 한 구절', mine: s => s.todayQuotes > 0 },
    { title: '모두 친구 서재 1곳 방문하기', base: 15, more: '놀러가면', how: '학급 전원 고유 방문 1명 이상', mine: () => visits() >= 1 },
  ];

  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pick = (arr, date, salt) => arr[hash(date + salt) % arr.length];

  let m = { p: [], c: [], demo: [], got: {} };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.p)) m = { ...m, ...s }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} };

  const today = () => window.BF.stats().today;
  function personal() {
    const s = window.BF.stats(), p = pick(PERSONAL, s.today, 'p'), val = Math.min(p.goal, p.val(s));
    return { ...p, val, done: val >= p.goal };
  }
  function classInfo() {
    const s = window.BF.stats(), c = pick(CLASS, s.today, 'c');
    const done = (m.demo.includes(s.today) ? TOTAL - 1 : c.base) + (c.mine(s) ? 1 : 0);
    return { ...c, done, total: TOTAL, left: TOTAL - done };
  }
  // 자체 점검: 같은 날짜는 항상 같은 미션
  console.assert(pick(PERSONAL, '2026-11-07', 'p') === pick(PERSONAL, '2026-11-07', 'p'), '미션이 날짜마다 고정되지 않음');

  function check() {
    const d = today(), msgs = [];
    if (personal().done && !m.p.includes(d)) { m.p.push(d); window.BF.addChips(P_CHIP); m.got[d] = (m.got[d] || 0) + P_CHIP; msgs.push(`개인 미션 완료! +${P_CHIP}칩`); }
    if (classInfo().left <= 0 && !m.c.includes(d)) { m.c.push(d); window.BF.addChips(C_CHIP); m.got[d] = (m.got[d] || 0) + C_CHIP; msgs.push(`우리 반 미션 전원 달성! +${C_CHIP}칩`); }
    if (msgs.length) { save(); $('mMsg').className = 'msg okm'; $('mMsg').textContent = `FLEX MISSION — ${msgs.join(' · ')}`; }
    render();
  }

  function render() {
    const d = today(), p = personal(), c = classInfo();
    const ppct = `${Math.round(p.val / p.goal * 100)}%`, cpct = `${Math.round(c.done / c.total * 100)}%`;
    const cTxt = c.left > 0 ? `${c.done} / ${c.total}명 — ${c.left}명만 더 ${c.more} 모두 +${C_CHIP}칩` : `우리 반 모두 달성! 전원 +${C_CHIP}칩`;
    // 홈 카드
    $('msName').textContent = `나 · ${p.title}`; $('msBar').style.width = ppct;
    $('cmName').textContent = `우리 반 · ${c.title}`; $('cmBar').style.width = cpct; $('cmSmall').textContent = cTxt;
    // 미션 화면
    $('pmTitle').textContent = p.title; $('pmBar').style.width = ppct;
    $('pmTxt').textContent = m.p.includes(d) ? `완료! +${P_CHIP}칩을 받았어요` : `${p.val} / ${p.goal}${p.unit}`;
    $('cmTitle').textContent = c.title; $('cmBar2').style.width = cpct; $('cmTxt').textContent = cTxt;
    document.querySelector('#v-mission .mcard.cls').classList.toggle('win', c.left <= 0);
    $('mGot').textContent = m.got[d] || 0;
    $('mPool').innerHTML = [
      ...PERSONAL.map(x => `<li><span class="tag">개인</span><b>${x.title}</b><small>${x.how}</small>${x.title === p.title ? '<em>오늘</em>' : ''}</li>`),
      ...CLASS.map(x => `<li><span class="tag c">우리 반</span><b>${x.title}</b><small>${x.how}</small>${x.title === c.title ? '<em>오늘</em>' : ''}</li>`),
    ].join('');
    $('mDemo').disabled = m.demo.includes(d);
  }

  $('mDemo').addEventListener('click', () => { if (!m.demo.includes(today())) { m.demo.push(today()); save(); check(); } });
  document.addEventListener('bf:change', check);
  document.querySelector('[data-page=mission]').addEventListener('click', () => { $('mMsg').textContent = ''; render(); });
  window.MISSION = { classInfo, personal, check };
  check();
})();
