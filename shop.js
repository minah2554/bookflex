// FLEX SHOP: 사기 전에 내 방에 놓아 보기, 칩 차감 구매, 누적 독서로 단계 해금(PRD 11B)
(() => {
  const $ = id => document.getElementById(id);
  const BOOKS_DONE = 2; // 교사 승인 기능이 생기기 전까지는 목업 값
  // need: 누적 쪽 또는 완독/기록일 중 하나만 충족해도 해금
  const STAGES = [
    { n: 1, name: '작은 소품' },
    { n: 2, name: '책상 주변', need: { pages: 100, days: 3 } },
    { n: 3, name: '벽·바닥', need: { pages: 250, books: 1 } },
    { n: 4, name: '가구', need: { pages: 500, books: 2 } },
    { n: 5, name: '공간 연출', need: { pages: 1000, books: 3 } },
    { n: 6, name: '특별 테마', need: { books: 5 } },
  ];
  // soon: 아직 방에 그려지지 않는 물건(구매 불가)
  const I = (stage, id, name, price, sw, extra = {}) => ({ stage, id, name, price, sw, ...extra });
  const CATALOG = [
    I(1, 'plant', '화분', 50, '#55b573'), I(1, 'rug', '러그', 60, '#e98ba0'), I(1, 'poster', '포스터', 50, '#ffe7a8'),
    I(1, 'bmark', '책갈피', 20, '#e0556f'), I(1, 'mug', '머그컵', 30, '#fff'), I(1, 'frame', '미니 액자', 40, '#f6c6d4'), I(1, 'clock', '탁상시계', 60, '#6aa7e8'),
    I(2, 'desk', '책상', 150, '#c28622'), I(2, 'window', '창문', 120, '#9fd6f2'),
    I(2, 'lamp', '독서등', 90, '#ffe27a'), I(2, 'books', '책더미', 70, '#5b86e5'),
    I(2, 'sunset', '노을 포스터', 100, '#f7a65a'), I(2, 'roundrug', '동그란 러그', 130, '#f3c76b'),
    I(3, 'wall-blue', '하늘 벽지', 150, '#c3d9f0', { wall: 'blue' }), I(3, 'wall-wood', '우드 벽지', 200, '#c9935a', { wall: 'wood' }),
    I(3, 'floor-tile', '타일 바닥', 180, '#cfd8e3', { floor: 'tile' }), I(3, 'floor-carpet', '카펫 바닥', 250, '#f4d6d6', { floor: 'carpet' }),
    I(4, 'chair', '의자', 260, '#e8b87a'), I(4, 'sofa', '소파', 320, '#7aa6e0'), I(4, 'bigrug', '대형 러그', 450, '#2f7d8a'),
    I(5, 'x1', '벽난로', 640, '#b5651d', { soon: 1 }), I(5, 'x2', '천장까지 큰 책장', 560, '#8a5a36', { soon: 1 }), I(5, 'x3', '밤하늘 통창', 720, '#2b3a67', { soon: 1 }),
    I(6, 'x4', '별빛 서재', 900, '#2b3a67', { soon: 1 }), I(6, 'x5', '비밀 도서관', 1200, '#6e4527', { soon: 1 }),
    I(6, 'x6', '숲속 서재', 1000, '#4f9d69', { soon: 1 }), I(6, 'x7', '레트로 미니홈피', 1500, '#8190dc', { soon: 1 }),
  ];
  const byId = id => CATALOG.find(c => c.id === id);
  const unlocked = (s, st) => !s.need || (s.need.pages && st.pages >= s.need.pages) || (s.need.books && BOOKS_DONE >= s.need.books) || (s.need.days && st.days >= s.need.days);

  let stage = 2, sel = 'lamp';

  function render() {
    const st = window.BF.stats(), chips = st.chips;
    $('sChips').textContent = chips;
    const cur = STAGES[stage - 1], open = unlocked(cur, st);
    $('stageTabs').innerHTML = STAGES.map(s => `<button type="button" role="tab" class="${s.n === stage ? 'on' : ''}" data-stage="${s.n}" aria-selected="${s.n === stage}">${s.n} ${s.name}${unlocked(s, st) ? '' : '<span class="lk">잠김</span>'}</button>`).join('');

    $('shopCards').innerHTML = CATALOG.filter(c => c.stage === stage).map(c => {
      const has = window.ROOM.own(c.id) && !c.soon;
      const state = c.soon ? '준비 중' : has ? '가지고 있음' : !open ? '잠겨 있어요' : c.id === sel ? '놓아 보는 중' : chips >= c.price ? '살 수 있어요' : `${c.price - chips}칩 더 모으면`;
      return `<button type="button" class="scard${c.id === sel ? ' sel' : ''}${has ? ' has' : ''}" data-id="${c.id}" ${c.soon || !open ? 'disabled' : ''}>
        ${c.soon ? `<i style="--c:${c.sw}"></i>` : `<img class="th" src="assets/items/${window.ROOM.spriteKey(c.id)}.webp" alt="">`}<b>${c.name}</b><span class="price">${c.price}칩</span><small>${state}</small></button>`;
    }).join('');

    const next = STAGES.find(s => !unlocked(s, st));
    $('unlockBox').innerHTML = next
      ? `<b>${next.need.books ? `완독 ${Math.max(1, next.need.books - BOOKS_DONE)}권만 더 끝내면` : '조금만 더 읽으면'} ${next.n}단계가 열려요</b>
         <small>조건: ${[next.need.pages && `누적 ${next.need.pages}쪽(지금 ${st.pages}쪽)`, next.need.books && `선생님 승인 완독 ${next.need.books}권(지금 ${BOOKS_DONE}권)`, next.need.days && `기록 ${next.need.days}일(지금 ${st.days}일)`].filter(Boolean).join(' 또는 ')}</small>
         <small>${st.book} ${st.total - st.reached}쪽 남음</small>`
      : '<b>모든 단계가 열렸어요</b>';

    // 미리보기
    const c = byId(sel), canBuy = c && !c.soon && open && !window.ROOM.own(c.id);
    const over = { noAvatar: true, pos: window.ROOM.draft, ...(c ? (c.wall ? { wall: c.wall } : c.floor ? { floor: c.floor } : { add: c.id }) : {}) };
    window.ROOM.shopSel = c && !c.soon && !c.wall && !c.floor ? c.id : ''; // 끌어서 놓아 볼 수 있는 물건
    $('shopRoom').innerHTML = window.ROOM.roomSvg('s-', over);
    $('shopPlace').parentElement.hidden = !window.ROOM.shopSel;
    $('pName').textContent = c ? `놓아 보는 중 · ${c.name}` : '';
    $('pAfter').textContent = c ? (chips >= c.price ? `${chips} → ${chips - c.price} 칩` : `${c.price - chips}칩이 더 필요해요`) : '';
    // 디자인 고르기(4종이 있는 물건만)
    const vr = $('vRow'), hv = c && window.ROOM.HAS_VAR.includes(c.id);
    vr.hidden = !hv;
    vr.innerHTML = hv ? '<small>디자인</small>' + Array.from({ length: window.ROOM.varCount(c.id) }, (_, i) => i + 1).map(n => `<button type="button" data-v="${n}" aria-pressed="${window.ROOM.variant(c.id) === n}" aria-label="디자인 ${n}"><img src="assets/items/${c.id}-${n}.webp" alt=""></button>`).join('') : '';
    const btn = $('buyBtn');
    btn.disabled = !canBuy || chips < c.price;
    btn.textContent = !c ? '' : window.ROOM.own(c.id) ? '이미 가지고 있어요' : `${c.name} 사기 · ${c.price}칩`;
  }

  $('stageTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-stage]');
    if (!b) return;
    stage = +b.dataset.stage;
    const first = CATALOG.find(c => c.stage === stage && !c.soon);
    sel = first ? first.id : '';
    $('sMsg').textContent = '';
    render();
  });
  $('shopCards').addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    sel = b.dataset.id; $('sMsg').textContent = ''; render();
  });
  $('vRow').addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) { window.ROOM.setVariant(sel, +b.dataset.v); render(); }
  });
  $('buyBtn').addEventListener('click', () => {
    const c = byId(sel), st = window.BF.stats();
    if (!c || c.soon || window.ROOM.own(c.id) || st.chips < c.price || !unlocked(STAGES[c.stage - 1], st)) return;
    window.BF.addChips(-c.price);
    const draft = window.ROOM.draft[c.id];
    window.ROOM.buy(c.id);
    if (draft) { window.ROOM.setPos(c.id, draft); delete window.ROOM.draft[c.id]; } // 놓아 본 자리 그대로 내 방에
    $('sMsg').className = 'msg okm';
    $('sMsg').textContent = `FLEX SHOP — ${c.name}을(를) 내 방에 놓았어요! −${c.price} 플렉스칩`;
    render();
  });
  window.ROOM.shopRender = render;
  document.querySelector('[data-page=shop]').addEventListener('click', render);
})();
