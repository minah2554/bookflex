const APP_VERSION = '0.5.0'; // CHANGELOG.md와 함께 올린다
const THEME_KEY = 'bookflex.theme.v1';
const KEY = 'bookflex.room.v1';

// 등각 투영: 바닥 좌표 (u,v,z) -> 화면. u는 오른쪽 아래, v는 왼쪽 아래 방향. 오른쪽 벽 v=0, 왼쪽 벽 u=0.
const P = (u, v, z = 0) => [240 + u - v, 150 + (u + v) / 2 - z];
const pts = a => a.map(p => p.join(',')).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
// 상자: c = [윗면, 왼쪽 앞면(v+d), 오른쪽 앞면(u+w)]
const box = (u, v, w, d, z1, c, z0 = 0) =>
  poly([P(u, v + d, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u, v + d, z1)], c[1]) +
  poly([P(u + w, v, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u + w, v, z1)], c[2]) +
  poly([P(u, v, z1), P(u + w, v, z1), P(u + w, v + d, z1), P(u, v + d, z1)], c[0]);
const circle = (p, r, f) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${f}"/>`;

const WOOD = ['#d9a56b', '#b98350', '#a2703f'];
const DARK = ['#8a5a36', '#6e4527', '#5a371d'];

const WALLS = {
  cream: { name: '크림', base: '#fbf1d9', line: '#ecdcb2', w: 10, h: 10, mark: '<rect width="1.5" height="10" fill="#ecdcb2"/>' },
  blue: { shop: true, name: '하늘', base: '#c3d9f0', line: '#a9c6e8', w: 16, h: 16, mark: '<rect width="6" height="16" fill="#aac8ea"/><circle cx="11" cy="8" r="1.4" fill="#fff"/>' },
  wood: { shop: true, name: '우드', base: '#c9935a', line: '#a9763f', w: 20, h: 14, mark: '<rect y="13" width="20" height="1.5" fill="#a9763f"/>' },
};
const FLOORS = {
  wood: { name: '원목', w: 24, h: 12, mark: '<rect width="24" height="12" fill="#e2b783"/><rect y="11" width="24" height="1" fill="#c99a62"/><rect x="12" width="1" height="11" fill="#d1a56f"/>' },
  tile: { shop: true, name: '타일', w: 24, h: 24, mark: '<rect width="24" height="24" fill="#f3f3ee"/><rect width="12" height="12" fill="#cfd8e3"/><rect x="12" y="12" width="12" height="12" fill="#cfd8e3"/>' },
  carpet: { shop: true, name: '카펫', w: 12, h: 12, mark: '<rect width="12" height="12" fill="#f4d6d6"/><circle cx="3" cy="3" r="1.4" fill="#e3a4a4"/><circle cx="9" cy="9" r="1.4" fill="#e3a4a4"/>' },
};

