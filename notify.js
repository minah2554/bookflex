// 알림(종 모양): 친구의 한마디, 미션 달성, 완독·칭호 소식. 숫자는 아직 안 읽은 알림 수.
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.notif.v1';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // go: 눌렀을 때 이동할 곳 — [메뉴 data-page, 오른쪽 탭 data-view]
  const BASE = [
    { id: 'n-talk1', d: '11.6', t: '책갈피탐험가님이 한마디를 남겼어요', s: '여우랑 길들이기 얘기하는 장면 나도 제일 좋았어…', go: ['my', 'home'] },
    { id: 'n-talk2', d: '11.4', t: '새벽세시님이 한마디를 남겼어요', s: '미니서재 창문 귀엽다 ㅋㅋ 노인과 바다 다음엔 뭐 읽어?', go: ['my', 'home'] },
    { id: 'n-done', d: '11.3', t: '노인과 바다 완독이 승인됐어요', s: '내 책장에 한 권이 꽂혔어요', go: ['my', 'shelf'] },
    { id: 'n-title', d: '11.2', t: '칭호 「문장 수집가」를 얻었어요', s: '칭호 탭에서 장착할 수 있어요', go: ['my', 'titles'] },
  ];
  let read = ['n-title']; // 시작 상태: 안 읽은 알림 3개
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) read = s; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(read)); } catch {} };

  function items() {
    let m = { p: [], c: [] };
    try { m = { ...m, ...JSON.parse(localStorage.getItem('bookflex.mission.v1')) }; } catch {}
    const md = ds => ds.map(x => x.slice(5).replace('-', '.'));
    const dyn = [
      ...m.p.map(x => ({ id: 'n-mp-' + x, k: x, d: md([x])[0], t: '개인 미션을 달성했어요', s: '+15 플렉스칩', go: ['mission'] })),
      ...m.c.map(x => ({ id: 'n-mc-' + x, k: x, d: md([x])[0], t: '우리 반 미션 전원 달성', s: '+30 플렉스칩', go: ['mission'] })),
    ].sort((a, b) => b.k.localeCompare(a.k));
    let ok = [];
    try { ok = (JSON.parse(localStorage.getItem('bookflex.log.v1')).entries || []).filter(e => e.kind === 'done' && e.cat).map(e => ({ id: 'n-ok-' + e.book, k: e.date, d: e.date.slice(5).replace('-', '.'), t: `「${e.book}」 완독이 승인됐어요`, s: `분야 ${e.cat} · +40 플렉스칩`, go: ['my', 'shelf'] })); } catch {}
    return [...ok, ...dyn, ...BASE];
  }

  function render() {
    const list = items(), n = list.filter(i => !read.includes(i.id)).length;
    const b = $('bellN');
    b.hidden = !n; b.textContent = n;
    $('bell').setAttribute('aria-label', n ? `알림 ${n}개 안 읽음` : '알림');
    $('notif').innerHTML = `<header><b>알림</b><button type="button" id="nAll" ${n ? '' : 'disabled'}>모두 읽음</button></header>
      <ul>${list.map(i => `<li><button type="button" class="${read.includes(i.id) ? '' : 'new'}" data-n="${i.id}"><span>${esc(i.t)}</span><small>${esc(i.s)}</small><time>${i.d}</time></button></li>`).join('')}</ul>`;
  }
  const setOpen = o => { $('notif').hidden = !o; $('bell').setAttribute('aria-expanded', o); };

  $('bell').addEventListener('click', e => { e.stopPropagation(); setOpen($('notif').hidden); });
  document.addEventListener('click', e => { if (!e.target.closest('.bellwrap')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  $('notif').addEventListener('click', e => {
    if (e.target.id === 'nAll') { read = items().map(i => i.id); save(); return render(); }
    const b = e.target.closest('[data-n]');
    if (!b) return;
    const it = items().find(i => i.id === b.dataset.n);
    if (!read.includes(it.id)) { read.push(it.id); save(); }
    setOpen(false); render();
    document.querySelector(`.menu [data-page=${it.go[0]}]`).click();
    if (it.go[1]) document.querySelector(`.tabs [data-view=${it.go[1]}]`).click();
  });
  document.addEventListener('bf:change', render);
  render();
})();
