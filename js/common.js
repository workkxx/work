// ---------- 預設資料結構 ----------
export const DEFAULTS = {
  settings: {
    siteName: '委託價目表', subtitle: '', status: 'closed', statusText: '', announcement: '',
    accent: '#AAA55A', logo: '', footerText: '', commercialRate: null, commercialNote: '',
    marquee: '', heroTitle: 'COMMISSION', heroImage: '',
  },
  content: {
    process: [], payment: [], paymentNote: '',
    rules: [], faqs: [], addons: [], addonsNote: '', memberNote: '', privacyNote: '',
    about: { name: '', bio: '', avatar: '', links: [], email: '', contactNote: '', official: [], officialNote: '' },
  },
};

export const STATUS = {
  open: { label: '開放中', en: 'OPEN' },
  waitlist: { label: '候補中', en: 'WAITLIST' },
  closed: { label: '暫停接案', en: 'CLOSED' },
};

const clone = o => JSON.parse(JSON.stringify(o));

export function normalize(d = {}) {
  const D = clone(DEFAULTS);
  const content = { ...D.content, ...(d.content || {}) };
  content.about = { ...D.content.about, ...((d.content && d.content.about) || {}) };
  return {
    settings: { ...D.settings, ...(d.settings || {}) },
    content,
    categories: (d.categories || []).map(c => ({
      id: c.id || uid(), name: '', desc: '', notes: '', visible: true, ...c,
      items: (c.items || []).map(it => ({ id: it.id || uid(), images: [], visible: true, suffix: '', ...it })),
    })),
    empty: !!d.empty,
  };
}

// 移除 undefined（Firestore 不接受）
export const clean = v => JSON.parse(JSON.stringify(v));

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

// ---------- 文字處理 ----------
export function esc(s = '') {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 簡易排版：空行分段、「- 」開頭為條列、**粗體**
export function rich(text = '') {
  const lines = esc(text).split(/\r?\n/);
  let html = '', list = null, para = [];
  const fp = () => { if (para.length) { html += `<p>${para.join('<br>')}</p>`; para = []; } };
  const fl = () => { if (list) { html += `<ul>${list.map(l => `<li>${l}</li>`).join('')}</ul>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { fp(); fl(); continue; }
    const m = l.match(/^[-・•]\s*(.*)$/);
    if (m) { fp(); (list ||= []).push(m[1]); } else { fl(); para.push(l); }
  }
  fp(); fl();
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export const fmt = n => Number(n).toLocaleString('zh-TW');
const has = n => n !== null && n !== undefined && n !== '' && !Number.isNaN(Number(n));

export function priceHTML(it) {
  if (!has(it.price)) {
    const t = (it.suffix || '').trim();
    return `<span class="price-ask">${esc(!t || t === '起' ? '另議' : t)}</span>`;
  }
  let s = `<span class="cur">NT$</span><span class="num">${fmt(it.price)}</span>`;
  if (has(it.priceTo)) s += `<span class="dash">–</span><span class="num">${fmt(it.priceTo)}</span>`;
  if (it.suffix) s += `<span class="suf">${esc(it.suffix)}</span>`;
  return s;
}

export function addonPrice(a) {
  if (a.mode === 'percent' && has(a.price)) return `+${fmt(a.price)}%`;
  if (a.mode === 'fixed' && has(a.price)) return `+NT$ ${fmt(a.price)}`;
  return esc(a.priceText || '另議');
}

// ---------- 圖片壓縮（存進 Firestore，單張文件上限 1MB） ----------
let webpOK = null;
function canWebp() {
  if (webpOK === null) {
    const c = document.createElement('canvas'); c.width = c.height = 1;
    webpOK = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpOK;
}
export async function compressImage(file, maxEdge, maxChars) {
  const bmp = await createImageBitmap(file);
  const type = canWebp() ? 'image/webp' : 'image/jpeg';
  let scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  let q = 0.86;
  const c = document.createElement('canvas');
  for (let i = 0; i < 14; i++) {
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (type === 'image/jpeg') { ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(bmp, 0, 0, w, h);
    const data = c.toDataURL(type, q);
    if (data.length <= maxChars) return { data, w, h };
    if (q > 0.62) q -= 0.08; else scale *= 0.82;
  }
  throw new Error('圖片太大，無法壓縮到可儲存的大小');
}
