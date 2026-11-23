// 後台「客戶與點數」：客戶資料、交易紀錄、點數。每個動作會直接存檔（不走右上角的儲存按鈕）。
import { esc, fmt } from './common.js?v=20261124b';

export const STATUSES = ['洽談中', '已付款', '製作中', '已完成', '已取消', '點數調整'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const byDate = (a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.created || 0) - (a.created || 0);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function summarize(records) {
  const live = records.filter(r => r.status !== '已取消');
  return {
    points: records.reduce((t, r) => t + (Number(r.points) || 0), 0),
    count: live.filter(r => Number(r.amount) > 0).length,
    lastDate: records.map(r => r.date || '').sort().pop() || '',
  };
}

export function createClientsUI({ S, toast }) {
  const cl = { list: null, loading: false, q: '', sel: null, detail: null, editing: null };
  let root = null;
  const cid = e => S.clientId(e);

  async function loadList() {
    cl.loading = true;
    try { cl.list = await S.listClients(); }
    catch (e) { toast('客戶列表讀取失敗：' + e.message, true); cl.list = []; }
    cl.loading = false;
    draw();
  }
  async function openClient(id) {
    cl.sel = id; cl.detail = null; cl.editing = null; draw();
    try { cl.detail = await S.getClient(id); }
    catch (e) { toast('讀取失敗：' + e.message, true); cl.sel = null; }
    draw();
  }
  async function refreshDetail() {
    cl.detail = await S.getClient(cl.sel);
    const sum = summarize(cl.detail.records);
    await S.saveClient(cl.sel, sum);
    Object.assign(cl.detail.client, sum);
    const row = cl.list?.find(c => c.id === cl.sel);
    if (row) Object.assign(row, sum, { name: cl.detail.client.name });
  }

  // ---------- 畫面 ----------
  function mount(el) {
    root = el;
    if (!cl.list && !cl.loading) loadList();
    draw();
  }
  function draw() {
    if (!root || !root.isConnected) return;
    if (!cl.list) { root.innerHTML = '<p class="muted">讀取客戶資料中…</p>'; return; }
    root.innerHTML = cl.sel ? detailHTML() : listHTML();
  }

  function listHTML() {
    const q = cl.q.trim().toLowerCase();
    const rows = cl.list
      .filter(c => !q || (c.name || '').toLowerCase().includes(q) || c.id.includes(q))
      .sort((a, b) => String(b.lastDate || b.created || '').localeCompare(String(a.lastDate || a.created || '')));
    return `
      <div class="card">
        <h3>新增客戶</h3>
        <div class="cl-add">
          <label class="fld"><span>客戶的 Gmail（客戶用這個帳號登入查詢）</span><input type="email" id="cl-new-email" placeholder="example@gmail.com"></label>
          <label class="fld"><span>暱稱</span><input type="text" id="cl-new-name" placeholder="顯示在會員頁的稱呼"></label>
          <button class="btn sm" data-cl="add">＋ 新增</button>
        </div>
      </div>
      <div class="card">
        <div class="cl-toolbar"><h3>客戶列表 <span class="muted sm">${cl.list.length} 位</span></h3>
          <input type="search" id="cl-search" placeholder="搜尋暱稱或 Email" value="${esc(cl.q)}">
          <button class="ib" data-cl="reload" title="重新讀取">重新整理</button></div>
        ${rows.length ? `<div class="cl-table-wrap"><table class="cl-table">
          <thead><tr><th>暱稱</th><th>Email</th><th class="r">點數</th><th class="r">委託</th><th>最近紀錄</th><th></th></tr></thead>
          <tbody>${rows.map(c => `<tr data-cl="open" data-id="${esc(c.id)}">
            <td><b>${esc(c.name || '（未命名）')}</b></td><td class="mono">${esc(c.id)}</td>
            <td class="r mono pts">${fmt(c.points || 0)}</td><td class="r mono">${fmt(c.count || 0)}</td>
            <td class="mono">${esc(c.lastDate || '—')}</td><td class="r"><span class="ib">管理 ›</span></td></tr>`).join('')}</tbody>
        </table></div>` : `<p class="muted">${cl.list.length ? '沒有符合的客戶。' : '還沒有客戶，從上方新增第一位。'}</p>`}
      </div>`;
  }

  function detailHTML() {
    if (!cl.detail) return '<button class="ib" data-cl="back">‹ 返回列表</button><p class="muted">讀取中…</p>';
    const { client: c, note, records } = cl.detail;
    const sum = summarize(records);
    const list = [...records].sort(byDate);
    const ed = cl.editing;
    const form = ed ? recForm(ed === 'new' ? { date: today(), title: '', amount: null, points: null, status: '已付款', memo: '' } : records.find(r => r.id === ed)) : '';
    return `
      <button class="ib" data-cl="back">‹ 返回列表</button>
      <div class="cl-head">
        <div><h2>${esc(c.name || '（未命名）')}</h2><p class="mono muted">${esc(c.id)}</p></div>
        <div class="cl-pts"><small>目前點數</small><b>${fmt(sum.points)}</b><span>PT</span></div>
      </div>

      <div class="card">
        <h3>交易紀錄與點數</h3>
        <p class="muted sm">客戶在會員頁看得到這裡的每一筆紀錄（含「給客戶的備註」）。扣點請在點數填負數，例如 -100。</p>
        ${form || '<button class="add-btn" data-cl="rec-new">＋ 新增一筆紀錄</button>'}
        ${list.length ? `<div class="cl-table-wrap"><table class="cl-table recs">
          <thead><tr><th>日期</th><th>項目</th><th>狀態</th><th class="r">金額</th><th class="r">點數</th><th>給客戶的備註</th><th></th></tr></thead>
          <tbody>${list.map(r => {
            const p = Number(r.points) || 0;
            return `<tr class="${r.id === ed ? 'editing' : ''} ${r.status === '已取消' ? 'cancel' : ''}">
              <td class="mono">${esc(r.date || '')}</td><td><b>${esc(r.title || '')}</b></td><td>${esc(r.status || '')}</td>
              <td class="r mono">${Number(r.amount) ? fmt(r.amount) : '—'}</td>
              <td class="r mono ${p > 0 ? 'plus' : p < 0 ? 'minus' : ''}">${p > 0 ? '+' : ''}${p ? fmt(p) : '—'}</td>
              <td class="memo">${esc(r.memo || '')}</td>
              <td class="r nowrap"><button class="ib" data-cl="rec-edit" data-rid="${esc(r.id)}">編輯</button> <button class="ib danger" data-cl="rec-del" data-rid="${esc(r.id)}">刪除</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>` : '<p class="muted">還沒有紀錄。</p>'}
      </div>

      <div class="card">
        <h3>客戶資料</h3>
        <label class="fld"><span>暱稱（客戶看得到）</span><input type="text" id="cl-name" value="${esc(c.name || '')}"></label>
        <label class="fld"><span>私人備註（只有你看得到，存在另一個客戶無法讀取的位置）</span><textarea id="cl-note" rows="3">${esc(note || '')}</textarea></label>
        <div class="cl-actions">
          <button class="btn sm" data-cl="save-info">儲存客戶資料</button>
          <button class="btn ghost sm" data-cl="rebind">更換 Email</button>
          <button class="btn ghost sm danger-btn" data-cl="delete">刪除此客戶</button>
        </div>
      </div>`;
  }

  function recForm(r) {
    return `<div class="rec-form">
      <div class="grid3">
        <label class="fld"><span>日期</span><input type="date" id="rf-date" value="${esc(r.date || '')}"></label>
        <label class="fld span2"><span>項目</span><input type="text" id="rf-title" value="${esc(r.title || '')}" placeholder="例：基礎設定稿／點數折抵"></label>
      </div>
      <div class="grid3">
        <label class="fld"><span>金額 NT$</span><input type="number" id="rf-amount" min="0" step="1" value="${r.amount ?? ''}" placeholder="沒有金額可留空"></label>
        <label class="fld"><span>點數（扣點填負數）</span><input type="number" id="rf-points" step="1" value="${r.points ?? ''}" placeholder="例：150 或 -100"></label>
        <label class="fld"><span>狀態</span><select id="rf-status">${STATUSES.map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      </div>
      <label class="fld"><span>給客戶的備註（客戶看得到）</span><input type="text" id="rf-memo" value="${esc(r.memo || '')}"></label>
      <div class="cl-actions">
        <button class="btn sm" data-cl="rec-save" data-rid="${esc(r.id || '')}">${r.id ? '儲存修改' : '新增紀錄'}</button>
        <button class="btn ghost sm" data-cl="rec-cancel">取消</button>
      </div>
    </div>`;
  }

  // ---------- 動作 ----------
  const val = id => document.getElementById(id)?.value ?? '';
  const num = id => { const v = val(id).trim(); return v === '' ? null : Number(v); };

  async function act(b) {
    const a = b.dataset.cl;
    const busy = async fn => { b.disabled = true; try { await fn(); } catch (e) { console.error(e); toast('失敗：' + e.message, true); } b.disabled = false; draw(); };
    switch (a) {
      case 'reload': cl.list = null; draw(); return loadList();
      case 'open': return openClient(b.dataset.id);
      case 'back': cl.sel = null; cl.detail = null; cl.editing = null; return draw();
      case 'add': return busy(async () => {
        const email = val('cl-new-email').trim(), name = val('cl-new-name').trim();
        if (!EMAIL_RE.test(email)) return toast('請輸入正確的 Email', true);
        const id = cid(email);
        if (cl.list.some(c => c.id === id)) { toast('這位客戶已存在，已為你打開'); return openClient(id); }
        const info = { email: id, name, points: 0, count: 0, lastDate: '', created: today() };
        await S.saveClient(id, info);
        cl.list.push({ ...info, id });
        toast('已新增客戶');
        await openClient(id);
      });
      case 'rec-new': cl.editing = 'new'; return draw();
      case 'rec-edit': cl.editing = b.dataset.rid; draw(); return document.querySelector('.rec-form')?.scrollIntoView({ block: 'center' });
      case 'rec-cancel': cl.editing = null; return draw();
      case 'rec-save': return busy(async () => {
        const rec = { date: val('rf-date'), title: val('rf-title').trim(), amount: num('rf-amount'), points: num('rf-points'), status: val('rf-status'), memo: val('rf-memo').trim() };
        if (!rec.date || !rec.title) return toast('請填日期與項目', true);
        if ((rec.amount !== null && Number.isNaN(rec.amount)) || (rec.points !== null && Number.isNaN(rec.points))) return toast('金額或點數格式不正確', true);
        if (b.dataset.rid) { rec.id = b.dataset.rid; rec.created = cl.detail.records.find(x => x.id === rec.id)?.created ?? Date.now(); }
        else rec.created = Date.now();
        await S.saveRecord(cl.sel, rec);
        cl.editing = null;
        await refreshDetail();
        toast('紀錄已儲存 ✓');
      });
      case 'rec-del': {
        const r = cl.detail.records.find(x => x.id === b.dataset.rid);
        if (!confirm(`刪除「${r?.date} ${r?.title}」這筆紀錄？點數會一起重新計算，刪除後無法復原。`)) return;
        return busy(async () => { await S.deleteRecord(cl.sel, b.dataset.rid); if (cl.editing === b.dataset.rid) cl.editing = null; await refreshDetail(); toast('已刪除'); });
      }
      case 'save-info': return busy(async () => {
        const name = val('cl-name').trim(), note = val('cl-note');
        await S.saveClient(cl.sel, { name });
        await S.saveNote(cl.sel, note);
        cl.detail.client.name = name; cl.detail.note = note;
        const row = cl.list.find(c => c.id === cl.sel); if (row) row.name = name;
        toast('客戶資料已儲存 ✓');
      });
      case 'rebind': {
        const ne = (prompt('輸入新的 Gmail（客戶之後要用這個帳號登入）', '') || '').trim();
        if (!ne) return;
        if (!EMAIL_RE.test(ne)) return toast('Email 格式不正確', true);
        const nid = cid(ne);
        if (nid === cl.sel) return;
        if (cl.list.some(c => c.id === nid)) return toast('這個 Email 已經是另一位客戶', true);
        return busy(async () => {
          const { client, note, records } = cl.detail;
          const { id: _old, ...info } = client;
          await S.saveClient(nid, { ...info, email: nid });
          await S.saveNote(nid, note);
          for (const r of records) await S.saveRecord(nid, r);
          await S.deleteClient(cl.sel);
          const row = cl.list.find(c => c.id === cl.sel); if (row) { row.id = nid; row.email = nid; }
          toast('已更換 Email');
          await openClient(nid);
        });
      }
      case 'delete': {
        const typed = prompt(`確定要刪除這位客戶與他的所有交易紀錄？\n刪除後無法復原。\n\n請輸入客戶 Email 確認：\n${cl.sel}`);
        if (typed === null) return;
        if (typed.trim().toLowerCase() !== cl.sel) return toast('Email 不相符，已取消刪除', true);
        return busy(async () => {
          await S.deleteClient(cl.sel);
          cl.list = cl.list.filter(c => c.id !== cl.sel);
          cl.sel = null; cl.detail = null;
          toast('已刪除客戶');
        });
      }
    }
  }

  return {
    mount,
    onClick(e) { const b = e.target.closest('[data-cl]'); if (b && root?.contains(b)) act(b); },
    onInput(e) {
      if (e.target.id === 'cl-search') {
        cl.q = e.target.value; const pos = e.target.selectionStart;
        draw();
        const s = document.getElementById('cl-search'); s.focus(); s.setSelectionRange(pos, pos);
      }
    },
  };
}
