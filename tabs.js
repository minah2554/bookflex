// 왼쪽 탭 3개: 내 책장 / 게시판 / 칭호(FLEX LEVEL). 모두 앞서 만든 기록·피드 데이터에서 계산한다.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'bookflex.titles.v1';
  const LV = [0, 50, 150, 300, 500];
  const QUOTES_BASE = 5; // 목업 시작 상태(문장 수집가를 이미 얻은 상태)를 맞추는 샘플 값
  const CLASSICS = ['어린 왕자', '데미안', '동물농장', '노인과 바다', '변신', '1984', '아큐정전', '빨간 머리 앤'];
  const CAT = { '노인과 바다': '문학', '빨간 머리 앤': '문학' }; // 완독 신청 때 고른 분야(샘플)
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

  function ctx() {
    const s = window.BF.stats(), done = window.BF.books().filter(b => b.s.startsWith('완독'));
    const fc = (read('bookflex.feed.v1') || {}).c || {};
    return {
      s, done,
      quotes: window.BF.quotes().length + QUOTES_BASE,
      classics: done.filter(b => CLASSICS.includes(b.t)).length,
      comments: Object.values(fc).reduce((n, a) => n + a.length, 0),
    };
  }
  // 조건은 PRD 11B의 초기 제안값
  const TITLES = [
    { n: '첫 장을 넘긴 독자', c: '첫 유효 독서 기록', goal: 1, v: x => x.s.reads },
    { n: '문장 수집가', c: '한 구절 5개 기록', goal: 5, v: x => x.quotes },
    { n: '일주일 책벌레', c: '서로 다른 날짜 7일 독서 기록', goal: 7, v: x => x.s.days },
    { n: '책갈피 탐험가', c: '누적 100쪽 읽기', goal: 100, v: x => x.s.pages },
    { n: '책장 지킴이', c: '선생님 승인 완독 1권', goal: 1, v: x => x.done.length },
    { n: '서재의 건축가', c: '선생님 승인 완독 3권', goal: 3, v: x => x.done.length },
    { n: '이야기 항해사', c: '누적 500쪽 읽기', goal: 500, v: x => x.s.pages },
    { n: '고전 탐험가', c: '추천 고전 3권 완독 승인', goal: 3, v: x => x.classics },
    { n: '독서 마라토너', c: '서로 다른 날짜 30일 독서 기록', goal: 30, v: x => x.s.days },
    { n: '우리 반 문장 친구', c: '친구 글에 유효 댓글 10개', goal: 10, v: x => x.comments },
  ];
  const view = x => TITLES.map(t => ({ ...t, cur: Math.min(t.goal, t.v(x)), got: t.v(x) >= t.goal }));

  function equipped(list) {
    const eq = (read(KEY) || {}).eq, got = list.filter(t => t.got);
    return got.find(t => t.n === eq) || got.find(t => t.n === '문장 수집가') || got[0] || null;
  }
  const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

  function shelf(x) {
    $('shDone').textContent = x.done.length;
    $('spines').innerHTML = x.done.map((b, i) => `<div class="spine" style="--c:hsl(${hue(b.t)} 55% 55%);--h:${150 - (i % 3) * 14}px" title="${esc(b.t)}"><span>${esc(b.t)}</span></div>`).join('') +
      `<div class="spine now" style="--h:140px" title="읽는 중"><span>어린 왕자 · ${x.s.reached}/${x.s.total}쪽</span></div>` +
      Array.from({ length: Math.max(0, 6 - x.done.length) }, () => '<div class="spine empty" style="--h:140px" aria-hidden="true"></div>').join('');
    $('shRows').innerHTML = x.done.map(b => `<tr><td><b>${esc(b.t)}</b></td><td>${CAT[b.t] || '기타'}</td><td>${esc(b.s.replace('완독 · ', ''))}</td></tr>`).join('');
    const wish = read('bookflex.pick.v1') || [];
    $('wish').innerHTML = wish.length ? wish.map(t => `<span class="badge">${esc(t)}</span>`).join('') : '<small class="note">BOOK PICK에서 마음에 드는 책을 담으면 여기에 모여요.</small>';
  }

  function board() {
    const ps = window.FEED ? window.FEED.mine() : [];
    $('bdPosts').innerHTML = ps.map(p => `<article class="post mine"><header><span class="tag ${p.type === 'quote' ? '' : 'b'}">${p.type === 'quote' ? '한 구절' : '한줄평'}</span><time>${window.FEED.when(p.date)}</time></header>
      <p class="ptxt">${esc(p.text)}</p><small class="src">${esc(p.book)} · ${esc(p.writer)} · 댓글 ${p.count}</small></article>`).join('') || '<p class="note">아직 쓴 글이 없어요.</p>';
  }

  function titles(x) {
    const list = view(x), eq = equipped(list), got = list.filter(t => t.got).length;
    const xp = x.s.xp;
    let i = LV.length - 1; while (xp < LV[i]) i--;
    const next = LV[i + 1];
    $('tCnt').textContent = got;
    $('tLv').textContent = `Lv.${i + 1} · ${xp} XP`;
    $('tXp').style.width = next ? `${Math.round((xp - LV[i]) / (next - LV[i]) * 100)}%` : '100%';
    $('tXpTxt').textContent = next ? `다음 레벨 Lv.${i + 2}까지 ${next - xp} XP` : '최고 레벨이에요';
    $('lvTable').innerHTML = LV.map((n, k) => `<li class="${k === i ? 'cur' : ''}">Lv.${k + 1}<small>${n} XP</small></li>`).join('');
    $('tGrid').innerHTML = list.map(t => `<button type="button" class="tcard${t.got ? ' got' : ''}" data-t="${t.n}" ${t.got ? '' : 'disabled'} aria-pressed="${!!eq && eq.n === t.n}">
      <b>${t.n}</b><small>${t.c}</small><div class="bar"><i style="width:${Math.round(t.cur / t.goal * 100)}%"></i></div>
      <span>${t.got ? (eq && eq.n === t.n ? '장착 중' : '획득 · 눌러서 장착') : `${t.cur} / ${t.goal}`}</span></button>`).join('');
    // 홈 화면의 배지·링크
    $('eqBadge').textContent = eq ? eq.n : '칭호 없음';
    $('titLink').textContent = `칭호 모음 ${got} / ${TITLES.length} 보기`;
  }

  function render() { const x = ctx(); shelf(x); board(); titles(x); }

  $('tGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    try { localStorage.setItem(KEY, JSON.stringify({ eq: b.dataset.t })); } catch {}
    render();
  });
  $('titLink').addEventListener('click', () => document.querySelector('.tabs [data-view=titles]').click());
  document.querySelectorAll('.tabs [data-view]').forEach(b => b.addEventListener('click', render));
  document.addEventListener('bf:change', render);
  render();
})();