const ITEMS = [
  { id: 'window', label: '창문', layer: 1, draw() {
    const L = (v, z) => P(0, v, z);
    return poly([L(108, 44), L(168, 44), L(168, 110), L(108, 110)], '#fff', 'stroke="#c9b48f"') +
      poly([L(112, 48), L(164, 48), L(164, 106), L(112, 106)], '#9fd6f2') +
      poly([L(112, 48), L(164, 48), L(164, 60), L(112, 60)], '#c8ecfa') +
      `<polyline points="${pts([L(138, 48), L(138, 106)])}" stroke="#fff" stroke-width="2"/>` +
      `<polyline points="${pts([L(112, 77), L(164, 77)])}" stroke="#fff" stroke-width="2"/>` +
      poly([L(104, 40), L(118, 40), L(124, 108), L(104, 108)], '#f6b8c6') +
      poly([L(158, 40), L(172, 40), L(172, 108), L(152, 108)], '#f6b8c6'); } },
  { id: 'poster', label: '포스터', layer: 1, draw() {
    const R = (u, z) => P(u, 0, z);
    return poly([R(22, 62), R(62, 62), R(62, 106), R(22, 106)], '#fff', 'stroke="#c9b48f"') +
      poly([R(26, 66), R(58, 66), R(58, 102), R(26, 102)], '#ffe7a8') +
      poly([R(26, 66), R(34, 82), R(42, 72), R(50, 88), R(58, 66)], '#4f9d69') +
      poly([R(46, 92), R(52, 92), R(52, 98), R(46, 98)], '#f26d5b'); } },
  { id: 'rug', label: '러그', layer: 2, draw() {
    return poly([P(68, 92), P(132, 92), P(132, 158), P(68, 158)], '#f7e8d0') +
      poly([P(73, 97), P(127, 97), P(127, 153), P(73, 153)], '#e98ba0') +
      poly([P(82, 106), P(118, 106), P(118, 144), P(82, 144)], '#f7c9d4'); } },
  { id: 'bed', label: '침대', layer: 3, draw() {
    return box(8, 4, 60, 6, 52, DARK) +
      box(8, 10, 60, 104, 20, ['#fff', '#e8eef7', '#d6deec']) +
      box(8, 48, 60, 66, 26, ['#f6a5b8', '#ef8fa6', '#e07890']) +
      box(14, 14, 48, 22, 27, ['#fff', '#eef1f7', '#dde3ef'], 20); } },
  { id: 'shelf', label: '책장', layer: 3, draw() {
    const F = (a, b) => P(a, 22, b);
    let s = box(100, 2, 64, 20, 100, DARK) + poly([F(103, 3), F(161, 3), F(161, 97), F(103, 97)], '#4a2f1b');
    const colors = ['#e0556f', '#3a7bd5', '#f2b84b', '#4f9d69', '#8e63c9', '#2aa0c8'];
    [4, 36, 68].forEach((z, i) => {
      s += poly([F(103, z), F(161, z), F(161, z + 2), F(103, z + 2)], '#c89b6a');
      for (let a = 105, k = 0; a < 156; k++) {
        const w = 4 + (k + i) % 3, h = 18 + ((k * 7 + i * 3) % 9);
        s += poly([F(a, z + 2), F(a + w, z + 2), F(a + w, z + 2 + h), F(a, z + 2 + h)], colors[(k + i * 2) % 6], 'stroke="#0003" stroke-width=".5"');
        a += w + 1;
      }
    });
    return s; } },
  { id: 'plant', label: '화분', layer: 4, draw() {
    return box(168, 8, 14, 14, 14, ['#d98a5f', '#c0724a', '#a95f3a']) +
      circle(P(175, 15, 26), 10, '#3f9a5c') + circle(P(171, 12, 34), 8, '#55b573') + circle(P(179, 17, 34), 8, '#55b573'); } },
  { id: 'desk', label: '책상', layer: 5, draw() {
    const leg = (u, v) => box(u, v, 4, 4, 30, DARK);
    return leg(112, 50) + leg(174, 50) + leg(112, 78) + leg(174, 78) +
      box(110, 48, 72, 36, 34, WOOD, 30) +
      box(146, 58, 16, 22, 38, ['#f2b84b', '#d99a2f', '#c28622'], 34); } },
  // shop: true 는 FLEX SHOP에서 사야 방에 나타난다
  { id: 'lamp', label: '독서등', layer: 6, shop: true, draw() {
    return box(120, 56, 10, 10, 37, ['#555', '#444', '#333'], 34) +
      box(124, 60, 2, 2, 58, ['#666', '#555', '#444'], 37) +
      box(118, 54, 14, 14, 66, ['#ffe27a', '#f5c94a', '#e0b030'], 58); } },
  { id: 'mug', label: '머그컵', layer: 6.2, shop: true, draw() { return box(136, 70, 7, 7, 42, ['#fff', '#e8eef7', '#d6deec'], 34); } },
  { id: 'clock', label: '탁상시계', layer: 6.2, shop: true, draw() { return box(168, 52, 8, 5, 45, ['#6aa7e8', '#4f8fd6', '#3f7cc0'], 34); } },
  { id: 'bmark', label: '책갈피', layer: 6.2, shop: true, draw() { return box(150, 62, 3, 10, 40, ['#e0556f', '#c8435c', '#b33a52'], 38); } },
  { id: 'frame', label: '미니 액자', layer: 1, shop: true, draw() {
    const R = (u, z) => P(u, 0, z);
    return poly([R(72, 70), R(92, 70), R(92, 92), R(72, 92)], '#fff', 'stroke="#c9b48f"') +
      poly([R(75, 73), R(89, 73), R(89, 89), R(75, 89)], '#f6c6d4') + poly([R(75, 73), R(82, 84), R(89, 73)], '#e98ba0'); } },
  { id: 'cushion', label: '초록 쿠션', layer: 3.5, shop: true, draw() { return box(20, 36, 28, 10, 33, ['#6fc58a', '#4fa86c', '#3f9159'], 20); } },
  { id: 'books', label: '책더미', layer: 4.5, shop: true, draw() {
    return box(150, 88, 20, 14, 6, ['#e0556f', '#c8435c', '#b33a52']) + box(151, 89, 18, 12, 12, ['#5b86e5', '#486fc8', '#3b5fae'], 6) +
      box(152, 90, 16, 10, 17, ['#4fa86c', '#3f9159', '#357b4b'], 12); } },
  { id: 'sunset', label: '노을 포스터', layer: 1, shop: true, draw() {
    const L = (v, z) => P(0, v, z);
    return poly([L(30, 64), L(72, 64), L(72, 104), L(30, 104)], '#fff', 'stroke="#c9b48f"') +
      poly([L(34, 68), L(68, 68), L(68, 100), L(34, 100)], '#f7a65a') + poly([L(34, 68), L(68, 68), L(68, 82), L(34, 82)], '#f9d27a') +
      poly([L(34, 100), L(68, 100), L(68, 90), L(34, 90)], '#8e63c9'); } },
  { id: 'roundrug', label: '동그란 러그', layer: 2.5, shop: true, draw() {
    const ring = r => Array.from({ length: 28 }, (_, i) => P(115 + r * Math.cos(i / 28 * 6.2832), 140 + r * Math.sin(i / 28 * 6.2832)));
    return poly(ring(27), '#f3c76b') + poly(ring(19), '#fbe8b3'); } },
  { id: 'sofa', label: '소파', layer: 4.6, shop: true, draw() {
    const c = ['#7aa6e0', '#5f8fd0', '#4d7bbb'];
    return box(150, 110, 10, 62, 40, c) + box(160, 110, 24, 62, 18, c); } },
  { id: 'chair', label: '의자', layer: 6.3, shop: true, draw() {
    const c = ['#e8b87a', '#cf9a5a', '#b9854a'];
    return box(132, 94, 10, 10, 14, DARK) + box(128, 90, 18, 18, 18, c, 14) + box(128, 105, 18, 3, 40, c, 18); } },
  { id: 'bigrug', label: '대형 러그', layer: 1.8, shop: true, draw() {
    return poly([P(60, 80), P(145, 80), P(145, 185), P(60, 185)], '#2f7d8a') + poly([P(66, 86), P(139, 86), P(139, 179), P(66, 179)], '#8cc9cf'); } },
];

