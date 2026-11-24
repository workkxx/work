// 後台「匯入資料」：貼上或選擇 JSON → 預覽 → 套用到後台（還沒寫入資料庫，按「儲存變更」才會存）
import { esc, uid, DEFAULTS } from './common.js?v=20261124x';

const SETTINGS_KEYS = Object.keys(DEFAULTS.settings);
const CONTENT_KEYS = Object.keys(DEFAULTS.content);
const ABOUT_KEYS = Object.keys(DEFAULTS.content.about);
const CONTENT_NAMES = {
  process: '委託流程', payment: '付款方式', paymentNote: '付款說明', rules: '委託須知段落', faqs: '常見問題',
  addons: '加價項目', addonsNote: '加價說明', memberNote: '點數規則', privacyNote: '隱私說明', about: '關於與聯絡',
};
const SETTINGS_NAMES = {
  siteName: '網站名稱', status: '接案狀態', statusText: '狀態說明', announcement: '首頁公告', accent: '主題色',
  commercialRate: '商用倍率', commercialNote: '商用說明', navLabels: '分頁名稱',
};

export const IMPORT_EXAMPLE = `{
  "mode": "append",
  "categories": [
    {
      "name": "自帶價委託",
      "desc": "提供預算，依預算內容安排",
      "notes": "- 說明文字可以用條列",
      "items": [
        { "name": "項目名稱", "spec": "規格", "price": 1000, "suffix": "起", "desc": "說明" }
      ]
    }
  ],
  "content": {
    "rules": [ { "title": "段落標題", "body": "內容" } ]
  }
}`;

// mode 可以是 "append" / "replace"，或依區塊分別指定：{ "categories": "append", "content": "replace", "faqs": "append" }
function modeFor(d, key) {
  const m = d.mode;
  if (m && typeof m === 'object') {
    const v = m[key] ?? (key === 'categories' ? undefined : m.content);
    return v === 'append' ? 'append' : 'replace';
  }
  return m === 'append' ? 'append' : 'replace';
}

