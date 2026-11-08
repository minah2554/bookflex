// FLEX FEED: 학급 공개 한 구절·한줄평 피드, 댓글(10자 이상, 친구 글 하루 2개까지 +5칩, 내 글 제외)
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.feed.v1', CHIP = 5, DAILY = 2, MIN = 10, ME = '별빛책방';
  const PH = '[학생이 직접 쓴 글이 들어갈 자리]'; // 다른 학생의 글은 학급 서버가 생기기 전까지 빈자리
  // n: 샘플 댓글 수
  const SEED = [
    { id: 's1', who: ME, me: true, type: 'quote', text: '“정말 중요한 건 눈에 보이지 않아.”', book: '어린 왕자', writer: '생텍쥐페리', date: '2026-11-06', n: 4 },
    { id: 's2', who: '새벽세시', pages: 512, type: 'quote', text: PH, book: '노인과 바다', writer: '헤밍웨이', date: '2026-11-06', n: 2 },
    { id: 's3', who: '바다유리', pages: 276, type: 'quote', text: PH, book: '빨간 머리 앤', writer: '몽고메리', date: '2026-11-05', n: 6 },
    { id: 's4', who: '책갈피탐험가', pages: 340, type: 'review', text: PH, book: '어린 왕자', writer: '생텍쥐페리', date: '2026-11-04', n: 1 },
  ];
  let f = { reviews: [], c: {}, r: {}, v: {} }; // reviews 내 한줄평 / c 댓글 / r 보상받은 글 / v 유효 댓글 수
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.c) f = { ...f, ...s }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => window.BF.stats().today;

  let filter = 'all';
  const open = new Set();

  function when(d) {
    const t = new Date(today() + 'T00:00:00'), x = new Date(d + 'T00:00:00'), diff = Math.round((t - x) / 864e5);
    return diff === 0 ? '오늘' : diff === 1 ? '어제' : d.slice(5).replace('-', '.');
  }
  function posts() {
    const pages = window.BF.stats().pages;
    const mine = [
      ...window.BF.quotes().map(q => ({ id: q.id, who: ME, me: true, type: 'quote', text: `“${q.text}”`, book: q.book || '어린 왕자', writer: q.writer || '생텍쥐페리', date: q.date, n: 0, k: 1 })),
      ...f.reviews.map(r => ({ book: '어린 왕자', writer: '생텍쥐페리', ...r, me: true, who: ME, type: 'review', n: 0, k: 1 })),
    ];
    return [...mine, ...SEED].map(p => ({ ...p, who: p.me ? window.PROFILE.name : p.who, pages: p.me ? pages : p.pages }))
      .sort((a, b) => b.date.localeCompare(a.date) || (b.k || 0) - (a.k || 0));
  }

  function render() {
    const d = today();
    $('fdGot').textContent = (f.r[d] || []).length;
    document.querySelectorAll('#fdFilters button').forEach(b => b.classList.toggle('on', b.dataset.f === filter));
    const list = posts().filter(p => filter === 'all' || p.type === filter);
    $('fdList').innerHTML = list.map(p => {
      const cs = f.c[p.id] || [], isOpen = true; // 댓글칸은 항상 펼쳐 둔다
      return `<article class="post${p.me ? ' mine' : ''}" data-id="${p.id}">
        <header><span class="av sm">${p.who[0]}</span><b>${esc(p.who)}</b><small>누적 ${p.pages}쪽</small>
          <span class="tag ${p.type === 'quote' ? '' : 'b'}">${p.type === 'quote' ? '한 구절' : '한줄평'}</span><time>${when(p.date)}</time></header>
        <p class="${p.text === PH ? 'ph' : 'ptxt'}">${esc(p.text)}</p>
        <small class="src">${esc(p.book)} · ${esc(p.writer)}</small>
        <span class="cbtn">댓글 ${p.n + cs.length}</span>
        ${isOpen ? `<div class="cm">${cs.map(c => `<p><b>${esc(window.PROFILE.name)}</b> ${esc(c.text)}<time>${when(c.date)}</time></p>`).join('')}
          ${p.me ? '<small class="note">내 글에는 친구들이 댓글을 달아요.</small>'
            : `<form class="say" data-form="${p.id}" novalidate><input maxlength="100" placeholder="${esc(p.who)}님 글에 댓글 쓰기 (10자 이상 · +5칩)" aria-label="댓글"><button class="cta mini" type="submit">댓글 달기</button></form><small class="msg"></small>`}</div>` : ''}
      </article>`;
    }).join('') || '<p class="note">아직 글이 없어요.</p>';
  }

  $('fdFilters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } });
  $('fdList').addEventListener('click', e => {
    const b = e.target.closest('[data-toggle]');
    if (!b) return;
    open.has(b.dataset.toggle) ? open.delete(b.dataset.toggle) : open.add(b.dataset.toggle);
    render();
  });
  // 댓글 하나 달기(피드와 친구 게시판이 같이 씀): 10자 이상, 서로 다른 글 하루 2개까지 +5칩
  function addComment(id, raw) {
    const text = raw.trim(), d = today();
    if (text.length < MIN) return { err: `${MIN}자 이상 적어 주세요.` };
    (f.c[id] = f.c[id] || []).push({ text, date: d });
    f.v[d] = (f.v[d] || 0) + 1;
    const got = f.r[d] = f.r[d] || [];
    const reward = got.length < DAILY && !got.includes(id);
    if (reward) { got.push(id); window.BF.addChips(CHIP); }
    save();
    return { reward };
  }
  $('fdList').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target, id = form.dataset.form, input = form.querySelector('input'), msg = form.nextElementSibling;
    const res = addComment(id, input.value);
    if (res.err) { msg.className = 'msg'; msg.textContent = res.err; return; }
    const reward = res.reward;
    render();
    const m = document.querySelector(`[data-id="${id}"] .cm .msg`);
    if (m) { m.className = 'msg okm'; m.textContent = reward ? `댓글 완료! +${CHIP} 플렉스칩` : '댓글을 남겼어요. 오늘 칩은 서로 다른 글 2개까지만 받아요.'; }
    document.dispatchEvent(new Event('bf:change'));
  });

  $('fdForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('fdText').value.trim(), msg = $('fdMsg');
    if (!text) { msg.className = 'msg'; msg.textContent = '한줄평을 적어 주세요.'; return; }
    f.reviews.push({ id: 'r' + Date.now(), text, date: today(), book: window.BF.stats().book, writer: window.BF.stats().writer });
    save(); $('fdText').value = ''; filter = 'all'; render();
    msg.className = 'msg okm'; msg.textContent = '한줄평을 올렸어요. 우리 반에 공개됩니다.';
  });

  // 내 게시판(tabs.js)이 쓰는 창구: 내가 쓴 글과 댓글 수
  window.FEED = { when, comments: id => (f.c[id] || []).map(c => ({ ...c })), comment: addComment, CHIP, mine: () => posts().filter(p => p.me).map(p => ({ ...p, count: p.n + (f.c[p.id] || []).length })) };

  document.querySelector('[data-page=feed]').addEventListener('click', () => { $('fdMsg').textContent = ''; $('fdBook').textContent = window.BF.stats().book; render(); });
  document.querySelectorAll('.linkbtn[data-page=feed]').forEach(b => b.addEventListener('click', render));
})();
