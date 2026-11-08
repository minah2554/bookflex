const APP_VERSION = '6.8'; // CHANGELOG.md와 함께 올린다
const THEME_KEY = 'bookflex.theme.v1';
const KEY = 'bookflex.room.v1';

// 등각 투영: 바닥 좌표 (u,v,z) -> 화면. u는 오른쪽 아래, v는 왼쪽 아래 방향. 오른쪽 벽 v=0, 왼쪽 벽 u=0.
const P = (u, v, z = 0) => [240 + u - v, 150 + (u + v) / 2 - z];
const pts = a => a.map(p => p.join(',')).join(' ');
const poly = (a, fill, extra = '') => extra.includes('stroke') ? `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`
  : `<polygon points="${pts(a)}" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round" ${extra}/><polygon points="${pts(a)}" fill="url(#clay)" stroke="url(#clay)" stroke-width="2" stroke-linejoin="round"/>`;
// 상자: c = [윗면, 왼쪽 앞면(v+d), 오른쪽 앞면(u+w)]
const box = (u, v, w, d, z1, c, z0 = 0) =>
  poly([P(u, v + d, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u, v + d, z1)], c[1]) +
  poly([P(u + w, v, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u + w, v, z1)], c[2]) +
  poly([P(u, v, z1), P(u + w, v, z1), P(u + w, v + d, z1), P(u, v + d, z1)], c[0]);
const circle = (p, r, f) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${f}"/>`;

