// 가구 배치: 방에서 가구를 끌어 옮기고, 좌우 뒤집기 단추로 방향을 바꾼다. 내 방 꾸미기와 상점 미리보기가 같은 도구를 쓴다.
// 위치·각도는 가구마다 {x, y, r, f}(기본 자리에서 얼마나 옮겼는지)로 저장된다(app.js의 state.pos).
(() => {
  const $ = id => document.getElementById(id);
  const R = window.ROOM, STEP = 6, ROT = 45, LIM = 300;
  const clamp = v => Math.max(-LIM, Math.min(LIM, v));
  let homeSel = '';

  // 두 곳의 차이만 여기에: 내 방은 가구를 골라 쓰고, 상점은 지금 놓아 보는 물건 하나만 다룬다
  const home = {
    box: $('room'), bar: $('placeBar'),
    active: () => !$('ctrl').hidden,
    ids: () => R.shown().map(x => x[0]),
    id: () => homeSel,
    pick(id) { homeSel = id; const s = $('placeSel'); if (s) s.value = id; },
    get: id => R.pos(id), set: (id, p) => R.setPos(id, p),
  };
  const shop = {
    box: $('shopRoom'), bar: $('shopPlace'),
    active: () => !$('v-shop').hidden && !!R.shopSel,
    ids: () => (R.shopSel ? [R.shopSel] : []),
    id: () => R.shopSel,
    pick() {},
    // 산 물건은 바로 저장, 아직 안 산 물건은 임시 자리(사면 그 자리에 놓인다)
    get: id => ({ x: 0, y: 0, r: 0, f: 0, ...(R.own(id) ? R.pos(id) : R.draft[id]) }),
    set(id, p) { if (R.own(id)) R.setPos(id, p); else if (p) R.draft[id] = p; else delete R.draft[id]; R.shopRender(); },
  };

  const mark = c => {
    const on = c.active();
    c.box.classList.toggle('editing', on);
    c.box.querySelectorAll('.itm').forEach(g => g.classList.toggle('sel', on && g.dataset.id === c.id()));
  };

  function buildBar(c) {
    const acts = [
      ['◀', '왼쪽으로', p => ({ ...p, x: clamp(p.x - STEP) })], ['▲', '위로', p => ({ ...p, y: clamp(p.y - STEP) })],
      ['▼', '아래로', p => ({ ...p, y: clamp(p.y + STEP) })], ['▶', '오른쪽으로', p => ({ ...p, x: clamp(p.x + STEP) })],
      ['좌우 뒤집기', '좌우 뒤집기(누를 때마다 번갈아)', p => ({ ...p, r: 0, f: p.f ? 0 : 1 })],
      ['제자리로', '기본 자리로 되돌리기', () => null],
    ];
    c.bar.innerHTML = acts.map(([t, l], i) => `<button type="button" data-a="${i}" aria-label="${l}">${t}</button>`).join('');
    c.bar.onclick = e => {
      const b = e.target.closest('[data-a]'), id = c.id();
      if (!b || !id) return;
      c.set(id, acts[+b.dataset.a][2](c.get(id)));
    };
  }

  // 내 방: 가구 고르는 칸(방에서 가구를 눌러도 바뀜). 샀거나 켠 가구만 나온다
  function syncHome() {
    const list = R.shown(), sel = $('placeSel');
    if (!list.some(x => x[0] === homeSel)) homeSel = list.length ? list[0][0] : '';
    sel.innerHTML = list.map(([id, l]) => `<option value="${id}">${l}</option>`).join('');
    sel.value = homeSel;
    mark(home);
  }
  $('placeSel').onchange = e => { homeSel = e.target.value; mark(home); };

  function drag(c) {
    c.box.addEventListener('pointerdown', e => {
      const g = e.target.closest && e.target.closest('.itm');
      if (!c.active() || !g || !c.ids().includes(g.dataset.id) || e.button) return;
      const id = g.dataset.id, svg = c.box.querySelector('svg'), inv = svg.getScreenCTM().inverse();
      const at = (x, y) => { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(inv); };
      const s0 = at(e.clientX, e.clientY), p0 = c.get(id);
      let np = p0, moved = false;
      c.pick(id); mark(c); e.preventDefault();
      g.setPointerCapture(e.pointerId);
      const move = ev => {
        const s = at(ev.clientX, ev.clientY);
        np = { ...p0, x: clamp(Math.round(p0.x + s.x - s0.x)), y: clamp(Math.round(p0.y + s.y - s0.y)) };
        moved = true; g.setAttribute('style', R.xfStyle(np));
      };
      const up = () => {
        g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
        if (moved) c.set(id, np);
      };
      g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
  }

  [home, shop].forEach(c => {
    buildBar(c); drag(c);
    // 방 그림이 다시 그려질 때마다 선택 표시를 다시 입힌다
    new MutationObserver(() => (c === home ? syncHome() : mark(c))).observe(c.box, { childList: true });
  });
  new MutationObserver(() => mark(home)).observe($('ctrl'), { attributes: true, attributeFilter: ['hidden'] });
  syncHome(); mark(shop);
})();