export function createImportUI({ getState, markDirty, removeCats, queueDel, rerender, toast }) {
  let parsed = null, report = null;

  function analyse(d) {
    const out = { ok: [], warn: [] };
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('最外層必須是 { } 物件');
    const modeOf = key => modeFor(d, key);
    out.mode = typeof d.mode === 'object' && d.mode ? 'mixed' : modeOf('categories');
    for (const k of Object.keys(d)) if (!['mode', 'settings', 'content', 'categories', 'version'].includes(k)) out.warn.push(`不認得的欄位「${k}」，會略過`);
    if (d.settings) {
      for (const k of Object.keys(d.settings)) {
        if (SETTINGS_KEYS.includes(k)) out.ok.push(`網站設定：${SETTINGS_NAMES[k] || k}`);
        else out.warn.push(`網站設定裡不認得「${k}」，會略過`);
      }
    }
    if (d.content) {
      for (const k of Object.keys(d.content)) {
        if (!CONTENT_KEYS.includes(k)) { out.warn.push(`內容裡不認得「${k}」，會略過`); continue; }
        const v = d.content[k];
        if (Array.isArray(v)) out.ok.push(`${CONTENT_NAMES[k] || k}：${modeOf(k) === 'append' ? '新增' : '取代為'} ${v.length} 筆`);
        else if (k === 'about') out.ok.push(`關於與聯絡：更新 ${Object.keys(v || {}).filter(x => ABOUT_KEYS.includes(x)).length} 個欄位`);
        else out.ok.push(`${CONTENT_NAMES[k] || k}：更新`);
      }
    }
    if (d.categories) {
      if (!Array.isArray(d.categories)) throw new Error('categories 必須是陣列 [ ]');
      const n = d.categories.reduce((t, c) => t + (c.items || []).length, 0);
      out.ok.push(`價目表：${modeOf('categories') === 'append' ? '新增' : '取代為'} ${d.categories.length} 個類別、${n} 個項目`);
      if (modeOf('categories') === 'replace') out.warn.push('價目表為取代：目前價目表的所有類別會被換掉（儲存後才生效）');
    }
    if (!out.ok.length) throw new Error('沒有可以匯入的內容');
    return out;
  }

  const cleanCat = c => ({
    id: uid(), name: String(c.name || '新類別'), desc: String(c.desc || ''), callout: String(c.callout || ''), notes: String(c.notes || ''), visible: c.visible !== false,
    items: (c.items || []).map(it => ({
      id: uid(), name: String(it.name || ''), spec: String(it.spec || ''),
      price: it.price === undefined || it.price === '' ? null : Number(it.price),
      priceTo: it.priceTo === undefined || it.priceTo === '' ? null : Number(it.priceTo),
      suffix: String(it.suffix ?? ''), desc: String(it.desc || ''), images: [], visible: it.visible !== false,
      prices: (it.prices || []).map(p => ({ label: String(p.label || ''), price: p.price === undefined || p.price === '' || p.price === null ? null : Number(p.price), suffix: String(p.suffix || '') })),
    })),
  });
  const withIds = (k, arr) => arr.map(x => (['rules', 'faqs', 'addons'].includes(k) ? { id: uid(), ...x } : { ...x }));

  function apply(d) {
    const st = getState();
    if (d.settings) {
      for (const [k, v] of Object.entries(d.settings)) {
        if (!SETTINGS_KEYS.includes(k)) continue;
        if (k === 'navLabels') st.settings.navLabels = { ...st.settings.navLabels, ...v };
        else st.settings[k] = v;
      }
      markDirty('settings');
    }
    if (d.content) {
      for (const [k, v] of Object.entries(d.content)) {
        if (!CONTENT_KEYS.includes(k)) continue;
        if (k === 'about') { for (const [ak, av] of Object.entries(v || {})) if (ABOUT_KEYS.includes(ak)) st.content.about[ak] = av; }
        else if (Array.isArray(v)) st.content[k] = modeFor(d, k) === 'append' ? [...(st.content[k] || []), ...withIds(k, v)] : withIds(k, v);
        else st.content[k] = v;
      }
      markDirty('content');
    }
    if (d.categories) {
      const cats = d.categories.map(cleanCat);
      if (modeFor(d, 'categories') === 'append') st.categories.push(...cats);
      else {
        removeCats(st.categories.map(c => c.id));
        queueDel('categories', st.categories.flatMap(c => c.items.flatMap(i => i.images || [])));
        st.categories.splice(0, st.categories.length, ...cats);
      }
      markDirty('categories');
    }
  }

  function html() {
    return `
      <div class="card">
        <h3>貼上或選擇檔案</h3>
        <p class="muted sm">把整理好的 JSON 貼在下面，或選擇 .json 檔案。先按「預覽」確認會改到哪些地方，再按「套用」。</p>
        <label class="fld"><span>JSON 內容</span><textarea id="imp-text" rows="12" spellcheck="false" style="font-family:var(--mono);font-size:12.5px" placeholder='${esc(IMPORT_EXAMPLE)}'></textarea></label>
        <div class="cl-actions">
          <label class="btn ghost sm upl">選擇 .json 檔<input type="file" id="imp-file" accept=".json,application/json" hidden></label>
          <button class="btn sm" data-imp="preview">預覽</button>
        </div>
        <div id="imp-report">${reportHTML()}</div>
      </div>
      <div class="card">
        <h3>備份目前內容</h3>
        <p class="muted sm">下載目前後台的網站設定、內容與價目表（不含圖片與客戶資料），之後可以從這裡匯入還原。</p>
        <button class="btn ghost sm" data-imp="export">下載備份 .json</button>
      </div>`;
  }
  function reportHTML() {
    if (!report) return '';
    if (report.error) return `<div class="imp-box err">⚠ ${esc(report.error)}</div>`;
    return `<div class="imp-box">
      <p><b>模式：</b>${report.mode === 'mixed' ? '依區塊分別新增或取代（見下方）' : report.mode === 'append' ? '新增（加在現有內容後面）' : '取代（換掉對應的現有內容）'}</p>
      <ul>${report.ok.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      ${report.warn.length ? `<ul class="warn">${report.warn.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <button class="btn sm" data-imp="apply">套用到後台</button>
      <span class="muted sm">套用後請到各分頁檢查，再按右上角「儲存變更」。</span>
    </div>`;
  }
  const redrawReport = () => { const el = document.getElementById('imp-report'); if (el) el.innerHTML = reportHTML(); };

  function preview() {
    const t = (document.getElementById('imp-text')?.value || '').trim();
    parsed = null;
    try {
      if (!t) throw new Error('請先貼上 JSON');
      const d = JSON.parse(t);
      report = analyse(d); parsed = d;
    } catch (e) {
      report = { error: e instanceof SyntaxError ? `JSON 格式錯誤：${e.message}` : e.message };
    }
    redrawReport();
  }

  function exportJSON() {
    const st = getState();
    const data = { version: 1, mode: 'replace', settings: st.settings, content: st.content,
      categories: st.categories.map(({ id, ...c }) => ({ ...c, items: c.items.map(({ id: _i, images, ...it }) => it) })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `commission-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return {
    html,
    onClick(e) {
      const b = e.target.closest('[data-imp]');
      if (!b) return;
      const a = b.dataset.imp;
      if (a === 'preview') preview();
      if (a === 'export') exportJSON();
      if (a === 'apply' && parsed) {
        if (modeFor(parsed, 'categories') === 'replace' && parsed.categories && !confirm('取代模式會換掉目前整個價目表（儲存後生效）。確定套用？')) return;
        apply(parsed);
        parsed = null; report = null;
        rerender();
        toast('已套用，請檢查各分頁後按「儲存變更」');
      }
    },
    async onChange(e) {
      if (e.target.id !== 'imp-file' || !e.target.files[0]) return;
      document.getElementById('imp-text').value = await e.target.files[0].text();
      preview();
    },
  };
}
