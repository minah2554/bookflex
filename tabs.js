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
  // 칭호 뱃지: 칭호마다 색과 24×24 선 아이콘이 하나씩 있고, 못 얻은 칭호는 회색
  const MEDAL = {
    '첫 장을 넘긴 독자': ['#e5a62c', 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z'],
    '문장 수집가': ['#d6455f', 'M7 8h3v3c0 2-1 3-3 4 M15 8h3v3c0 2-1 3-3 4'],
    '일주일 책벌레': ['#3f9a5c', 'M5 6h14v13H5z M5 10h14 M9 4v4 M15 4v4'],
    '책갈피 탐험가': ['#2a7fae', 'M7 4h10v16l-5-4-5 4z'],
    '책장 지킴이': ['#8450c0', 'M5 5v10 M9 7v8 M13 5v10 M17 8l2 7 M4 18h16'],
    '서재의 건축가': ['#e06f12', 'M5 20V9l7-5 7 5v11 M10 20v-6h4v6'],
    '이야기 항해사': ['#1f94b8', 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M15 9l-2 5-4 1 2-5z'],
    '고전 탐험가': ['#b4452a', 'M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z'],
    '독서 마라토너': ['#2f7d49', 'M6 20V4 M6 5h11l-2 4 2 4H6'],
    '우리 반 문장 친구': ['#3f6bd0', 'M5 6h14v10H10l-4 3v-3H5z'],
  };
  const medal = (n, got, cls = 'medal') => {
    const [c, d] = MEDAL[n] || ['#888', 'M12 5v14'];
    return `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="${got ? c : '#c4cbd1'}"/><circle cx="24" cy="24" r="17.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><g transform="translate(12 12)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g></svg>`;
  };
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
      ${medal(t.n, t.got)}<b>${t.n}</b><small>${t.c}</small><div class="bar"><i style="width:${Math.round(t.cur / t.goal * 100)}%"></i></div>
      <span>${t.got ? (eq && eq.n === t.n ? '장착 중' : '획득 · 눌러서 장착') : `${t.cur} / ${t.goal}`}</span></button>`).join('');
    // 홈 화면의 배지·링크
    $('eqBadge').innerHTML = eq ? medal(eq.n, true, 'medal-mini') + esc(eq.n) : '칭호 없음';
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
  // 상단 「기록하기」: 독서 기록 탭으로 이동
  document.querySelector('.now .cta').addEventListener('click', () => document.querySelector('.tabs [data-view=log]').click());
  render();
})();
