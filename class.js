// FLEX CLASS: 우리 반 책장·공동 미션·책친구 서재 방문(고유 친구 하루 3명까지 +3칩)
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.visit.v1';
  const CAP = 3, CHIP = 3, BASE = { pages: 4812, week: 612, books: 37, others: 21, total: 27 };
  const FRIENDS = [
    ['고양이문고', '첫 장을 넘긴 독자', 198, 1, 3], ['구름빵집', '문장 수집가', 165, 1, 3],
    ['바다유리', '책갈피 탐험가', 276, 2, 5], ['별빛책방', '문장 수집가', null, 2, 4, true],
    ['새벽세시', '이야기 항해사', 512, 4, 6], ['책갈피탐험가', '일주일 책벌레', 340, 3, 7],
    ['초록연필', '첫 장을 넘긴 독자', 88, 0, 2], ['해바라기', '책장 지킴이', 230, 1, 4],
  ];
  const fmt = n => n.toLocaleString('ko-KR');
  const today = () => window.BF.stats().today;

  let v = { date: '', names: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.names)) v = s; } catch {}
  const todayVisits = () => (v.date === today() ? v.names : []);

  function shelf() {
    const hues = ['#e0556f', '#3a7bd5', '#f2b84b', '#4f9d69', '#8e63c9', '#2aa0c8', '#f2765a'];
    let h = '';
    for (let i = 0; i < BASE.books; i++) h += `<i style="--c:${hues[(i * 5 + (i >> 2)) % 7]};--h:${58 + ((i * 11) % 22)}px"></i>`;
    $('shelf').innerHTML = h + '<i class="slot" title="다음 칸은 누구 책?"></i>';
  }

  function render() {
    const st = window.BF.stats();
    $('cPages').textContent = fmt(BASE.pages + st.added);
    $('cWeek').textContent = fmt(BASE.week + st.addedWeek);
    document.querySelectorAll('.myp').forEach(e => (e.textContent = st.pages));

    const done = BASE.others + (st.readToday ? 1 : 0), left = BASE.total - done;
    $('cBar').style.width = `${Math.round(done / BASE.total * 100)}%`;
    $('cMis').textContent = left > 0 ? `${done} / ${BASE.total}명 — ${left}명만 더 읽으면 모두 +30칩` : '우리 반 모두 달성! 전원 +30칩';

    const seen = todayVisits(), capped = seen.length >= CAP;
    $('friends').innerHTML = [...FRIENDS].sort((a, b) => a[0].localeCompare(b[0], 'ko')).map(([n, t, p, b, d, me]) => {
      const pages = me ? st.pages : p;
      const btn = me ? '<button type="button" class="cta mini" data-go="my">내 서재</button>'
        : seen.includes(n) ? '<button type="button" class="cta mini done" disabled>오늘 다녀옴</button>'
        : `<button type="button" class="cta mini" data-visit="${n}">놀러가기${capped ? '' : ` +${CHIP}칩`}</button>`;
      return `<article class="fcard${me ? ' me' : ''}"><b>${n}</b><span class="badge">${t}</span><small>누적 ${pages}쪽 · 완독 ${b}권 · 이번 주 ${d}일</small>${btn}</article>`;
    }).join('');
  }

  $('friends').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go) return show('my');
    const name = b.dataset.visit;
    if (v.date !== today()) v = { date: today(), names: [] };
    if (v.names.includes(name)) return;
    const gain = v.names.length < CAP ? CHIP : 0;
    v.names.push(name);
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
    if (gain) window.BF.addChips(gain);
    render();
    $('vMsg').className = 'msg okm';
    $('vMsg').textContent = gain ? `FLEX VISIT — ${name}의 서재에 다녀왔어요! +${gain} 플렉스칩` : `${name}의 서재에 다녀왔어요. 오늘 칩은 3명까지만 받아요.`;
  });

  function show(page) {
    const cls = page === 'class', sub = cls || page === 'shop';
    document.querySelectorAll('[data-page]').forEach(b => { b.classList.toggle('on', b.dataset.page === page); b.toggleAttribute('aria-current', b.dataset.page === page); });
    $('v-class').hidden = !cls;
    $('v-shop').hidden = page !== 'shop';
    document.querySelector('.panel .head').hidden = sub;
    document.querySelector('.tabs').hidden = sub;
    const log = document.querySelector('.tabs .on')?.dataset.view === 'log';
    $('v-home').hidden = sub || log;
    $('v-log').hidden = sub || !log;
    if (cls) render();
  }
  document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => show(b.dataset.page)));
  shelf();
})();
