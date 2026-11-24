// 示範模式：還沒設定 Firebase 時使用，資料存在這台瀏覽器的 localStorage
import { DEMO_DATA, DEMO_IMAGES, DEMO_CLIENTS } from './demo-data.js?v=20261124x';
import { OWNER_EMAIL } from '../config.js?v=20261124x';
import { normalize, compressImage, uid, clean } from './common.js?v=20261124x';

const KEY = 'commission-demo-v1';
const IMG = 'commission-demo-img-';

function read() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch {}
  return JSON.parse(JSON.stringify(DEMO_DATA));
}
function write(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { alert('示範模式儲存空間不足：' + e.message); }
}

export async function loadAll() { return normalize(read()); }

function img(id) {
  if (!id) return null;
  if (DEMO_IMAGES[id]) return DEMO_IMAGES[id];
  try { return JSON.parse(localStorage.getItem(IMG + id) || 'null'); } catch { return null; }
}
export async function getThumb(id) { const v = img(id); return v ? (v.thumb || v) : null; }
export async function getImage(id) { const v = img(id); return v ? (v.full || v) : null; }

export async function saveSettings(v) { const d = read(); d.settings = clean(v); write(d); }
export async function saveContent(v) { const d = read(); d.content = clean(v); write(d); }
export async function saveCategories(list) { const d = read(); d.categories = clean(list.map((c, i) => ({ ...c, order: i }))); write(d); }

export async function uploadImage(file) {
  const full = await compressImage(file, 1400, 400_000);
  const thumb = await compressImage(file, 560, 120_000);
  const id = uid();
  try { localStorage.setItem(IMG + id, JSON.stringify({ full: full.data, thumb: thumb.data })); }
  catch { alert('示範模式的瀏覽器空間不足，圖片無法保存。正式接上 Firebase 後就沒有這個限制。'); }
  return id;
}
export async function deleteImage(id) { try { localStorage.removeItem(IMG + id); } catch {} }

let listener = null;
const user = () => {
  const e = sessionStorage.getItem('demo-login');
  return e ? { email: e === '1' ? OWNER_EMAIL : e, name: '示範帳號' } : null;
};
export function onAuth(cb) { listener = cb; cb(user()); }
// 示範模式：signIn(email) 可指定要模擬登入的帳號，不給就是站主
export async function signIn(email) { sessionStorage.setItem('demo-login', email || OWNER_EMAIL); listener?.(user()); }
export async function signOut() { sessionStorage.removeItem('demo-login'); listener?.(null); }

// ================= 客戶與交易紀錄（示範） =================
const CKEY = 'commission-demo-clients-v1';
export const clientId = email => String(email || '').trim().toLowerCase();
function cread() {
  try { const s = localStorage.getItem(CKEY); if (s) return JSON.parse(s); } catch {}
  return JSON.parse(JSON.stringify(DEMO_CLIENTS));
}
function cwrite(d) { try { localStorage.setItem(CKEY, JSON.stringify(d)); } catch (e) { alert('示範模式儲存失敗：' + e.message); } }
const recs = c => Object.entries(c.records || {}).map(([id, r]) => ({ ...r, id }));

export async function getMyRecords(email) {
  const c = cread()[clientId(email)];
  return c ? { client: { ...c.info, id: clientId(email) }, records: recs(c) } : null;
}
export async function listClients() { return Object.entries(cread()).map(([id, c]) => ({ ...c.info, id })); }
export async function getClient(id) {
  const c = cread()[id];
  return c ? { client: { ...c.info, id }, note: c.note || '', records: recs(c) } : null;
}
export async function saveClient(id, info) { const d = cread(); d[id] ||= { info: {}, note: '', records: {} }; d[id].info = { ...d[id].info, ...clean(info) }; cwrite(d); }
export async function saveNote(id, note) { const d = cread(); d[id] ||= { info: {}, note: '', records: {} }; d[id].note = note || ''; cwrite(d); }
export async function saveRecord(id, rec) {
  const d = cread(); const { id: rid0, ...r } = rec; const rid = rid0 || uid();
  d[id].records[rid] = clean(r); cwrite(d); return rid;
}
export async function deleteRecord(id, rid) { const d = cread(); delete d[id].records[rid]; cwrite(d); }
export async function deleteClient(id) { const d = cread(); delete d[id]; cwrite(d); }

export function resetDemo() { localStorage.removeItem(KEY); localStorage.removeItem(CKEY); }
