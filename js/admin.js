import { store, DEMO } from './store.js';
import { OWNER_EMAIL } from './config.js';
import { esc, normalize, uid, STATUS } from './common.js';
import { TEMPLATE } from './demo-data.js';
import { createClientsUI } from './admin-clients.js';

const S = await store;
const app = document.getElementById('app');
const CL = createClientsUI({ S, toast: (m, e) => toast(m, e) });
app.addEventListener('click', e => CL.onClick(e));
app.addEventListener('input', e => CL.onInput(e));

let state = null;
let user = null;
let wasEmpty = false;
let tab = 'settings';
const dirty = { settings: false, content: false, categories: false };
const pendingDel = { settings: [], content: [], categories: [] };
let removedCats = [];
const openSet = new Set();

const TABS = [
  ['settings', '網站設定'],
  ['price', '價目表'],
  ['addons', '加價項目'],
  ['process', '流程與付款'],
  ['rules', '委託須知'],
  ['faq', '常見問題'],
  ['about', '關於與聯絡'],
  ['clients', '客戶與點數'],
];

// ================= 登入 =================
S.onAuth(async u => {
  user = u;
  if (!u) return renderLogin();
  if (!DEMO && (u.email || '').toLowerCase() !== OWNER_EMAIL.toLowerCase()) return renderDenied();
  app.innerHTML = '<div class="center"><p class="muted">讀取中…</p></div>';
  try {
    const d = await S.loadAll();
    wasEmpty = d.empty;
    state = { settings: d.settings, content: d.content, categories: d.categories };
    renderApp();
  } catch (e) {
    app.innerHTML = `<div class="center"><div class="login-card"><h1>讀取失敗</h1><p class="err">${esc(e.message)}</p><p class="muted">請確認 Firestore 已建立，且安全規則已發布。</p><button class="btn" data-act="logout">登出</button></div></div>`;
  }
});

function renderLogin() {
  app.innerHTML = `
    <div class="center"><div class="login-card">
      <p class="eyebrow">ADMIN</p>
      <h1>委託價目表・後台</h1>
      ${DEMO ? '<p class="muted">目前是示範模式（尚未設定 Firebase），按下登入即可試用，資料只會存在這台瀏覽器。</p>' : '<p class="muted">僅限站主帳號登入。</p>'}
      <button class="btn" data-act="login">以 Google 帳號登入</button>
      <p><a class="muted" href="index.html">← 回到前台</a></p>
    </div></div>`;
}
function renderDenied() {
  app.innerHTML = `
    <div class="center"><div class="login-card">
      <h1>沒有權限</h1>
      <p class="muted">${esc(user.email)} 不是這個網站的管理帳號。</p>
      <button class="btn" data-act="logout">登出</button>
    </div></div>`;
}

// ================= 主畫面 =================
function renderApp() {
  app.innerHTML = `
    <header class="topbar">
      <div class="tb-left"><b>${esc(state.settings.siteName || '委託價目表')}</b><span class="tag">後台</span>${DEMO ? '<span class="tag demo">示範模式</span>' : ''}</div>
      <div class="tb-right">
        <span class="who">${esc(user.email || '')}</span>
        <a class="btn ghost sm" href="index.html" target="_blank">查看前台 ↗</a>
        <button class="btn sm" id="saveBtn" data-act="save">儲存變更</button>
        <button class="btn ghost sm" data-act="logout">登出</button>
      </div>
    </header>
    <div class="layout">
      <nav class="side" id="side"></nav>
      <section class="panel" id="panel"></section>
    </div>
    <div class="toast" id="toast"></div>`;
  renderSide();
  renderPanel();
  updateSaveBtn();
}

