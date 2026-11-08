// FLEX ADMIN(교사용 대시보드) 1차: 비밀번호 접속, 학급 현황, 완독 승인·반려, 학생 명단, CSV 다운로드
// 주의: 비밀번호가 브라우저 코드에 들어 있는 시연용 방식이다. 실제 운영은 서버 로그인이 필요하다.
(() => {
  const $ = id => document.getElementById(id);
  const PW = '1107', SK = 'bookflex.admin';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATS = ['문학', '인문', '사회', '과학', '예술', '기타'];
  const isAdmin = () => { try { return sessionStorage.getItem(SK) === '1'; } catch { return false; } };
  const setAdmin = v => { try { v ? sessionStorage.setItem(SK, '1') : sessionStorage.removeItem(SK); } catch {} };

  function render() {
    const C = window.CLASS_DATA, st = window.BF.stats(), pend = window.BF.pending();
    const done = window.BF.books().filter(b => b.s.startsWith('완독')).length;
    $('adSum').innerHTML = [
      ['학급 인원', `${C.total}명`], ['함께 읽은 쪽', `${C.pages().toLocaleString('ko-KR')}쪽`],
      ['승인 대기', `${pend.length}건`], ['내 승인 완독', `${done}권`],
    ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    $('adPend').innerHTML = pend.length ? pend.map(b => `<div class="adrow"><div><b>${esc(b.t)}</b><small>${esc(b.w)} · 전체 ${b.total}쪽 · 별빛책방(나)</small></div>
        <label>분야<select data-cat="${esc(b.t)}">${CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
        <button type="button" class="cta mini" data-ok="${esc(b.t)}">승인</button><button type="button" class="cta mini ghost" data-no="${esc(b.t)}">반려</button></div>`).join('')
      : '<p class="note">승인을 기다리는 완독이 없어요. 학생이 책을 끝 쪽까지 기록하면 여기에 나타나요.</p>';
    $('adRows').innerHTML = C.friends.map(([n, t, p, b, d, me]) => me
      ? `<tr><td><b>${esc(window.PROFILE.name)}</b> <small>(나)</small></td><td>${esc(document.getElementById('eqBadge').textContent.trim())}</td><td>${st.pages}</td><td>${done}</td><td>${$('weekDays').textContent}</td></tr>`
      : `<tr><td><b>${esc(n)}</b></td><td>${esc(t)}</td><td>${p}</td><td>${b}</td><td>${d}</td></tr>`).join('');
  }

  function open() { window.SHOWPAGE('admin'); $('adMsg').textContent = ''; render(); scrollTo(0, 0); }

  // 로그인 창
  const dlg = $('adminDlg');
  $('adminBtn').addEventListener('click', () => {
    if (isAdmin()) return open();
    $('adminPw').value = ''; $('adminMsg').textContent = '';
    dlg.showModal(); $('adminPw').focus();
  });
  $('adminCancel').addEventListener('click', () => dlg.close());
  $('adminForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('adminPw').value !== PW) { $('adminMsg').className = 'msg'; $('adminMsg').textContent = '비밀번호가 맞지 않아요.'; $('adminPw').value = ''; $('adminPw').focus(); return; }
    setAdmin(true); dlg.close(); open();
  });
  $('adminOut').addEventListener('click', () => { setAdmin(false); window.SHOWPAGE('my'); });

  // 완독 승인·반려
  $('adPend').addEventListener('click', e => {
    const ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
    if (!ok && !no) return;
    const t = (ok || no).dataset.ok || (ok || no).dataset.no, m = $('adMsg');
    if (ok) {
      const cat = [...document.querySelectorAll('#adPend [data-cat]')].find(s => s.dataset.cat === t).value;
      window.BF.approve(t, cat); m.className = 'msg okm'; m.textContent = `「${t}」 완독을 ${cat} 분야로 승인했어요. 학생에게 +40칩이 지급돼요.`;
    } else { window.BF.reject(t); m.className = 'msg'; m.textContent = `「${t}」 완독 신청을 돌려보냈어요. 학생이 다시 읽은 쪽을 기록할 수 있어요.`; }
    render();
  });
  document.addEventListener('bf:change', () => { if (!$('v-admin').hidden) render(); });

  // CSV 다운로드(UTF-8 BOM: 엑셀에서 한글이 깨지지 않게)
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  function download(name, rows) {
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $('dlSum').addEventListener('click', () => {
    const st = window.BF.stats(), done = window.BF.books().filter(b => b.s.startsWith('완독')).length;
    download(`BOOK_FLEX_2학년2반_학생요약_${st.today}.csv`, [['학생', '대표 칭호', '누적 읽은 쪽', '승인 완독 권수', '이번 주 기록일'],
      ...window.CLASS_DATA.friends.map(([n, t, p, b, d, me]) => me ? [window.PROFILE.name, document.getElementById('eqBadge').textContent.trim(), st.pages, done, $('weekDays').textContent] : [n, t, p, b, d])]);
  });
  $('dlLog').addEventListener('click', () => {
    const st = window.BF.stats();
    download(`BOOK_FLEX_2학년2반_독서기록_${window.PROFILE.name}_${st.today}.csv`, [['날짜', '구분', '책', '시작 쪽', '끝 쪽', '읽은 쪽', '받은 칩', '한 구절', '분야'],
      ...window.BF.entries().sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.kind === 'done' ? '완독 승인' : '읽기', e.book, e.start ?? '', e.end ?? '', e.pages, e.chips, e.quote || '', e.cat || ''])]);
  });
})();