// 구매한 상점 물건(기본: 초록 쿠션 보유). 벽지·바닥은 'wall-키' / 'floor-키' 로 저장
const SHOP_KEY = 'bookflex.shop.v1';
const owned = new Set((() => {
  try { const s = JSON.parse(localStorage.getItem(SHOP_KEY)); if (Array.isArray(s)) return s; } catch {}
  return ['cushion'];
})());
const own = id => owned.has(id);

const state = (() => {
  const d = { wall: 'cream', floor: 'wood', off: [] };
  try { return { ...d, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return d; }
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

// px: 한 화면에 방이 둘(홈·상점) 있어 패턴 id가 겹치지 않게 붙이는 접두어
// over: 상점 미리보기용 { wall, floor, add } — 안 산 물건도 임시로 놓아 본다
function roomSvg(px, over = {}) {
  const wk = over.wall || state.wall, fk = over.floor || state.floor, wl = WALLS[wk];
  const pats = Object.entries({ ...prefix(px + 'w-', WALLS), ...prefix(px + 'f-', FLOORS) }).map(([id, p]) =>
    `<pattern id="${id}" width="${p.w}" height="${p.h}" patternUnits="userSpaceOnUse">${p.mark}</pattern>`).join('');
  const wall = (pts4, shade) => `<polygon points="${pts(pts4)}" fill="${wl.base}"/><polygon points="${pts(pts4)}" fill="url(#${px}w-${wk})"/>` +
    `<polygon points="${pts(pts4)}" fill="#000" opacity="${shade}" stroke="#0003"/>`;
  const items = ITEMS.filter(i => over.add === i.id || ((!i.shop || own(i.id)) && !state.off.includes(i.id)))
    .sort((a, b) => a.layer - b.layer).map(i => i.draw()).join('');
  return `<svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg"><defs>${pats}</defs>
    <rect width="480" height="360" fill="#fdf6ec"/>
    ${wall([P(0, 0, 120), P(0, 190, 120), P(0, 190), P(0, 0)], 0.08)}
    ${wall([P(0, 0, 120), P(190, 0, 120), P(190, 0), P(0, 0)], 0)}
    <polygon points="${pts([P(0, 0), P(190, 0), P(190, 190), P(0, 190)])}" fill="url(#${px}f-${fk})" stroke="#0003"/>
    ${items}</svg>`;
}
const room = () => (document.getElementById('room').innerHTML = roomSvg('h-'));
// 상점 화면이 쓰는 창구: 구매하면 방에 바로 놓이고(벽지·바닥은 바로 적용) 저장한다
window.ROOM = {
  roomSvg, ITEMS, WALLS, FLOORS, own,
  buy(id) {
    owned.add(id);
    try { localStorage.setItem(SHOP_KEY, JSON.stringify([...owned])); } catch {}
    if (id.startsWith('wall-')) state.wall = id.slice(5);
    else if (id.startsWith('floor-')) state.floor = id.slice(6);
    else state.off = state.off.filter(x => x !== id);
    save(); render();
  },
};
function prefix(p, o) { return Object.fromEntries(Object.entries(o).map(([k, v]) => [p + k, v])); }

function buttons(id, entries, isOn, onClick) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  entries.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed', isOn(key));
    b.onclick = () => { onClick(key); save(); render(); };
    el.append(b);
  });
}
function render() {
  buttons('walls', Object.entries(WALLS).filter(([k, v]) => !v.shop || own('wall-' + k)).map(([k, v]) => [k, v.name]), k => state.wall === k, k => (state.wall = k));
  buttons('floors', Object.entries(FLOORS).filter(([k, v]) => !v.shop || own('floor-' + k)).map(([k, v]) => [k, v.name]), k => state.floor === k, k => (state.floor = k));
  buttons('items', ITEMS.filter(i => !i.shop || own(i.id)).map(i => [i.id, i.label]), k => !state.off.includes(k),
    k => (state.off = state.off.includes(k) ? state.off.filter(x => x !== k) : [...state.off, k]));
  room();
}

document.getElementById('reset').onclick = () => { Object.assign(state, { wall: 'cream', floor: 'wood', off: [] }); save(); render(); };
document.getElementById('ver').textContent = 'v' + APP_VERSION;
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

const deco = document.getElementById('deco');
deco.onclick = () => {
  const ctrl = document.getElementById('ctrl');
  ctrl.hidden = !ctrl.hidden;
  deco.setAttribute('aria-expanded', !ctrl.hidden);
};

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
document.querySelectorAll('.themes button').forEach(b => (b.onclick = () => setTheme(b.dataset.t)));
try { const t = localStorage.getItem(THEME_KEY); if (['cy', 'peach', 'green'].includes(t)) setTheme(t); } catch {}
render();