function renderSide() {
  document.getElementById('side').innerHTML = TABS.map(([k, l]) => `<button data-act="tab" data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('');
}

function renderPanel() {
  const p = document.getElementById('panel');
  const y = window.scrollY;
  p.innerHTML = (wasEmpty && !DEMO ? `
    <div class="banner">資料庫目前是空的。可以直接開始填寫，或先 <button class="linkbtn" data-act="import">匯入範本內容</button> 再修改。</div>` : '') + PANELS[tab]();
  hydrate(p);
  if (tab === 'clients') CL.mount(document.getElementById('cl-root'));
  window.scrollTo(0, y);
}

// ================= 欄位元件 =================
const get = path => path.split('.').reduce((o, k) => (o == null ? o : o[k]), state);
function set(path, v) {
  const ks = path.split('.');
  const last = ks.pop();
  const o = ks.reduce((o, k) => o[k], state);
  o[last] = v;
  mark(path);
}
const rootOf = path => path.split('.')[0];
function mark(path) { dirty[rootOf(path)] = true; updateSaveBtn(); }

const hint = h => (h ? `<small class="hint">${h}</small>` : '');
const f = {
  text: (p, label, o = {}) => `<label class="fld ${o.cls || ''}"><span>${label}</span><input type="text" data-bind="${p}" value="${esc(get(p) ?? '')}" placeholder="${esc(o.ph || '')}">${hint(o.hint)}</label>`,
  num: (p, label, o = {}) => `<label class="fld ${o.cls || ''}"><span>${label}</span><input type="number" min="0" step="any" data-bind="${p}" value="${get(p) ?? ''}" placeholder="${esc(o.ph || '')}">${hint(o.hint)}</label>`,
  area: (p, label, o = {}) => `<label class="fld ${o.cls || ''}"><span>${label}</span><textarea rows="${o.rows || 4}" data-bind="${p}" placeholder="${esc(o.ph || '')}">${esc(get(p) ?? '')}</textarea>${hint(o.hint)}</label>`,
  check: (p, label) => `<label class="chk"><input type="checkbox" data-bind="${p}" ${get(p) !== false ? 'checked' : ''}><span>${label}</span></label>`,
  select: (p, label, opts, o = {}) => `<label class="fld ${o.cls || ''}"><span>${label}</span><select data-bind="${p}">${opts.map(([v, t]) => `<option value="${v}" ${get(p) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>${hint(o.hint)}</label>`,
  color: (p, label) => `<label class="fld"><span>${label}</span><span class="color-row"><input type="color" data-bind="${p}" value="${esc(get(p) || '#AAA55A')}"><code>${esc(get(p) || '')}</code></span></label>`,
  img: (p, label) => {
    const id = get(p);
    return `<div class="fld"><span>${label}</span><div class="img-single">
      ${id ? `<div class="thumb"><img data-thumb="${esc(id)}"><button class="x" data-act="img-clear" data-path="${p}" title="移除">×</button></div>` : '<div class="thumb empty">無</div>'}
      <label class="btn ghost sm upl">上傳<input type="file" accept="image/*" data-upload-single="${p}" hidden></label>
    </div></div>`;
  },
  imgs: (p, label = '範例圖片') => {
    const ids = get(p) || [];
    return `<div class="fld"><span>${label}<small class="hint inline">第一張會當作封面，點圖片下的箭頭可調整順序</small></span><div class="img-list">
      ${ids.map((id, i) => `<div class="thumb"><img data-thumb="${esc(id)}">
        <div class="thumb-bar">
          <button data-act="img-move" data-path="${p}" data-idx="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>‹</button>
          <button data-act="img-del" data-path="${p}" data-idx="${i}" title="刪除">×</button>
          <button data-act="img-move" data-path="${p}" data-idx="${i}" data-dir="1" ${i === ids.length - 1 ? 'disabled' : ''}>›</button>
        </div></div>`).join('')}
      <label class="thumb add">＋<small>上傳圖片</small><input type="file" accept="image/*" multiple data-upload="${p}" hidden></label>
    </div></div>`;
  },
};

function rowTools(path, i, len, title = '') {
  return `<div class="row-tools">${title ? `<span class="row-title">${title}</span>` : ''}
    <button class="ib" data-act="up" data-path="${path}" data-idx="${i}" ${i === 0 ? 'disabled' : ''} title="上移">↑</button>
    <button class="ib" data-act="down" data-path="${path}" data-idx="${i}" ${i === len - 1 ? 'disabled' : ''} title="下移">↓</button>
    <button class="ib danger" data-act="del" data-path="${path}" data-idx="${i}" title="刪除">刪除</button>
  </div>`;
}
function list(path, renderRow, addLabel, titleOf = () => '') {
  const arr = get(path) || [];
  return `<div class="list">
    ${arr.map((x, i) => `<div class="row">${rowTools(path, i, arr.length, titleOf(x, i))}${renderRow(`${path}.${i}`, x, i)}</div>`).join('')}
    <button class="add-btn" data-act="add" data-path="${path}">＋ ${addLabel}</button>
  </div>`;
}
const head = (t, d = '') => `<div class="ph"><h2>${t}</h2>${d ? `<p class="muted">${d}</p>` : ''}</div>`;
const card = (t, body) => `<div class="card">${t ? `<h3>${t}</h3>` : ''}${body}</div>`;
const RICH_HINT = '空一行換段；以「- 」開頭為條列；**文字** 為粗體';

// ================= 各分頁 =================
const PANELS = {
  settings: () => head('網站設定', '網站名稱、接案狀態與首頁公告。') +
    card('基本資料', `<div class="grid2">
      ${f.text('settings.siteName', '網站名稱')}
      ${f.text('settings.subtitle', '副標題', { ph: '例：插圖・角色設定' })}
    </div>
    <div class="grid2">${f.img('settings.logo', 'Logo（可不放）')}${f.color('settings.accent', '主題色')}</div>
    ${f.text('settings.footerText', '頁尾文字', { ph: '例：本站內容請勿轉載' })}`) +
    card('首頁封面與跑馬燈', `
      ${f.text('settings.marquee', '跑馬燈文字', { ph: '/// COMMISSION OPEN /// 1 月檔期剩 2 名 ///', hint: '顯示在每一頁最上方，留空會自動用網站名稱與狀態' })}
      <div class="grid2">${f.text('settings.heroTitle', '封面大標', { ph: 'COMMISSION', hint: '第一個字母後面會加上主題色的 ✸' })}${f.img('settings.heroImage', '封面圖（建議橫幅 1600×500 以上）')}</div>`) +
    card('接案狀態', `<div class="grid2">
      ${f.select('settings.status', '狀態', Object.entries(STATUS).map(([k, v]) => [k, v.label]))}
      ${f.text('settings.statusText', '狀態說明', { ph: '例：1 月檔期剩 2 名' })}
    </div>`) +
    card('首頁公告', f.area('settings.announcement', '公告內容', { rows: 6, hint: RICH_HINT })) +
    card('商用價格', `<div class="grid2">
      ${f.num('settings.commercialRate', '商用倍率', { ph: '例：2', hint: '填了之後，價目表每個項目會自動顯示「商用 NT$…」；留空就不顯示' })}
    </div>${f.area('settings.commercialNote', '商用說明（顯示在價目表下方）', { rows: 3 })}`),

  price: () => head('價目表', '類別 → 項目。價格只填數字；「單位/後綴」例如「起」「/ 千字」；只填後綴不填價格會顯示成那段文字（例如「另議」）。') +
    `<div class="list cats">
      ${state.categories.map((c, i) => {
        const cp = `categories.${i}`;
        const open = openSet.has(c.id);
        return `<details class="cat-card" data-open-id="${esc(c.id)}" ${open ? 'open' : ''}>
          <summary><span class="cat-sum">${String(i + 1).padStart(2, '0')}　${esc(c.name || '（未命名類別）')}</span>
            <span class="muted sm">${c.items.length} 個項目${c.visible === false ? '・已隱藏' : ''}</span></summary>
          ${rowTools('categories', i, state.categories.length)}
          <div class="grid2">${f.text(`${cp}.name`, '類別名稱')}${f.text(`${cp}.desc`, '簡短說明')}</div>
          ${f.area(`${cp}.notes`, '類別備註（顯示在項目下方）', { rows: 2, hint: RICH_HINT })}
          ${f.check(`${cp}.visible`, '在前台顯示這個類別')}
          <h4 class="sub">項目</h4>
          ${list(`${cp}.items`, (ip) => `
            <div class="grid3">
              ${f.text(`${ip}.name`, '項目名稱')}
              ${f.text(`${ip}.spec`, '規格', { ph: '例：A4・300dpi／3,000 字以內', cls: 'span2' })}
            </div>
            <div class="grid3">
              ${f.num(`${ip}.price`, '價格 NT$', { ph: '1500' })}
              ${f.num(`${ip}.priceTo`, '最高價（區間用，可不填）')}
              ${f.text(`${ip}.suffix`, '單位/後綴', { ph: '起' })}
            </div>
            ${f.area(`${ip}.desc`, '說明', { rows: 2, hint: RICH_HINT })}
            ${f.imgs(`${ip}.images`)}
            ${f.check(`${ip}.visible`, '在前台顯示這個項目')}
          `, '新增項目', x => esc(x.name || '（未命名項目）'))}
        </details>`;
      }).join('')}
      <button class="add-btn" data-act="add" data-path="categories">＋ 新增類別</button>
    </div>`,

  addons: () => head('加價項目', '顯示在價目表最下方。') +
    card('', f.text('content.addonsNote', '加價說明', { ph: '例：加價以基本價格計算，可疊加' })) +
    list('content.addons', (p) => `
      <div class="grid3">
        ${f.text(`${p}.name`, '項目名稱')}
        ${f.select(`${p}.mode`, '計價方式', [['fixed', '固定金額 +NT$'], ['percent', '百分比 +%'], ['text', '文字（如：另議）']])}
        ${get(p + '.mode') === 'text' ? f.text(`${p}.priceText`, '顯示文字', { ph: '另議' }) : f.num(`${p}.price`, get(p + '.mode') === 'percent' ? '百分比 %' : '金額 NT$')}
      </div>
      ${f.text(`${p}.note`, '備註（小字）')}`, '新增加價項目', x => esc(x.name || '')),

  process: () => head('流程與付款', '顯示在〈委託須知〉最上方。') +
    card('委託流程', list('content.process', p => `<div class="grid2">${f.text(`${p}.title`, '步驟名稱')}${f.text(`${p}.desc`, '說明')}</div>`, '新增步驟', (x, i) => `步驟 ${i + 1}`)) +
    card('付款方式', list('content.payment', p => `<div class="grid2">${f.text(`${p}.name`, '方式')}${f.text(`${p}.note`, '備註')}</div>`, '新增付款方式') +
      f.area('content.paymentNote', '付款說明', { rows: 3, hint: RICH_HINT })),

  rules: () => head('委託須知', '每個段落會出現在前台目錄裡。') +
    list('content.rules', p => `${f.text(`${p}.title`, '段落標題')}${f.area(`${p}.body`, '內容', { rows: 7, hint: RICH_HINT })}`, '新增段落', x => esc(x.title || '')),

  faq: () => head('常見問題') +
    list('content.faqs', p => `${f.text(`${p}.q`, '問題')}${f.area(`${p}.a`, '回答', { rows: 3, hint: RICH_HINT })}`, '新增問題', (x, i) => `Q${i + 1}`),

  clients: () => head('客戶與點數', '客戶用 Google 登入〈會員查詢〉頁，只看得到自己的紀錄與點數。這一頁的新增、修改會立即存檔。') +
    '<div id="cl-root"></div>' +
    card('會員頁說明文字（按右上角「儲存變更」）',
      f.area('content.memberNote', '點數規則', { rows: 4, hint: RICH_HINT }) +
      f.area('content.privacyNote', '資料與隱私說明', { rows: 3, hint: '建議寫明保存哪些資料、用途、如何申請刪除' })),

  about: () => head('關於與聯絡') +
    card('自我介紹', `<div class="grid2">${f.img('content.about.avatar', '頭像')}${f.text('content.about.name', '名稱')}</div>
      ${f.area('content.about.bio', '介紹', { rows: 4, hint: RICH_HINT })}
      <h4 class="sub">社群連結</h4>
      ${list('content.about.links', p => `<div class="grid2">${f.text(`${p}.label`, '名稱', { ph: 'Plurk' })}${f.text(`${p}.url`, '網址', { ph: 'https://' })}</div>`, '新增連結')}`) +
    card('委託聯絡', `${f.text('content.about.email', '委託信箱')}${f.area('content.about.contactNote', '聯絡說明', { rows: 4, hint: RICH_HINT })}`) +
    card('謹防詐騙・官方帳號', `${f.area('content.about.officialNote', '說明', { rows: 3 })}
      ${list('content.about.official', p => `<div class="grid2">${f.text(`${p}.platform`, '平台')}${f.text(`${p}.account`, '帳號')}</div>`, '新增帳號')}`),
};

// ================= 新增項目的範本 =================
function blank(path) {
  const key = path.split('.').filter(k => isNaN(k)).pop();
  return ({
    categories: () => ({ id: uid(), name: '新類別', desc: '', notes: '', visible: true, items: [] }),
    items: () => ({ id: uid(), name: '', spec: '', price: null, priceTo: null, suffix: '起', desc: '', images: [], visible: true }),
    addons: () => ({ id: uid(), name: '', mode: 'fixed', price: null, priceText: '', note: '' }),
    process: () => ({ title: '', desc: '' }),
    payment: () => ({ name: '', note: '' }),
    rules: () => ({ id: uid(), title: '', body: '' }),
    faqs: () => ({ id: uid(), q: '', a: '' }),
    links: () => ({ label: '', url: '' }),
    official: () => ({ platform: '', account: '' }),
  })[key]();
}

function imagesIn(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'images' && Array.isArray(v)) out.push(...v);
    else if ((k === 'logo' || k === 'avatar' || k === 'heroImage') && typeof v === 'string' && v) out.push(v);
    else if (typeof v === 'object') imagesIn(v, out);
  }
  return out;
}
const queueDel = (path, ids) => pendingDel[rootOf(path)].push(...ids.filter(id => !id.startsWith('demo-')));

// ================= 事件 =================
app.addEventListener('input', e => {
  const el = e.target.closest('[data-bind]');
  if (!el) return;
  const v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
  set(el.dataset.bind, v);
  if (el.type === 'color') el.nextElementSibling.textContent = v;
  if (el.tagName === 'SELECT' && el.dataset.bind.endsWith('.mode')) renderPanel();
});

app.addEventListener('toggle', e => {
  const d = e.target;
  if (d.dataset?.openId) d.open ? openSet.add(d.dataset.openId) : openSet.delete(d.dataset.openId);
}, true);

app.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const { act, path } = b.dataset;
  const i = Number(b.dataset.idx);
  const arr = path ? get(path) : null;
  switch (act) {
    case 'login': try { await S.signIn(); } catch (err) { toast('登入失敗：' + err.message, true); } return;
    case 'logout':
      if (Object.values(dirty).some(Boolean) && !confirm('還有未儲存的變更，確定要登出？')) return;
      Object.keys(dirty).forEach(k => (dirty[k] = false));
      return S.signOut();
    case 'save': return save();
    case 'tab': tab = b.dataset.tab; renderSide(); renderPanel(); window.scrollTo(0, 0); return;
    case 'import':
      if (!confirm('匯入範本會填入範例內容（不含圖片），之後可自由修改。確定？')) return;
      Object.assign(state, normalize(JSON.parse(JSON.stringify(TEMPLATE))));
      delete state.empty;
      wasEmpty = false;
      Object.keys(dirty).forEach(k => (dirty[k] = true));
      updateSaveBtn(); renderApp(); toast('已匯入範本，記得按「儲存變更」');
      return;
    case 'add': {
      const item = blank(path);
      arr.push(item);
      if (path === 'categories') openSet.add(item.id);
      break;
    }
    case 'del': {
      if (!confirm('確定刪除？（儲存後才會真正刪除）')) return;
      const [rm] = arr.splice(i, 1);
      queueDel(path, imagesIn(rm));
      if (path === 'categories') removedCats.push(rm.id);
      break;
    }
    case 'up': if (i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; break;
    case 'down': if (i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; break;
    case 'img-move': { const j = i + Number(b.dataset.dir); [arr[i], arr[j]] = [arr[j], arr[i]]; break; }
    case 'img-del': if (!confirm('刪除這張圖片？')) return; queueDel(path, arr.splice(i, 1)); break;
    case 'img-clear': queueDel(path, [get(path)]); set(path, ''); break;
    default: return;
  }
  mark(path);
  renderPanel();
});

app.addEventListener('change', async e => {
  const inp = e.target;
  const multi = inp.dataset.upload, single = inp.dataset.uploadSingle;
  if (!multi && !single) return;
  const files = [...inp.files];
  if (!files.length) return;
  const label = inp.closest('label');
  label.classList.add('busy');
  try {
    for (const [n, file] of files.entries()) {
      toast(`上傳中 ${n + 1} / ${files.length}…`);
      const id = await S.uploadImage(file);
      if (multi) get(multi).push(id);
      else { const old = get(single); if (old) queueDel(single, [old]); set(single, id); }
    }
    mark(multi || single);
    toast('上傳完成，記得按「儲存變更」');
  } catch (err) {
    console.error(err);
    toast('上傳失敗：' + err.message, true);
  }
  renderPanel();
});

window.addEventListener('beforeunload', e => {
  if (Object.values(dirty).some(Boolean)) { e.preventDefault(); e.returnValue = ''; }
});

// ================= 儲存 =================
async function save() {
  const btn = document.getElementById('saveBtn');
  if (!Object.values(dirty).some(Boolean)) return toast('沒有需要儲存的變更');
  btn.disabled = true; btn.textContent = '儲存中…';
  try {
    if (dirty.settings) await S.saveSettings(state.settings);
    if (dirty.content) await S.saveContent(state.content);
    if (dirty.categories) { await S.saveCategories(state.categories, removedCats); removedCats = []; }
    for (const root of Object.keys(dirty)) {
      if (!dirty[root]) continue;
      for (const id of pendingDel[root]) await S.deleteImage(id).catch(() => {});
      pendingDel[root] = [];
      dirty[root] = false;
    }
    wasEmpty = false;
    toast('已儲存 ✓');
    document.querySelector('.tb-left b').textContent = state.settings.siteName || '委託價目表';
    if (document.querySelector('.banner')) renderPanel();
  } catch (err) {
    console.error(err);
    toast('儲存失敗：' + err.message, true);
  }
  btn.disabled = false;
  updateSaveBtn();
}

function updateSaveBtn() {
  const btn = document.getElementById('saveBtn');
  if (!btn) return;
  const d = Object.values(dirty).some(Boolean);
  btn.classList.toggle('pulse', d);
  btn.textContent = d ? '儲存變更 •' : '已儲存';
}

let toastT;
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast'), err ? 6000 : 2600);
}

function hydrate(root) {
  root.querySelectorAll('img[data-thumb]').forEach(async img => {
    const src = await S.getThumb(img.dataset.thumb);
    if (src) img.src = src;
  });
}
