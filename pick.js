// BOOK PICK: 밸런스 질문 3개 -> 태그 일치 점수로 교사 검토용 정적 목록에서 1~3권 추천 (PRD 4.3, 11E)
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.pick.v1';
  // 질문마다 [왼쪽 선택, 오른쪽 선택]. tag 는 책의 tags 와 맞춰 점수를 매긴다.
  const QS = [
    { q: '어떤 이야기가 더 끌려요?', a: [{ tag: 'society', t: '세상을 바꾸는 이야기가 좋다' }, { tag: 'reflect', t: '나 자신을 돌아보는 이야기가 좋다' }] },
    { q: '어떤 고민에 더 마음이 가요?', a: [{ tag: 'real', t: '현실의 고민이 좋다' }, { tag: 'imagine', t: '상상 속 세계가 좋다' }] },
    { q: '어떤 글이 더 편해요?', a: [{ tag: 'short', t: '짧고 생각할 거리가 많은 글이 좋다' }, { tag: 'long', t: '긴 서사에 몰입하고 싶다' }] },
  ];
  // 소개 문구는 직접 작성, 난이도는 앱 기획용 분류(교보문고 순위 아님). 판본마다 쪽수가 달라 분량은 적지 않는다.
  const BOOKS = [
    { t: '어린 왕자', w: '앙투안 드 생텍쥐페리', lv: '쉬움 · 중·고 공통', kw: '관계·책임·성찰', tags: ['reflect', 'imagine', 'short'], d: '작은 별에서 온 왕자를 만나며 관계와 책임을 생각해 보는 짧은 우화예요.', url: 'https://product.kyobobook.co.kr/detail/S000001637510' },
    { t: '데미안', w: '헤르만 헤세', lv: '조금 어려움 · 고등 중심, 중학생 심화', kw: '정체성·성장·선택', tags: ['reflect', 'real', 'long'], d: '나는 어떤 사람이 되고 싶은지 스스로 묻게 만드는 성장 이야기예요.', url: 'https://product.kyobobook.co.kr/detail/S000217035583' },
    { t: '동물농장', w: '조지 오웰', lv: '보통 · 중3~고등', kw: '권력·평등·비판', tags: ['society', 'imagine', 'short'], d: '농장 동물들의 혁명을 따라가며 권력과 평등을 비판적으로 읽어 보는 우화예요.' },
    { t: '노인과 바다', w: '어니스트 헤밍웨이', lv: '보통 · 중·고 공통', kw: '도전·인내·존엄', tags: ['reflect', 'real', 'long'], d: '바다에서 끝까지 버티는 노인을 따라가며 도전과 존엄을 느껴 보는 이야기예요.' },
    { t: '변신', w: '프란츠 카프카', lv: '어려움 · 고등 중심', kw: '소외·가족·정체성', tags: ['society', 'real', 'short'], d: '어느 날 벌레가 된 청년과 가족을 통해 소외를 생각하게 하는 짧은 소설이에요.' },
    { t: '1984', w: '조지 오웰', lv: '어려움 · 고등 중심', kw: '자유·감시·언어', tags: ['society', 'imagine', 'long'], d: '감시받는 사회에서 자유와 말의 힘을 묻는 길고 묵직한 이야기예요.' },
    { t: '아큐정전', w: '루쉰', lv: '어려움 · 고등 중심', kw: '사회·자기인식·풍자', tags: ['society', 'real', 'short'], d: '풍자로 사회와 나 자신을 돌아보게 하는 짧은 소설이에요.' },
    { t: '빨간 머리 앤', w: '루시 모드 몽고메리', lv: '쉬움 · 중·고 공통', kw: '상상력·성장·관계', tags: ['reflect', 'imagine', 'long'], d: '상상력 넘치는 앤이 사람들과 어울리며 자라 가는 이야기예요.' },
  ];

  function rank(picks) {
    return BOOKS.map((b, i) => ({ b, i, s: picks.filter(t => b.tags.includes(t)).length }))
      .sort((x, y) => y.s - x.s || x.i - y.i).slice(0, 3);
  }
  // 자체 점검: 추천은 늘 1~3권이고, '사회·현실·짧음'을 고르면 변신/아큐정전이 먼저 나온다
  console.assert(rank(['society', 'real', 'short']).length === 3 && ['변신', '아큐정전'].includes(rank(['society', 'real', 'short'])[0].b.t), 'BOOK PICK 점수 규칙 오류');

  let saved = [];
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) saved = s; } catch {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} };

  let step = 0, picks = [], regFor = '', regMsg = '';
  const label = tag => QS.flatMap(q => q.a).find(a => a.tag === tag).t;

  function render() {
    const box = $('pickBox');
    if (step < QS.length) {
      const q = QS[step];
      box.innerHTML = `<p class="pstep">질문 ${step + 1} / ${QS.length}</p><h2 class="pq">${q.q}</h2>
        <div class="pchoices">${q.a.map(a => `<button type="button" class="pchoice" data-tag="${a.tag}">${a.t}</button>`).join('')}</div>`;
      return;
    }
    const res = rank(picks), mine = window.BF.library();
    box.innerHTML = `<h2 class="pq">이런 책은 어때요?</h2><p class="pstep">내가 고른 것: ${picks.map(label).join(' · ')}</p>
      <div class="pres">${res.map(({ b, s }) => {
        const why = picks.filter(t => b.tags.includes(t)).map(label);
        return `<article class="pbook"><b>${b.t}</b><small>${b.w}</small><span class="badge">${b.kw}</span>
          <p>${b.d}</p><p class="why">${why.length ? `‘${why.join('’, ‘')}’를 골라서 추천해요.` : '새로운 분야를 만나 보기 좋아요.'}</p>
          <small class="lv">난이도 · ${b.lv}</small>
          <div class="pact"><button type="button" class="cta mini${saved.includes(b.t) ? ' done' : ''}" data-save="${b.t}">${saved.includes(b.t) ? '담았어요 ✓' : '내 서재에 담기'}</button>
          <button type="button" class="cta mini${mine.includes(b.t) ? ' done' : ''}" data-reg="${b.t}">${mine.includes(b.t) ? '읽는 책에 등록됨' : '이 책 읽기 시작'}</button>
          ${b.url ? `<a class="link" href="${b.url}" target="_blank" rel="noopener">교보문고 상세 ›</a>` : ''}</div>
          ${regFor === b.t ? `<div class="regrow"><label>내 책의 전체 쪽수<input type="number" id="pickN" min="10" max="3000" inputmode="numeric" placeholder="예: 200"></label><button type="button" class="cta mini" data-regok="${b.t}">등록하고 시작</button></div>` : ''}
          ${regFor === b.t && regMsg ? `<p class="msg" role="alert">${regMsg}</p>` : ''}</article>`;
      }).join('')}</div>
      <div class="pfoot"><button type="button" class="cta" data-again="1">다시 해 보기</button>
      <small class="note">${saved.length ? `담은 책: ${saved.join(', ')}` : '마음에 드는 책은 ‘내 서재에 담기’로 모아 보세요.'}</small></div>`;
  }

  $('pickBox').addEventListener('click', e => {
    const a = e.target.closest('[data-tag]'), s = e.target.closest('[data-save]');
    if (a) { picks.push(a.dataset.tag); step++; render(); }
    else if (s) { const t = s.dataset.save; saved = saved.includes(t) ? saved.filter(x => x !== t) : [...saved, t]; persist(); render(); }
    else if (e.target.closest('[data-reg]')) {
      const t = e.target.closest('[data-reg]').dataset.reg;
      if (window.BF.library().includes(t)) { window.BF.addBook(t, '', 10); regFor = ''; render(); return goLog(); }
      regFor = regFor === t ? '' : t; regMsg = ''; render();
      const n = $('pickN'); if (n) n.focus();
    } else if (e.target.closest('[data-regok]')) {
      const t = e.target.closest('[data-regok]').dataset.regok, b = BOOKS.find(x => x.t === t);
      const r = window.BF.addBook(b.t, b.w, $('pickN').value);
      if (r.err) { regMsg = r.err; return render(); }
      regFor = ''; regMsg = ''; render(); goLog();
    }
    else if (e.target.closest('[data-again]')) { step = 0; picks = []; render(); }
  });
  // 등록하면 독서 기록 화면(쪽수 입력)으로 이동
  const goLog = () => { document.querySelector('.menu [data-page=my]').click(); document.querySelector('.tabs [data-view=log]').click(); };
  document.querySelectorAll('[data-page=pick]').forEach(b => b.addEventListener('click', () => { step = 0; picks = []; render(); }));
})();