const WOOD = ['#d9a56b', '#b98350', '#a2703f'];
const DARK = ['#8a5a36', '#6e4527', '#5a371d'];
const OAK = ['#f0d2a4', '#dcb27a', '#c99a62'];

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
  { id: 'window', label: '창문', layer: 1, shop: true, draw() {
    const L = (v, z) => P(0, v, z);
    return poly([L(108, 44), L(168, 44), L(168, 110), L(108, 110)], '#fff', 'stroke="#c9b48f"') +
      poly([L(112, 48), L(164, 48), L(164, 106), L(112, 106)], '#9fd6f2') +
      poly([L(112, 48), L(164, 48), L(164, 60), L(112, 60)], '#c8ecfa') +
      `<polyline points="${pts([L(138, 48), L(138, 106)])}" stroke="#fff" stroke-width="2"/>` +
      `<polyline points="${pts([L(112, 77), L(164, 77)])}" stroke="#fff" stroke-width="2"/>` +
      poly([L(104, 40), L(118, 40), L(124, 108), L(104, 108)], '#f6b8c6') +
      poly([L(158, 40), L(172, 40), L(172, 108), L(152, 108)], '#f6b8c6'); } },
  { id: 'poster', label: '포스터', layer: 1, shop: true, draw() {
    const R = (u, z) => P(u, 0, z);
    return poly([R(22, 62), R(62, 62), R(62, 106), R(22, 106)], '#fff', 'stroke="#c9b48f"') +
      poly([R(26, 66), R(58, 66), R(58, 102), R(26, 102)], '#ffe7a8') +
      poly([R(26, 66), R(34, 82), R(42, 72), R(50, 88), R(58, 66)], '#4f9d69') +
      poly([R(46, 92), R(52, 92), R(52, 98), R(46, 98)], '#f26d5b'); } },
  { id: 'rug', label: '러그', layer: 2, shop: true, draw() {
    return poly([P(68, 92), P(132, 92), P(132, 158), P(68, 158)], '#f7e8d0') +
      poly([P(73, 97), P(127, 97), P(127, 153), P(73, 153)], '#e98ba0') +
      poly([P(82, 106), P(118, 106), P(118, 144), P(82, 144)], '#f7c9d4'); } },
  // 침대는 그림 파일(assets/bed.png). 방 뒤쪽 구석, 머리판이 오른쪽 벽에 붙는다.
  { id: 'bed', label: '침대', layer: 3, draw() { return '<image href="assets/bed.png" x="153" y="102" width="140" height="118"/>'; } },
  // 책장은 기본 가구. 책을 완독할 때마다 아래 칸부터 한 권씩 꽂힌다(books: 완독 권수).
  { id: 'shelf', label: '책장', layer: 3, draw(books) {
    const F = (a, b) => P(a - 34, 22, b);
    const n = books ?? (window.BF ? window.BF.books().filter(b => b.s.startsWith('완독')).length : 0);
    let s = box(66, 2, 64, 20, 100, OAK) + poly([F(103, 3), F(161, 3), F(161, 97), F(103, 97)], '#b88650');
    const colors = ['#e0556f', '#3a7bd5', '#f2b84b', '#4f9d69', '#8e63c9', '#2aa0c8'];
    let left = n;
    [4, 36, 68].forEach((z, i) => {
      s += poly([F(103, z), F(161, z), F(161, z + 2), F(103, z + 2)], '#f0d2a4');
      for (let a = 105, k = 0; a < 156 && left > 0; k++, left--) {
        const w = 4 + (k + i) % 3, h = 18 + ((k * 7 + i * 3) % 9);
        s += poly([F(a, z + 2), F(a + w, z + 2), F(a + w, z + 2 + h), F(a, z + 2 + h)], colors[(k + i * 2) % 6], 'stroke="#0003" stroke-width=".5"');
        a += w + 1;
      }
    });
    return s; } },
  { id: 'nightstand', label: '협탁', layer: 3.2, draw() {
    return box(4, 124, 24, 24, 22, ['#fff1d6', '#f0d2a4', '#dcb27a']) + poly([P(8, 148, 14), P(24, 148, 14), P(24, 148, 6), P(8, 148, 6)], '#e0bb86') + circle(P(16, 148, 10), 1.8, '#c28a4a'); } },
  { id: 'plant', label: '화분', layer: 4, shop: true, draw() {
    return box(168, 8, 14, 14, 14, ['#d98a5f', '#c0724a', '#a95f3a']) +
      circle(P(175, 15, 26), 10, '#3f9a5c') + circle(P(171, 12, 34), 8, '#55b573') + circle(P(179, 17, 34), 8, '#55b573'); } },
  { id: 'desk', label: '책상', layer: 5, shop: true, draw() {
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

// 상점 물건 그림(assets/items). 일곱 가지 물건은 디자인 4종 중 하나를 고를 수 있다(상점에서).
const DIM = {"bmark-1":[440,280],"bmark-2":[440,251],"bmark-3":[440,282],"bmark-4":[440,225],"clock-1":[312,440],"clock-2":[319,440],"clock-3":[368,440],"clock-4":[332,440],"mug-1":[440,402],"mug-2":[440,387],"mug-3":[439,440],"mug-4":[440,429],"plant-1":[371,440],"plant-2":[259,440],"plant-3":[355,440],"plant-4":[270,440],"rug-1":[440,236],"rug-2":[440,258],"rug-3":[440,236],"rug-4":[440,249],"frame-1":[321,440],"frame-2":[345,440],"frame-3":[384,440],"frame-4":[341,440],"poster-1":[382,440],"poster-2":[294,440],"poster-3":[396,440],"poster-4":[238,440],"chair":[348,440],"sofa":[440,412],"bigrug":[440,232],"wall-blue":[330,440],"wall-wood":[325,440],"floor-carpet":[440,239],"floor-tile":[440,247],"books-1":[391,440],"books-2":[388,440],"desk-1":[440,301],"desk-2":[440,330],"lamp-1":[233,440],"lamp-2":[242,440],"roundrug-1":[440,222],"roundrug-2":[440,183],"sunset-1":[389,440],"sunset-2":[328,440],"window-1":[413,440],"window-2":[427,440]};
const VAR_KEY = 'bookflex.variant.v1', HAS_VAR = ['bmark', 'clock', 'mug', 'plant', 'rug', 'frame', 'poster', 'books', 'desk', 'lamp', 'roundrug', 'sunset', 'window'];
const VAR_N = { books: 2, desk: 2, lamp: 2, roundrug: 2, sunset: 2, window: 2 }; // 나머지는 4종
const varCount = id => VAR_N[id] || 4;
const variants = (() => { try { return JSON.parse(localStorage.getItem(VAR_KEY)) || {}; } catch { return {}; } })();
const spriteKey = id => (HAS_VAR.includes(id) ? id + '-' + (variants[id] || 1) : id);
// 방 안 자리: [가운데 x, 기준 y, 가로폭, mid(1이면 y가 그림 가운데, 아니면 바닥)] — 방 좌표(480×360 기준)
const PLACE = {
  plant: [106, 312, 40], rug: [222, 262, 150, 1], roundrug: [225, 272, 120, 1], bigrug: [225, 255, 250, 1],
  desk: [384, 302, 130], chair: [344, 318, 54], sofa: [170, 306, 100], books: [322, 292, 44],
  lamp: [351, 244, 22], mug: [382, 253, 13], clock: [414, 248, 17], bmark: [400, 259, 20, 1],
  window: [105, 138, 66, 1], sunset: [185, 98, 36, 1], poster: [283, 92, 40, 1], frame: [392, 120, 34, 1],
};
// 그림에 이미 들어 있는 윗선 기울기(dy/dx). 방 벽·가구 선(±0.5)에 맞도록 모자란 만큼 기울인다.
//   왼쪽 벽 물건은 오른쪽으로 갈수록 올라가고(-0.5), 오른쪽 벽·책상은 내려간다(+0.5).
const BAKED = { 'window-1': -.24, 'window-2': -.24, 'sunset-1': -.31, 'sunset-2': -.22, 'poster-1': .4, 'poster-2': .38, 'poster-3': .41, 'poster-4': .41, 'frame-1': .38, 'frame-2': .4, 'frame-3': .43, 'frame-4': .4, 'desk-1': .24, 'desk-2': .28 };
const GOAL = { window: -.5, sunset: -.5, poster: .5, frame: .5, desk: .5 };
const TILT = (id, k) => (BAKED[k] === undefined ? 0 : +(Math.atan(GOAL[id] - BAKED[k]) * 180 / Math.PI).toFixed(1));
// 책상이 없으면 책상 위 작은 물건은 협탁 위에 놓인다
const ALT = { lamp: [118, 203, 22], clock: [133, 205, 15], mug: [123, 209, 12], bmark: [111, 207, 16, 1] };
ITEMS.forEach(i => {
  if (!PLACE[i.id]) return;
  i.draw = (_, list = []) => {
    const p = ALT[i.id] && !list.some(x => x.id === 'desk') ? ALT[i.id] : PLACE[i.id], k = spriteKey(i.id), d = DIM[k], w = p[2], h = w * d[1] / d[0];
    const x = p[0] - w / 2, y = p[3] ? p[1] - h / 2 : p[1] - h, img = `<image href="assets/items/${k}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    const a = TILT(i.id, k);
    return a ? `<g transform="translate(${p[0]} ${y + h / 2}) skewY(${a}) translate(${-p[0]} ${-(y + h / 2)})">${img}</g>` : img;
  };
});

// 구매한 상점 물건(기본: 초록 쿠션 보유). 벽지·바닥은 'wall-키' / 'floor-키' 로 저장
const SHOP_KEY = 'bookflex.shop.v1';
const owned = new Set((() => {
  try { const s = JSON.parse(localStorage.getItem(SHOP_KEY)); if (Array.isArray(s)) return s; } catch {}
  return []; // 처음엔 벽지·바닥·침대만 있는 빈 방
})());
const own = id => owned.has(id);

const state = (() => {
  const d = { wall: 'cream', floor: 'wood', off: [], pos: {}, avatar: { hair: '#6b3f2a', top: '#e0556f', hs: 'short', os: 'tee' }, say: '어서 와, 내 서재에 놀러 왔구나!' };
  try { const s = JSON.parse(localStorage.getItem(KEY)) || {}; return { ...d, ...s, avatar: { ...d.avatar, ...s.avatar } }; } catch { return d; }
})();
// 프로필: 닉네임과 서재 이름(비우면 '닉네임의 서재')
const PROF_KEY = 'bookflex.profile.v1';
const profile = (() => {
  const d = { name: '별빛책방', title: '' };
  try { return { ...d, ...JSON.parse(localStorage.getItem(PROF_KEY)) }; } catch { return d; }
})();
window.PROFILE = { get name() { return profile.name; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

const escSvg = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 아바타 스타일: 머리 6종(남 3·여 3), 옷 5종. 색은 hair/top 에서 고른다.
const HAIR_STYLES = [['short', '남 · 짧은 머리'], ['crew', '남 · 스포츠 머리'], ['curly', '남 · 곱슬 머리'], ['bob', '여 · 단발'], ['long', '여 · 긴 머리'], ['twin', '여 · 양갈래']];
const OUTFITS = [['tee', '티셔츠'], ['hoodie', '후드티'], ['dress', '원피스'], ['uniform', '교복'], ['cardigan', '가디건']];
function figure(x, y, a) {
  const hs = a.hs || 'short', os = a.os || 'tee', h = a.hair, t = a.top, hy = y - 40, skin = '#ffd9b8';
  // 점토 인형 느낌: 모든 면에 같은 부드러운 하이라이트·그늘(#clay)을 한 겹 덮는다
  const K = (tag, at, c, extra = '') => `<${tag} ${at} fill="${c}" ${extra}/><${tag} ${at} fill="url(#clay)"/>`;
  const R = (rx, ry, w, hh, r, c) => K('rect', `x="${rx}" y="${ry}" width="${w}" height="${hh}" rx="${r}"`, c);
  const C = (cx, cy, r, c) => K('circle', `cx="${cx}" cy="${cy}" r="${r}"`, c);
  const Pa = (d, c) => K('path', `d="${d}"`, c);
  const defs = '<defs><radialGradient id="clay" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>';
  const arms = c => R(x - 13, y - 29, 5, 12, 2.5, c) + R(x + 8, y - 29, 5, 12, 2.5, c) + C(x - 10.5, y - 16, 2.8, skin) + C(x + 10.5, y - 16, 2.8, skin);
  const shoes = K('ellipse', `cx="${x - 3.6}" cy="${y - 1.5}" rx="4.6" ry="3"`, '#efe3d0') + K('ellipse', `cx="${x + 3.6}" cy="${y - 1.5}" rx="4.6" ry="3"`, '#efe3d0');
  const legs = (os === 'dress' ? R(x - 4.5, y - 8, 3.5, 8, 1.5, skin) + R(x + 1, y - 8, 3.5, 8, 1.5, skin)
    : R(x - 6.5, y - 14, 6, 12, 2.5, '#5e5560') + R(x + 0.5, y - 14, 6, 12, 2.5, '#5e5560')) + shoes;
  const body = {
    tee: R(x - 9, y - 31, 18, 20, 6, t) + arms(t),
    hoodie: R(x - 10, y - 31, 20, 21, 7, t) + arms(t) + `<ellipse cx="${x}" cy="${y - 31}" rx="8" ry="3" fill="#0003"/><path d="M${x - 3} ${y - 28}v7M${x + 3} ${y - 28}v7" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`,
    dress: Pa(`M${x - 8} ${y - 31}h16l5 24h-26z`, t) + arms(t) + `<path d="M${x - 8} ${y - 21}h16" stroke="#fff7" stroke-width="2"/>`,
    uniform: R(x - 9, y - 31, 18, 20, 6, '#fff') + arms('#fff') + Pa(`M${x - 5} ${y - 31}l5 6 5 -6z`, t) + Pa(`M${x} ${y - 25}l-2 8h4z`, t) + R(x - 9, y - 15, 18, 5, 2, '#3a4a7a'),
    cardigan: R(x - 9, y - 31, 18, 20, 6, '#fff') + R(x - 9, y - 31, 7, 20, 3, t) + R(x + 2, y - 31, 7, 20, 3, t) + arms(t) + `<circle cx="${x}" cy="${y - 24}" r="1" fill="${t}"/><circle cx="${x}" cy="${y - 19}" r="1" fill="${t}"/>`,
  }[os] || '';
  const back = { long: R(x - 13, hy - 8, 26, 32, 10, h), bob: R(x - 13, hy - 7, 26, 19, 9, h) }[hs] || '';
  const cap = Pa(`M${x - 12} ${hy + 1} a12 12 0 0 1 24 0 q-6 -3 -9 -1 q-3 -3 -6 -1 q-4 -3 -9 2z`, h);
  const front = {
    short: cap + R(x - 12, hy, 3.5, 8, 1.7, h) + R(x + 8.5, hy, 3.5, 8, 1.7, h),
    crew: Pa(`M${x - 11} ${hy - 1} a11 11 0 0 1 22 0 q-11 -4 -22 0z`, h),
    curly: [-9, -3.5, 3.5, 9].map((d, i) => C(x + d, hy - 8 + (i % 2) * 2, 5.5, h)).join('') + Pa(`M${x - 11} ${hy} q11 -7 22 0 q-11 -3 -22 0z`, h),
    bob: cap + R(x - 13, hy - 1, 5, 10, 2.5, h) + R(x + 8, hy - 1, 5, 10, 2.5, h),
    long: cap + R(x - 13, hy - 1, 4.5, 10, 2.2, h) + R(x + 8.5, hy - 1, 4.5, 10, 2.2, h),
    twin: cap + C(x - 14, hy + 3, 4.5, h) + C(x + 14, hy + 3, 4.5, h) + R(x - 13, hy - 1, 3, 5, 1, '#e0556f') + R(x + 10, hy - 1, 3, 5, 1, '#e0556f'),
  }[hs] || cap;
  // 뒷머리는 몸 뒤에 그려서 옷을 가리지 않고, 앞머리 옆선은 턱 높이에서 끝난다
  return defs + back + legs + body + R(x - 3, y - 32, 6, 5, 2, skin) + C(x, hy, 11, skin) + front +
    `<circle cx="${x - 6.2}" cy="${hy + 4}" r="2.4" fill="#f4a09a" opacity=".55"/><circle cx="${x + 6.2}" cy="${hy + 4}" r="2.4" fill="#f4a09a" opacity=".55"/>` +
    `<ellipse cx="${x - 4}" cy="${hy + 1.5}" rx="1.5" ry="1.9" fill="#4a2e22"/><ellipse cx="${x + 4}" cy="${hy + 1.5}" rx="1.5" ry="1.9" fill="#4a2e22"/>` +
    `<path d="M${x - 2.8} ${hy + 5.8} q2.8 3 5.6 0" stroke="#d1475a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
}
// 프로필 카드용 상반신(얼굴·어깨만 보이게 잘라 쓴다)
const bustSvg = (a = state.avatar) => `<svg viewBox="-27 -57 54 52" width="112" height="108" aria-hidden="true">${figure(0, 0, a)}</svg>`;
// 아바타와 말풍선(글은 2줄·줄당 12자). 방 가운데 러그 위에 서 있다.
function avatarSvg(a = state.avatar, text = state.say) {
  const [x, y] = P(100, 106), say = (text || '').trim();
  let s = `<g transform="translate(${x} ${y}) scale(1.3) translate(${-x} ${-y})"><ellipse cx="${x}" cy="${y}" rx="11" ry="4" fill="#0002"/>${figure(x, y, a)}</g>`;
  if (say) {
    const lines = [say.slice(0, 12), say.slice(12, 24)].filter(Boolean);
    const w = Math.max(...lines.map(l => [...l].length)) * 11 + 18, h = lines.length * 14 + 10;
    const bx = Math.max(16, Math.min(464 - w, x - w / 2)), by = y - 72 - h;
    s += `<polygon points="${x - 5},${by + h} ${x + 5},${by + h} ${x},${by + h + 8}" fill="#fff" stroke="#c9b8a8"/>
      <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="9" fill="#fff" stroke="#c9b8a8"/>
      <rect x="${x - 6}" y="${by + h - 1}" width="12" height="3" fill="#fff"/>` +
      lines.map((l, i) => `<text x="${bx + w / 2}" y="${by + 15 + i * 14}" font-size="11" font-weight="600" text-anchor="middle" fill="#3a3330" font-family="Pretendard, sans-serif">${escSvg(l)}</text>`).join('');
  }
  return `<g class="avatar-g">${s}</g>`;
}
const xfStyle = p => (p ? `transform:translate(${p.x || 0}px,${p.y || 0}px) scaleX(${p.f ? -1 : 1})` : '');
// px: 한 화면에 방이 둘(홈·상점) 있어 패턴 id가 겹치지 않게 붙이는 접두어
// over: 상점 미리보기용 { wall, floor, add } — 안 산 물건도 임시로 놓아 본다
function roomSvg(px, over = {}) {
  // over.ids: 친구 방처럼 놓인 물건 목록을 통째로 지정(내 소유·끄기 설정을 보지 않음)
  const wk = over.wall || state.wall, fk = over.floor || state.floor, wl = WALLS[wk];
  const pats = Object.entries({ ...prefix(px + 'w-', WALLS), ...prefix(px + 'f-', FLOORS) }).map(([id, p]) =>
    `<pattern id="${id}" width="${p.w}" height="${p.h}" patternUnits="userSpaceOnUse">${p.mark}</pattern>`).join('');
  const wall = (pts4, shade) => `<polygon points="${pts(pts4)}" fill="${wl.base}"/><polygon points="${pts(pts4)}" fill="url(#${px}w-${wk})"/>` +
    `<polygon points="${pts(pts4)}" fill="#000" opacity="${shade}" stroke="#0003"/>`;
  const list = ITEMS.filter(i => over.ids ? over.ids.includes(i.id) : over.add === i.id || ((!i.shop || own(i.id)) && !state.off.includes(i.id))).sort((a, b) => a.layer - b.layer);
  // 책장은 마우스를 올리면 읽은 책 목록이 뜨는 영역. 아바타는 책상(5~6)까지 그린 뒤, 의자 앞에 선다.
  const draw = i => i.id === 'shelf' ? `<g class="shelf-hit" tabindex="0" role="img" aria-label="책장 — 읽은 책 목록 보기">${i.draw(over.books, list)}</g>` : i.draw(over.books, list);
  // 가구마다 옮김·돌림·뒤집기(pos: x, y, r, f)를 CSS 변환으로 얹는다
  const wrap = i => `<g class="itm" data-id="${i.id}" style="${xfStyle((over.pos && over.pos[i.id]) || (over.ids ? null : state.pos[i.id]))}">${draw(i)}</g>`;
  const items = list.filter(i => i.layer <= 6.1).map(wrap).join('') + (over.noAvatar ? '' : over.avatar ? avatarSvg(over.avatar, over.say) : avatarSvg()) + list.filter(i => i.layer > 6.1).map(wrap).join('');
  // 방이 틀 전체를 채우도록 벽·바닥을 화면 밖까지 늘려 그린다(점토 느낌: 모서리 그늘, 걸레받이)
  const E = 330, H = 420;
  const L = [P(0, 0, H), P(0, E, H), P(0, E), P(0, 0)], Rw = [P(0, 0, H), P(E, 0, H), P(E, 0), P(0, 0)];
  const base = a => `<polygon points="${pts(a)}" fill="#fff" opacity=".55"/>`;
  return `<svg viewBox="10 30 460 290" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${pats}<radialGradient id="clay" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
      <linearGradient id="${px}gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
      <linearGradient id="${px}gr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
      <linearGradient id="${px}gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient></defs>
    <polygon points="${pts([P(0, 0), P(E, 0), P(E, E), P(0, E)])}" fill="url(#${px}f-${fk})"/>
    <polygon points="${pts([P(0, 0), P(E, 0), P(E, E), P(0, E)])}" fill="url(#${px}gf)"/>
    ${wall(L, 0.08)}<polygon points="${pts(L)}" fill="url(#${px}gl)"/>
    ${wall(Rw, 0)}<polygon points="${pts(Rw)}" fill="url(#${px}gr)"/>
    ${base([P(0, 0, 7), P(0, E, 7), P(0, E), P(0, 0)])}${base([P(0, 0, 7), P(E, 0, 7), P(E, 0), P(0, 0)])}
    ${items}</svg>`;
}
const room = () => (document.getElementById('room').innerHTML = roomSvg('h-'));
// 상점 화면이 쓰는 창구: 구매하면 방에 바로 놓이고(벽지·바닥은 바로 적용) 저장한다
window.ROOM = {
  bust: bustSvg,
  xfStyle, draft: {}, pos: id => ({ x: 0, y: 0, r: 0, f: 0, ...state.pos[id] }),
  setPos(id, p) { if (p) state.pos[id] = p; else delete state.pos[id]; save(); render(); },
  // 지금 방에 놓인(보이는) 가구 목록
  shown: () => ITEMS.filter(i => (!i.shop || own(i.id)) && !state.off.includes(i.id)).map(i => [i.id, i.label]),
  roomSvg, ITEMS, WALLS, FLOORS, own, HAS_VAR, spriteKey, varCount,
  variant: id => variants[id] || 1,
  setVariant(id, n) { variants[id] = n; try { localStorage.setItem(VAR_KEY, JSON.stringify(variants)); } catch {} render(); },
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

document.getElementById('reset').onclick = () => { Object.assign(state, { wall: 'cream', floor: 'wood', off: [], pos: {} }); save(); render(); };
document.getElementById('ver').textContent = 'v' + APP_VERSION;
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

// '내 방 꾸미기'(ctrl)와 '설정'(setp) 패널은 하나만 열린다
function panel(btnId, panelId, otherBtn, otherPanel) {
  const b = document.getElementById(btnId), p = document.getElementById(panelId);
  b.onclick = () => {
    p.hidden = !p.hidden;
    document.getElementById(otherPanel).hidden = true;
    b.setAttribute('aria-expanded', !p.hidden);
    document.getElementById(otherBtn).setAttribute('aria-expanded', 'false');
  };
}
panel('deco', 'ctrl', 'setBtn', 'setp');
panel('setBtn', 'setp', 'deco', 'ctrl');

// 설정: 말풍선 글, 머리색, 옷색
const HAIRS = ['#6b3f2a', '#222222', '#c98a3c', '#e07a9a'], TOPS = ['#e0556f', '#5b86e5', '#4f9d69', '#f2b84b'];
function swatches(id, colors, key) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  colors.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sw'; b.style.background = c; b.setAttribute('aria-label', c);
    b.setAttribute('aria-pressed', state.avatar[key] === c);
    b.onclick = () => { state.avatar[key] = c; save(); swatches(id, colors, key); room(); applyProfile(); };
    el.append(b);
  });
}
const sayIn = document.getElementById('sayIn');
sayIn.value = state.say;
sayIn.oninput = () => { state.say = sayIn.value.slice(0, 24); save(); room(); };
// 스타일 버튼(머리·옷)과 프로필 이름 반영
function styleBtns(id, list, key) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  list.forEach(([k, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', (state.avatar[key] || list[0][0]) === k);
    b.onclick = () => { state.avatar[key] = k; save(); styleBtns(id, list, key); room(); applyProfile(); };
    el.append(b);
  });
}
const $p = id => document.getElementById(id);
const nameIn = $p('nameIn'), titleIn = $p('titleIn'), pMsg = $p('pMsg');
const FRIEND_NAMES = ['고양이문고', '구름빵집', '바다유리', '새벽세시', '책갈피탐험가', '초록연필', '해바라기'];
function applyProfile() {
  const title = profile.title.trim() || `${profile.name}의 서재`;
  $p('profTitle').textContent = title;
  document.title = `${title} | BOOK FLEX`;
  $p('nickName').textContent = profile.name;
  $p('profAvatar').innerHTML = bustSvg();
  document.querySelectorAll('.myname').forEach(e => (e.textContent = profile.name));
}
function saveName(inp, key, max) {
  const v = inp.value.trim().slice(0, max);
  if (key === 'name') {
    if (!v) { pMsg.textContent = '닉네임을 한 글자 이상 적어 주세요.'; return; }
    if (FRIEND_NAMES.includes(v)) { pMsg.textContent = '같은 반 친구가 쓰는 이름이에요. 다른 이름을 골라 주세요.'; return; }
  }
  profile[key] = v;
  pMsg.textContent = '';
  try { localStorage.setItem(PROF_KEY, JSON.stringify(profile)); } catch {}
  applyProfile();
  document.dispatchEvent(new Event('bf:change'));
}
nameIn.value = profile.name; titleIn.value = profile.title;
nameIn.oninput = () => saveName(nameIn, 'name', 10);
titleIn.oninput = () => saveName(titleIn, 'title', 16);
titleIn.placeholder = '비우면 "닉네임의 서재"';
// 프로필 카드의 '프로필 바꾸기'는 설정 패널을 열어 이름 칸으로 보낸다
$p('profEdit').onclick = e => {
  e.preventDefault();
  $p('setp').hidden = false; $p('ctrl').hidden = true;
  $p('setBtn').setAttribute('aria-expanded', 'true'); $p('deco').setAttribute('aria-expanded', 'false');
  nameIn.scrollIntoView({ block: 'center' }); nameIn.focus();
};
styleBtns('hstyles', HAIR_STYLES, 'hs');
styleBtns('ostyles', OUTFITS, 'os');
swatches('hairs', HAIRS, 'hair');
swatches('tops', TOPS, 'top');
applyProfile();

// 책장에 마우스(또는 키보드 포커스)를 올리면 내가 읽은 책 목록
const tip = document.getElementById('shelfTip'), wrap = tip.parentElement;
function showTip(e) {
  const books = window.BF ? window.BF.books() : [];
  tip.innerHTML = `<b>내가 읽은 책</b><ul>${books.map(b => `<li>${escSvg(b.t)} <small>${escSvg(b.s)}</small></li>`).join('')}</ul>`;
  tip.hidden = false;
  const r = wrap.getBoundingClientRect(), t = e.target.getBoundingClientRect();
  const cx = e.clientX || t.left + t.width / 2, cy = e.clientY || t.top;
  tip.style.left = `${Math.max(6, Math.min(r.width - tip.offsetWidth - 6, cx - r.left + 14))}px`;
  tip.style.top = `${Math.max(6, Math.min(r.height - tip.offsetHeight - 6, cy - r.top + 10))}px`;
}
const hit = e => e.target.closest && e.target.closest('.shelf-hit');
const roomEl = document.getElementById('room');
roomEl.addEventListener('mousemove', e => (hit(e) ? showTip(e) : (tip.hidden = true)));
roomEl.addEventListener('mouseleave', () => (tip.hidden = true));
roomEl.addEventListener('focusin', e => hit(e) && showTip(e));
roomEl.addEventListener('focusout', () => (tip.hidden = true));

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
document.querySelectorAll('.themes button').forEach(b => (b.onclick = () => setTheme(b.dataset.t)));
try { const t = localStorage.getItem(THEME_KEY); if (['cy', 'peach', 'green'].includes(t)) setTheme(t); } catch {}
render();
// 책장의 책 수는 독서 기록(log.js)이 로드된 뒤, 그리고 기록이 바뀔 때마다 다시 그린다
window.addEventListener('load', room);
document.addEventListener('bf:change', room);
