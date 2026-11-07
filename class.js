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
  // 친구 방(샘플): 많이 읽은 친구일수록 물건이 많다. 나머지는 학급 서버가 생기면 실제 데이터로 바뀐다.
  const ROOMS = {
    고양이문고: { wall: 'cream', floor: 'wood', ids: ['bed', 'shelf', 'plant'], avatar: { hair: '#222222', top: '#5b86e5' }, say: '고양이 책 추천해 줘!' },
    구름빵집: { wall: 'cream', floor: 'wood', ids: ['bed', 'shelf', 'rug', 'poster'], avatar: { hair: '#e07a9a', top: '#f2b84b' }, say: '빵 냄새 나는 책이 좋아' },
    바다유리: { wall: 'blue', floor: 'wood', ids: ['bed', 'rug', 'shelf', 'window', 'plant'], avatar: { hair: '#6b3f2a', top: '#4f9d69' }, say: '앤 얘기 같이 해요~' },
    새벽세시: { wall: 'blue', floor: 'tile', ids: ['bed', 'shelf', 'desk', 'lamp', 'window', 'chair', 'books'], avatar: { hair: '#222222', top: '#e0556f' }, say: '밤에 읽는 게 제일 좋아' },
    책갈피탐험가: { wall: 'cream', floor: 'carpet', ids: ['bed', 'shelf', 'desk', 'bmark', 'mug', 'rug', 'frame'], avatar: { hair: '#c98a3c', top: '#5b86e5' }, say: '여기 책갈피 구경해!' },
    초록연필: { wall: 'cream', floor: 'wood', ids: ['bed', 'shelf'], avatar: { hair: '#6b3f2a', top: '#4f9d69' }, say: '이제 막 시작했어요' },
    해바라기: { wall: 'cream', floor: 'wood', ids: ['bed', 'shelf', 'sunset', 'roundrug', 'plant'], avatar: { hair: '#c98a3c', top: '#f2b84b' }, say: '노을 보며 읽는 중' },
  };
  const POOL = ['어린 왕자', '데미안', '동물농장', '노인과 바다', '변신', '빨간 머리 앤', '1984'];
  const PH = '[학생이 직접 쓴 글이 들어갈 자리]';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

    const c = window.MISSION.classInfo();
    $('cName').textContent = c.title;
    $('cBar').style.width = `${Math.round(c.done / c.total * 100)}%`;
    $('cMis').textContent = c.left > 0 ? `${c.done} / ${c.total}명 — ${c.left}명만 더 ${c.more} 모두 +30칩` : '우리 반 모두 달성! 전원 +30칩';

    const seen = todayVisits(), capped = seen.length >= CAP;
    $('friends').innerHTML = [...FRIENDS].sort((a, b) => (a[5] ? window.PROFILE.name : a[0]).localeCompare(b[5] ? window.PROFILE.name : b[0], 'ko')).map(([n, t, p, b, d, me]) => {
      const pages = me ? st.pages : p, nm = me ? window.PROFILE.name : n;
      const btn = me ? '<button type="button" class="cta mini" data-go="my">내 서재</button>'
        : seen.includes(n) ? `<button type="button" class="cta mini done" data-again="${n}">오늘 다녀옴 · 다시 보기</button>`
        : `<button type="button" class="cta mini" data-visit="${n}">놀러가기${capped ? '' : ` +${CHIP}칩`}</button>`;
      return `<article class="fcard${me ? ' me' : ''}"><b>${esc(nm)}</b><span class="badge">${t}</span><small>누적 ${pages}쪽 · 완독 ${b}권 · 이번 주 ${d}일</small>${btn}</article>`;
    }).join('');
  }

  $('friends').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go) return show('my');
    if (b.dataset.again) return openVisit(b.dataset.again);
    const name = b.dataset.visit;
    if (v.date !== today()) v = { date: today(), names: [] };
    if (v.names.includes(name)) return;
    const gain = v.names.length < CAP ? CHIP : 0;
    v.names.push(name);
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
    if (gain) window.BF.addChips(gain);
    render();
    document.dispatchEvent(new Event('bf:change'));
    $('vMsg').className = 'msg okm';
    $('vMsg').textContent = gain ? `FLEX VISIT — ${name}의 서재에 다녀왔어요! +${gain} 플렉스칩` : `${name}의 서재에 다녀왔어요. 오늘 칩은 3명까지만 받아요.`;
    openVisit(name);
    $('vNote').className = $('vMsg').className; $('vNote').textContent = $('vMsg').textContent;
  });

  // 친구 서재 방문 화면: 미니서재·독서 기록·내 책장·게시판
  let fr = null, ftab = 'room';
  const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  function visitBody() {
    const [name, title, pages, nb, days] = fr, cfg = ROOMS[name];
    const books = Array.from({ length: nb }, (_, i) => POOL[(hue(name) + i) % POOL.length]);
    const T = new Date(today() + 'T00:00:00');
    const day = k => { const d = new Date(T - k * 864e5); return `${d.getMonth() + 1}.${d.getDate()}`; };
    if (ftab === 'room') {
      return `<h2>미니서재 <small>${esc(title)}</small></h2><div class="roomwrap"><div class="room" role="img" aria-label="${esc(name)}의 서재 방">${window.ROOM.roomSvg('v-', { ...cfg, books: nb })}</div><div class="tip" id="vTip" hidden></div></div>
        <p class="cap">${cfg.ids.includes('shelf') ? `책장에 마우스를 올리면 ${esc(name)}이(가) 읽은 책이 보여요` : '아직 책장이 없어요'}</p>`;
    }
    if (ftab === 'log') {
      const rows = Array.from({ length: days }, (_, k) => {
        const end = Math.max(10, Math.round(pages * (1 - k * 0.12))), start = Math.max(1, end - 14 - k * 3);
        return `<tr><td>${day(k)}</td><td>${esc(books[k % books.length] || POOL[0])}</td><td>${start}~${end}쪽 (${end - start + 1}쪽)</td></tr>`;
      }).join('');
      return `<h2>독서 기록 <small>누적 ${pages}쪽 · 이번 주 ${days}일</small></h2><table class="logtbl"><thead><tr><th>날짜</th><th>책</th><th>읽은 쪽</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (ftab === 'shelf') {
      return `<h2>내 책장 <small>완독 ${nb}권</small></h2><div class="spines">${books.map((b, i) => `<div class="spine" style="--c:hsl(${hue(b)} 55% 55%);--h:${150 - (i % 3) * 14}px" title="${esc(b)}"><span>${esc(b)}</span></div>`).join('')}${Array.from({ length: Math.max(0, 6 - nb) }, () => '<div class="spine empty" style="--h:140px"></div>').join('')}</div>`;
    }
    return `<h2>게시판 <small>${esc(name)}이(가) 쓴 글</small></h2><div class="flist">${[['quote', '한 구절'], ['review', '한줄평']].map(([t, l]) => `<article class="post"><header><span class="tag ${t === 'quote' ? '' : 'b'}">${l}</span><time>${day(1)}</time></header><p class="ph">${PH}</p><small class="src">${esc(books[0] || POOL[0])}</small></article>`).join('')}</div>`;
  }
  function renderVisit() {
    $('vTitle').textContent = `${fr[0]}의 서재`;
    document.querySelectorAll('#vTabs [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === ftab));
    $('vBody').innerHTML = visitBody();
  }
  function openVisit(name) {
    fr = FRIENDS.find(f => f[0] === name); ftab = 'room';
    show('class'); $('v-class').hidden = true; $('v-visit').hidden = false;
    renderVisit(); scrollTo(0, 0);
  }
  $('vTabs').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { ftab = b.dataset.v; renderVisit(); } });
  $('vBack').addEventListener('click', () => show('class'));
  const vb = $('vBody');
  vb.addEventListener('mousemove', e => {
    const t = $('vTip'), h = e.target.closest && e.target.closest('.shelf-hit');
    if (!t || !h) return t && (t.hidden = true);
    const [name, , , nb] = fr, r = vb.querySelector('.roomwrap').getBoundingClientRect();
    t.innerHTML = `<b>${esc(name)}이(가) 읽은 책</b><ul>${Array.from({ length: nb }, (_, i) => `<li>${esc(POOL[(hue(name) + i) % POOL.length])}</li>`).join('')}</ul>`;
    t.hidden = false;
    t.style.left = `${Math.max(6, Math.min(r.width - t.offsetWidth - 6, e.clientX - r.left + 14))}px`;
    t.style.top = `${Math.max(6, Math.min(r.height - t.offsetHeight - 6, e.clientY - r.top + 10))}px`;
  });
  vb.addEventListener('mouseleave', () => { const t = $('vTip'); if (t) t.hidden = true; });

  function show(page) {
    $('v-visit').hidden = true;
    const cls = page === 'class', sub = page !== 'my';
    $('v-mission').hidden = page !== 'mission';
    $('v-feed').hidden = page !== 'feed';
    $('v-pick').hidden = page !== 'pick';
    document.querySelectorAll('.menu [data-page]').forEach(b => b.classList.toggle('on', b.dataset.page === page));
    document.querySelectorAll('.linkbtn').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('[data-page]').forEach(b => { b.classList.toggle('on', b.dataset.page === page); b.toggleAttribute('aria-current', b.dataset.page === page); });
    $('v-class').hidden = !cls;
    $('v-shop').hidden = page !== 'shop';
    document.querySelector('.panel .head').hidden = sub;
    document.querySelector('.tabs').hidden = sub;
    const view = document.querySelector('.tabs .on')?.dataset.view || 'home';
    ['home', 'log', 'shelf', 'board', 'titles'].forEach(n => ($('v-' + n).hidden = sub || n !== view));
    if (cls) render();
  }
  document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => show(b.dataset.page)));
  shelf();
})();
