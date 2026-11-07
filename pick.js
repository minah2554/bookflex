// BOOK PICK: 밸런스 질문 5개 -> 태그 일치 점수로 교사 검토용 정적 목록에서 1~3권 추천 (PRD 4.3, 11E)
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bookflex.pick.v1';
  // 질문마다 [왼쪽 선택, 오른쪽 선택]. tag 는 책의 tags 와 맞춰 점수를 매긴다(책마다 질문 5개의 태그를 하나씩 가진다).
  const QS = [
    { q: '어떤 이야기가 더 끌려요?', a: [{ tag: 'society', t: '세상을 바꾸는 이야기가 좋다' }, { tag: 'reflect', t: '나 자신을 돌아보는 이야기가 좋다' }] },
    { q: '어떤 고민에 더 마음이 가요?', a: [{ tag: 'real', t: '현실의 고민이 좋다' }, { tag: 'imagine', t: '상상 속 세계가 좋다' }] },
    { q: '어떤 글이 더 편해요?', a: [{ tag: 'short', t: '짧고 생각할 거리가 많은 글이 좋다' }, { tag: 'long', t: '긴 서사에 몰입하고 싶다' }] },
    { q: '읽고 나서 어떤 기분이면 좋겠어요?', a: [{ tag: 'warm', t: '마음이 따뜻해지면 좋겠다' }, { tag: 'dark', t: '묵직하게 생각이 남으면 좋겠다' }] },
    { q: '이야기가 어떻게 흘러가면 좋아요?', a: [{ tag: 'fast', t: '사건이 빠르게 이어지면 좋겠다' }, { tag: 'deep', t: '천천히 곱씹으며 읽고 싶다' }] },
  ];
  // 소개 문구는 직접 작성, 난이도는 앱 기획용 분류(교보문고 순위 아님). 판본마다 쪽수가 달라 분량은 적지 않는다.
  // tags 순서: [사회/성찰, 현실/상상, 짧음/긴 호흡, 따뜻함/묵직함, 빠름/느림]
  const BOOKS = [
    { t: '어린 왕자', w: '앙투안 드 생텍쥐페리', lv: '쉬움 · 중·고 공통', kw: '관계·책임·성찰', tags: ['reflect', 'imagine', 'short', 'warm', 'deep'], d: '작은 별에서 온 왕자를 만나며 관계와 책임을 생각해 보는 짧은 우화예요.', url: 'https://product.kyobobook.co.kr/detail/S000001637510' },
    { t: '데미안', w: '헤르만 헤세', lv: '조금 어려움 · 고등 중심, 중학생 심화', kw: '정체성·성장·선택', tags: ['reflect', 'real', 'long', 'dark', 'deep'], d: '나는 어떤 사람이 되고 싶은지 스스로 묻게 만드는 성장 이야기예요.', url: 'https://product.kyobobook.co.kr/detail/S000217035583' },
    { t: '동물농장', w: '조지 오웰', lv: '보통 · 중3~고등', kw: '권력·평등·비판', tags: ['society', 'imagine', 'short', 'dark', 'fast'], d: '농장 동물들의 혁명을 따라가며 권력과 평등을 비판적으로 읽어 보는 우화예요.' },
    { t: '노인과 바다', w: '어니스트 헤밍웨이', lv: '보통 · 중·고 공통', kw: '도전·인내·존엄', tags: ['reflect', 'real', 'long', 'warm', 'deep'], d: '바다에서 끝까지 버티는 노인을 따라가며 도전과 존엄을 느껴 보는 이야기예요.' },
    { t: '변신', w: '프란츠 카프카', lv: '어려움 · 고등 중심', kw: '소외·가족·정체성', tags: ['society', 'real', 'short', 'dark', 'deep'], d: '어느 날 벌레가 된 청년과 가족을 통해 소외를 생각하게 하는 짧은 소설이에요.' },
    { t: '1984', w: '조지 오웰', lv: '어려움 · 고등 중심', kw: '자유·감시·언어', tags: ['society', 'imagine', 'long', 'dark', 'deep'], d: '감시받는 사회에서 자유와 말의 힘을 묻는 길고 묵직한 이야기예요.' },
    { t: '아큐정전', w: '루쉰', lv: '어려움 · 고등 중심', kw: '사회·자기인식·풍자', tags: ['society', 'real', 'short', 'dark', 'fast'], d: '풍자로 사회와 나 자신을 돌아보게 하는 짧은 소설이에요.' },
    { t: '빨간 머리 앤', w: '루시 모드 몽고메리', lv: '쉬움 · 중·고 공통', kw: '상상력·성장·관계', tags: ['reflect', 'imagine', 'long', 'warm', 'fast'], d: '상상력 넘치는 앤이 사람들과 어울리며 자라 가는 이야기예요.' },
    { t: '소나기', w: '황순원', lv: '쉬움 · 중학생 중심', kw: '첫사랑·추억·이별', tags: ['reflect', 'real', 'short', 'warm', 'deep'], d: '시골 소년과 소녀의 짧은 만남이 오래 마음에 남는 단편이에요.' },
    { t: '메밀꽃 필 무렵', w: '이효석', lv: '보통 · 중3~고등', kw: '인연·길·정서', tags: ['reflect', 'real', 'short', 'warm', 'deep'], d: '장터를 떠도는 장돌뱅이의 하룻밤 이야기로 인연과 그리움을 느끼는 단편이에요.' },
    { t: '운수 좋은 날', w: '현진건', lv: '보통 · 중3~고등', kw: '가난·가족·아이러니', tags: ['society', 'real', 'short', 'dark', 'fast'], d: '인력거꾼의 하루를 따라가며 가난과 가족의 무게를 생각하게 하는 단편이에요.' },
    { t: '홍길동전', w: '허균', lv: '쉬움 · 중학생 중심', kw: '신분·정의·모험', tags: ['society', 'imagine', 'short', 'warm', 'fast'], d: '신분 차별에 맞서는 길동의 모험으로 정의를 생각해 보는 고전 소설이에요.' },
    { t: '우리들의 일그러진 영웅', w: '이문열', lv: '보통 · 중3~고등', kw: '권력·교실·방관', tags: ['society', 'real', 'short', 'dark', 'fast'], d: '교실 안에서 생기는 힘의 질서와 우리의 방관을 돌아보게 하는 소설이에요.' },
    { t: '완득이', w: '김려령', lv: '쉬움 · 중·고 공통', kw: '가족·편견·성장', tags: ['society', 'real', 'long', 'warm', 'fast'], d: '고등학생 완득이가 주변 사람들과 부딪히며 자라는 유쾌하고 따뜻한 성장 소설이에요.' },
    { t: '두근두근 내 인생', w: '김애란', lv: '보통 · 중3~고등', kw: '가족·시간·사랑', tags: ['reflect', 'real', 'long', 'warm', 'deep'], d: '또래보다 빨리 자라는 소년과 어린 부모의 시간을 따라가는 이야기예요.' },
    { t: '난장이가 쏘아올린 작은 공', w: '조세희', lv: '어려움 · 고등 중심', kw: '노동·불평등·도시', tags: ['society', 'real', 'long', 'dark', 'deep'], d: '개발 시대 도시 변두리 사람들의 삶으로 불평등을 묻는 연작 소설이에요.' },
    { t: '모모', w: '미하엘 엔데', lv: '쉬움 · 중·고 공통', kw: '시간·경청·여유', tags: ['reflect', 'imagine', 'long', 'warm', 'deep'], d: '시간을 훔치는 회색 신사들에 맞서는 소녀를 통해 시간의 의미를 생각해 보는 판타지예요.' },
    { t: '이상한 나라의 앨리스', w: '루이스 캐럴', lv: '쉬움 · 중학생 중심', kw: '상상력·말놀이·모험', tags: ['reflect', 'imagine', 'short', 'warm', 'fast'], d: '토끼굴로 떨어진 앨리스가 엉뚱한 세계를 헤매는 말놀이 가득한 모험이에요.' },
    { t: '갈매기의 꿈', w: '리처드 바크', lv: '쉬움 · 중·고 공통', kw: '도전·자유·꿈', tags: ['reflect', 'imagine', 'short', 'warm', 'fast'], d: '더 높이, 더 빨리 날고 싶은 갈매기를 따라가며 꿈과 도전을 생각해 보는 짧은 우화예요.' },
    { t: '연금술사', w: '파울로 코엘료', lv: '쉬움 · 중·고 공통', kw: '꿈·여정·용기', tags: ['reflect', 'imagine', 'long', 'warm', 'fast'], d: '양치기 소년이 보물을 찾아 떠나는 여정으로 나의 꿈을 돌아보게 해요.' },
    { t: '앵무새 죽이기', w: '하퍼 리', lv: '보통 · 중3~고등', kw: '편견·정의·용기', tags: ['society', 'real', 'long', 'warm', 'deep'], d: '어린 소녀의 눈으로 편견과 정의를 바라보는 따뜻하면서도 묵직한 성장 소설이에요.' },
    { t: '호밀밭의 파수꾼', w: 'J.D. 샐린저', lv: '조금 어려움 · 고등 중심', kw: '방황·진심·성장', tags: ['reflect', 'real', 'long', 'dark', 'fast'], d: '학교를 떠난 소년의 사흘을 따라가며 어른이 되는 불안을 느껴 보는 이야기예요.' },
    { t: '멋진 신세계', w: '올더스 헉슬리', lv: '어려움 · 고등 중심', kw: '행복·통제·기술', tags: ['society', 'imagine', 'long', 'dark', 'deep'], d: '모두가 행복한 것처럼 보이는 미래 사회가 정말 좋은지 묻는 이야기예요.' },
    { t: '프랑켄슈타인', w: '메리 셸리', lv: '어려움 · 고등 중심', kw: '책임·창조·외로움', tags: ['reflect', 'imagine', 'long', 'dark', 'fast'], d: '생명을 만든 과학자와 외로운 피조물을 통해 책임을 생각하게 하는 고전이에요.' },
    { t: '위대한 개츠비', w: 'F. 스콧 피츠제럴드', lv: '어려움 · 고등 중심', kw: '욕망·계층·꿈', tags: ['society', 'real', 'long', 'dark', 'deep'], d: '화려한 파티 뒤에 숨은 한 남자의 꿈과 허무를 따라가는 소설이에요.' },
  ];

  // 일치한 태그 수가 기본 점수. 같은 점수끼리는 무작위로 섞고, 이미 보여 준 책·내가 등록한 책은 조금 뒤로 미뤄 매번 다른 책이 나오게 한다.
  const seen = new Set();
  function rank(picks, rnd = Math.random, mine = []) {
    return BOOKS.map(b => ({ b, s: picks.filter(t => b.tags.includes(t)).length }))
      .map(x => ({ ...x, k: x.s + rnd() * 0.9 - (seen.has(x.b.t) ? 0.6 : 0) - (mine.includes(x.b.t) ? 0.8 : 0) }))
      .sort((x, y) => y.k - x.k).slice(0, 3);
  }
  // 자체 점검: 5개 태그가 모두 맞는 책은 무작위가 최악이어도 1순위, 추천은 늘 3권, 서로 다른 책
  { const r = rank(['society', 'real', 'short', 'dark', 'fast'], () => 0.99); console.assert(r.length === 3 && r[0].s === 5 && new Set(r.map(x => x.b.t)).size === 3, 'BOOK PICK 점수 규칙 오류');
    console.assert(BOOKS.every(b => b.tags.length === QS.length && QS.every(q => q.a.some(o => b.tags.includes(o.tag)))), 'BOOK PICK 태그 누락'); }

  let saved = [];
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) saved = s; } catch {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} };

  let step = 0, picks = [], regFor = '', regMsg = '', shown = null; // shown: 이번 결과(다시 그려도 같은 3권)
  const label = tag => QS.flatMap(q => q.a).find(a => a.tag === tag).t;

  function render() {
    const box = $('pickBox');
    if (step < QS.length) {
      const q = QS[step];
      box.innerHTML = `<p class="pstep">질문 ${step + 1} / ${QS.length}</p><h2 class="pq">${q.q}</h2>
        <div class="pchoices">${q.a.map(a => `<button type="button" class="pchoice" data-tag="${a.tag}">${a.t}</button>`).join('')}</div>`;
      return;
    }
    const mine = window.BF.library();
    if (!shown) { shown = rank(picks, Math.random, mine); shown.forEach(x => seen.add(x.b.t)); }
    const res = shown;
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
    else if (e.target.closest('[data-again]')) { step = 0; picks = []; shown = null; render(); }
  });
  // 등록하면 독서 기록 화면(쪽수 입력)으로 이동
  const goLog = () => { document.querySelector('.menu [data-page=my]').click(); document.querySelector('.tabs [data-view=log]').click(); };
  document.querySelectorAll('[data-page=pick]').forEach(b => b.addEventListener('click', () => { step = 0; picks = []; shown = null; render(); }));
})();
