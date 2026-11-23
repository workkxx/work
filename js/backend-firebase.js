import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as fbSignOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './config.js';
import { normalize, compressImage, uid, clean } from './common.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let auth = null;
const A = () => (auth ||= getAuth(app));

export async function loadAll() {
  const [s, c, cats] = await Promise.all([
    getDoc(doc(db, 'site', 'settings')),
    getDoc(doc(db, 'site', 'content')),
    getDocs(collection(db, 'categories')),
  ]);
  return normalize({
    settings: s.exists() ? s.data() : null,
    content: c.exists() ? c.data() : null,
    categories: cats.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    empty: !s.exists() && !c.exists() && cats.empty,
  });
}

const thumbCache = new Map();
export function getThumb(id) {
  if (!id) return Promise.resolve(null);
  if (!thumbCache.has(id)) {
    thumbCache.set(id, getDoc(doc(db, 'thumbs', id)).then(d => (d.exists() ? d.data().data : null)).catch(() => null));
  }
  return thumbCache.get(id);
}
export async function getImage(id) {
  const d = await getDoc(doc(db, 'images', id));
  return d.exists() ? d.data().data : null;
}

export const saveSettings = v => setDoc(doc(db, 'site', 'settings'), clean(v));
export const saveContent = v => setDoc(doc(db, 'site', 'content'), clean(v));

export async function saveCategories(list, removedIds = []) {
  const b = writeBatch(db);
  list.forEach((c, i) => {
    const { id, ...rest } = c;
    b.set(doc(db, 'categories', id), clean({ ...rest, order: i }));
  });
  removedIds.forEach(id => b.delete(doc(db, 'categories', id)));
  await b.commit();
}

export async function uploadImage(file) {
  const full = await compressImage(file, 2000, 950_000);
  const thumb = await compressImage(file, 560, 140_000);
  const id = uid();
  await setDoc(doc(db, 'images', id), { data: full.data, w: full.w, h: full.h, created: Date.now() });
  await setDoc(doc(db, 'thumbs', id), { data: thumb.data, created: Date.now() });
  thumbCache.set(id, Promise.resolve(thumb.data));
  return id;
}
export async function deleteImage(id) {
  await Promise.all([deleteDoc(doc(db, 'images', id)), deleteDoc(doc(db, 'thumbs', id))]);
  thumbCache.delete(id);
}

export function onAuth(cb) {
  onAuthStateChanged(A(), u => cb(u ? { email: u.email, name: u.displayName } : null));
}
export async function signIn() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(A(), p); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(A(), p);
    throw e;
  }
}
export const signOut = () => fbSignOut(A());

// ================= 客戶與交易紀錄 =================
// clients/{email}            客戶本人與站主可讀；只有站主可寫
// clients/{email}/records/*  交易紀錄（同上）
// clientNotes/{email}        站主私人備註（只有站主可讀寫）
export const clientId = email => String(email || '').trim().toLowerCase();

async function readRecords(id) {
  const rs = await getDocs(collection(db, 'clients', id, 'records'));
  return rs.docs.map(d => ({ ...d.data(), id: d.id }));
}

// 客戶自己查詢（規則會擋掉別人的資料）
export async function getMyRecords(email) {
  const id = clientId(email);
  const c = await getDoc(doc(db, 'clients', id));
  if (!c.exists()) return null;
  return { client: { ...c.data(), id }, records: await readRecords(id) };
}

export async function listClients() {
  const s = await getDocs(collection(db, 'clients'));
  return s.docs.map(d => ({ ...d.data(), id: d.id }));
}
export async function getClient(id) {
  const [c, n, records] = await Promise.all([
    getDoc(doc(db, 'clients', id)), getDoc(doc(db, 'clientNotes', id)), readRecords(id),
  ]);
  if (!c.exists()) return null;
  return { client: { ...c.data(), id }, note: n.exists() ? n.data().note || '' : '', records };
}
export async function saveClient(id, info) { await setDoc(doc(db, 'clients', id), clean(info), { merge: true }); }
export async function saveNote(id, note) { await setDoc(doc(db, 'clientNotes', id), { note: note || '' }); }
export async function saveRecord(id, rec) {
  const { id: rid0, ...r } = rec;
  const rid = rid0 || uid();
  await setDoc(doc(db, 'clients', id, 'records', rid), clean(r));
  return rid;
}
export async function deleteRecord(id, rid) { await deleteDoc(doc(db, 'clients', id, 'records', rid)); }
export async function deleteClient(id) {
  const recs = await readRecords(id);
  const b = writeBatch(db);
  recs.forEach(r => b.delete(doc(db, 'clients', id, 'records', r.id)));
  b.delete(doc(db, 'clientNotes', id));
  b.delete(doc(db, 'clients', id));
  await b.commit();
}
