import { store, DEMO } from './store.js';
import { OWNER_EMAIL } from './config.js';
import { esc, rich, priceHTML, addonPrice, fmt, STATUS } from './common.js';

const page = document.body.dataset.page;
const main = document.getElementById('main');
const S = await store;

const NAV = [
  ['home', 'index.html', '首頁', 'HOME'],
  ['price', 'price.html', '價目表', 'PRICE'],
  ['rules', 'rules.html', '委託須知', 'TERMS'],
  ['faq', 'faq.html', '常見問題', 'FAQ'],
  ['about', 'about.html', '聯絡', 'CONTACT'],
  ['member', 'member.html', '會員查詢', 'MEMBER'],
];
const pad = n => String(n).padStart(2, '0');
const has = n => n !== null && n !== undefined && n !== '';

try {
  const data = await S.loadAll();
  shell(data);
  ({ home, price, rules, faq, about, member })[page](data);
  hydrate();
} catch (e) {
  console.error(e);
  main.innerHTML = `<div class="sheet"><div class="sheet-body"><p class="error">資料讀取失敗：${esc(e.message)}</p></div></div>`;
}
document.body.classList.add('ready');

// ================= 外框 =================
function shell({ settings: s }) {
  document.documentElement.style.setProperty('--accent', s.accent || '#AAA55A');
  const cur = NAV.find(n => n[0] === page);
  document.title = page === 'home' ? s.siteName : `${cur[2]}｜${s.siteName}`;
  const st = STATUS[s.status] || STATUS.closed;
  const mq = s.marquee || `/// ${s.siteName} /// COMMISSION ${st.en} ///`;

  document.getElementById('site-header').innerHTML = `
    ${DEMO ? '<div class="demo-bar">DEMO MODE // 尚未連接 Firebase，內容為範例資料</div>' : ''}
    <div class="marquee"><div class="marquee-track"><span>${esc(mq)}&emsp;</span><span>${esc(mq)}&emsp;</span><span>${esc(mq)}&emsp;</span><span>${esc(mq)}&emsp;</span></div></div>
    <div class="topbar">
      <a class="brand" href="index.html">${s.logo ? `<img data-thumb="${esc(s.logo)}" alt="">` : ''}<span>${esc(s.siteName)}</span></a>
      <span class="status-chip st-${esc(s.status)}"><i></i>${st.en}</span>
    </div>
    <nav class="side-nav">
      ${NAV.map(([k, href, zh, en]) => `<a class="side-btn ${k === page ? 'active' : ''}" href="${href}"><small>${en}</small>${zh}</a>`).join('')}
    </nav>`;

  document.getElementById('site-footer').innerHTML = `
    <div class="foot">
      <div class="foot-left">© ${new Date().getFullYear()} ${esc(s.siteName).toUpperCase()}${s.footerText ? `<br><span>${esc(s.footerText)}</span>` : ''}</div>
      <a class="foot-mail" href="about.html">CONTACT ▸</a>
    </div>`;
}

// 筆記本紙張：SUBJECT / DATE / 貼紙框
function sheet(subject, en, body, s) {
  const d = new Date();
  const days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
  const order = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
  const today = days[d.getDay()];
  const st = STATUS[s.status] || STATUS.closed;
  return `
  <article class="sheet">
    <header class="sheet-head">
      <div class="sh-lines">
        <div class="sh-line"><span class="lab">SUBJECT TOPIC :</span><h1 class="val">${subject}</h1><span class="en">${en}</span></div>
        <div class="sh-line"><span class="lab">DATE :</span><span class="val mono">${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}</span>
          <span class="week">${order.map(w => `<b class="${w === today ? 'on' : ''}">${w}</b>`).join(' ')}</span></div>
      </div>
      <div class="sticker-box">
        <span class="sticker-lab">STATUS</span>
        <div class="sticker st-${esc(s.status)}"><b>${st.label}</b><small>${st.en}</small></div>
        ${s.statusText ? `<span class="sticker-note">${esc(s.statusText)}</span>` : ''}
      </div>
    </header>
    <div class="sheet-body">${body}</div>
  </article>`;
}

function block(badge, title, body, extra = '') {
  return `<section class="t-block" ${extra}><div class="t-head"><span class="badge">${badge}</span><h2 class="t-title">${title}</h2></div>${body}</section>`;
}

// ================= 首頁 =================
function home({ settings: s, categories }) {
  const cats = categories.filter(c => c.visible !== false);
  const title = (s.heroTitle || 'COMMISSION').trim();
  const body = `
    ${s.announcement ? block('NOTICE', '公告', `<div class="prose lined">${rich(s.announcement)}</div>`) : ''}
    <div class="must-read"><span class="mr-mark">!</span><p>委託前請務必閱讀 <a href="rules.html">委託須知</a>，送出委託即視為已閱讀並同意。</p></div>
    ${cats.length ? block('INDEX', '委託項目', `
      <div class="cat-index">
        ${cats.map((c, i) => {
          const prices = c.items.filter(it => it.visible !== false && has(it.price)).map(it => Number(it.price));
          return `<a class="cat-chip" href="price.html#cat-${esc(c.id)}">
            <span class="cat-no">${pad(i + 1)}</span>
            <span class="cat-name">${esc(c.name)}</span>
            <span class="cat-from">${prices.length ? `NT$ ${fmt(Math.min(...prices))} ~` : 'ASK'}</span>
            <span class="cat-arrow">▸</span>
          </a>`;
        }).join('')}
      </div>`) : ''}
    <div class="hero-actions">
      <a class="btn" href="price.html">查看價目表 ▸</a>
      <a class="btn ghost" href="rules.html">委託須知</a>
    </div>`;
  main.innerHTML = `
    <div class="hero" ${s.heroImage ? `data-full="${esc(s.heroImage)}"` : ''}>
      <div class="hero-in">
        ${s.subtitle ? `<p class="hero-sub">${esc(s.subtitle)}</p>` : ''}
        <h1 class="hero-title"><span class="first">${esc(title[0] || '')}</span>${esc(title.slice(1))}</h1>
      </div>
    </div>
    ${sheet(esc(s.siteName), 'HOME', body, s)}`;
}

// ================= 價目表 =================
function price({ settings: s, content: c, categories }) {
  const cats = categories.filter(x => x.visible !== false);
  const rate = Number(s.commercialRate) || 0;
  const body = `
    <p class="lead mono">ALL PRICES IN TWD // 以下價格皆為新台幣</p>
    ${cats.length + (c.addons.length ? 1 : 0) > 1 ? `<nav class="tabs">${cats.map((x, i) => `<a href="#cat-${esc(x.id)}"><small>${pad(i + 1)}</small>${esc(x.name)}</a>`).join('')}${c.addons.length ? '<a href="#addons"><small>+</small>加價項目</a>' : ''}</nav>` : ''}
    ${cats.length ? '' : '<p class="empty">價目表整理中。</p>'}
    ${cats.map((cat, ci) => {
      const items = cat.items.filter(it => it.visible !== false);
      return `
      <section class="cat" id="cat-${esc(cat.id)}">
        <div class="t-head"><span class="badge">SEC.${pad(ci + 1)}</span><h2 class="t-title">${esc(cat.name)}</h2></div>
        ${cat.desc ? `<p class="cat-desc">${esc(cat.desc)}</p>` : ''}
        <div class="cards">
          ${items.map((it, ii) => `
            <article class="card">
              ${it.images.length ? `
                <button class="card-img" data-gallery="${esc(it.images.join(','))}" aria-label="查看範例">
                  <img data-thumb="${esc(it.images[0])}" alt="${esc(it.name)} 範例">
                </button>` : '<div class="card-img noimg"><span>NO SAMPLE</span></div>'}
              <div class="card-index"><span class="idx">${pad(ii + 1)}</span><span class="type">${it.images.length ? `SAMPLE ×${it.images.length}` : esc(cat.name)}</span></div>
              <div class="card-body">
                <h3>${esc(it.name)}</h3>
                ${it.spec ? `<p class="spec">${esc(it.spec)}</p>` : ''}
                ${it.desc ? `<div class="card-desc">${rich(it.desc)}</div>` : ''}
                <div class="price">${priceHTML(it)}</div>
                ${rate && has(it.price) ? `<p class="price-com"><span>COMM.</span> NT$ ${fmt(Math.round(it.price * rate))}${has(it.priceTo) ? ` – ${fmt(Math.round(it.priceTo * rate))}` : ''}${it.suffix ? ' ' + esc(it.suffix) : ''}</p>` : ''}
              </div>
            </article>`).join('')}
        </div>
        ${cat.notes ? `<div class="cat-notes prose">${rich(cat.notes)}</div>` : ''}
      </section>`;
    }).join('')}
    ${c.addons.length ? `
    <section class="cat" id="addons">
      <div class="t-head"><span class="badge">EXTRA</span><h2 class="t-title">加價項目</h2></div>
      ${c.addonsNote ? `<p class="cat-desc">${esc(c.addonsNote)}</p>` : ''}
      <ul class="addons">
        ${c.addons.map(a => `<li><span class="ad-name">${esc(a.name)}${a.note ? `<small>${esc(a.note)}</small>` : ''}</span><span class="leader"></span><span class="ad-price">${addonPrice(a)}</span></li>`).join('')}
      </ul>
    </section>` : ''}
    ${s.commercialNote ? block('COMM.', '商業用途', `<div class="prose lined">${rich(s.commercialNote)}</div>`) : ''}
    <div class="must-read"><span class="mr-mark">!</span><p>委託前請務必閱讀 <a href="rules.html">委託須知</a>。</p></div>`;
  main.innerHTML = sheet('價目表', 'PRICE LIST', body, s);
  main.querySelectorAll('[data-gallery]').forEach(b => b.addEventListener('click', () => gallery(b.dataset.gallery.split(','))));
}

// ================= 委託須知 =================
function rules({ settings: s, content: c }) {
  const toc = [];
  if (c.process.length) toc.push(['process', '委託流程']);
  if (c.payment.length || c.paymentNote) toc.push(['payment', '付款方式']);
  c.rules.forEach((r, i) => toc.push([`rule-${i}`, r.title]));
  const body = `
    <p class="lead">送出委託即視為已閱讀並同意以下內容。</p>
    ${toc.length ? `<nav class="toc">${toc.map(([id, t], i) => `<a href="#${id}"><small>${pad(i + 1)}</small>${esc(t)}</a>`).join('')}</nav>` : '<p class="empty">委託須知整理中。</p>'}
    ${c.process.length ? block('PROTOCOL', '委託流程', `
      <ol class="steps">${c.process.map((p, i) => `<li><span class="step-no">${pad(i + 1)}</span><div><b>${esc(p.title)}</b>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}</div></li>`).join('')}</ol>`, 'id="process"') : ''}
    ${c.payment.length || c.paymentNote ? block('PAYMENT', '付款方式', `
      ${c.payment.length ? `<ul class="pay">${c.payment.map(p => `<li><b>${esc(p.name)}</b>${p.note ? `<span>${esc(p.note)}</span>` : ''}</li>`).join('')}</ul>` : ''}
      ${c.paymentNote ? `<div class="prose lined">${rich(c.paymentNote)}</div>` : ''}`, 'id="payment"') : ''}
    ${c.rules.map((r, i) => block(`§${pad(i + 1)}`, esc(r.title), `<div class="prose lined">${rich(r.body)}</div>`, `id="rule-${i}"`)).join('')}`;
  main.innerHTML = sheet('委託須知', 'TERMS', body, s);
}

// ================= FAQ =================
function faq({ settings: s, content: c }) {
  const body = `<div class="faq">
    ${c.faqs.length ? c.faqs.map((f, i) => `<details><summary><span class="q">Q.${pad(i + 1)}</span><span class="qt">${esc(f.q)}</span></summary><div class="prose a">${rich(f.a)}</div></details>`).join('') : '<p class="empty">目前沒有常見問題。</p>'}
  </div>`;
  main.innerHTML = sheet('常見問題', 'FAQ', body, s);
}

// ================= 關於與聯絡 =================
function about({ settings: s, content: { about: a } }) {
  const body = `
    <section class="profile">
      ${a.avatar ? `<img class="avatar" data-thumb="${esc(a.avatar)}" alt="">` : '<div class="avatar ph"></div>'}
      <div>
        ${a.name ? `<h2 class="pf-name">${esc(a.name)}</h2>` : ''}
        ${a.bio ? `<div class="prose">${rich(a.bio)}</div>` : ''}
        ${a.links.length ? `<div class="links">${a.links.filter(l => l.url).map(l => `<a class="btn ghost sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a>`).join('')}</div>` : ''}
      </div>
    </section>
    ${a.email || a.contactNote ? block('TRANSMISSION', '委託聯絡', `
      ${a.email ? `<p class="email"><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></p>` : ''}
      ${a.contactNote ? `<div class="prose lined">${rich(a.contactNote)}</div>` : ''}`) : ''}
    ${a.official.length ? block('WARNING', '謹防詐騙', `
      ${a.officialNote ? `<div class="prose lined">${rich(a.officialNote)}</div>` : ''}
      <table class="acc">${a.official.map(o => `<tr><th>${esc(o.platform)}</th><td>${esc(o.account)}</td></tr>`).join('')}</table>`) : ''}`;
  main.innerHTML = sheet('關於與聯絡', 'ABOUT & CONTACT', body, s);
}

// ================= 會員查詢 =================
function member({ settings: s, content: c }) {
  const notes =
    (c.memberNote ? block('POINTS', '點數規則', `<div class="prose lined">${rich(c.memberNote)}</div>`) : '') +
    (c.privacyNote ? block('PRIVACY', '資料與隱私', `<div class="prose lined">${rich(c.privacyNote)}</div>`) : '');
  const render = inner => { main.innerHTML = sheet('會員查詢', 'MEMBER', inner + notes, s); };

  const loginBox = () => block('LOGIN', '登入查詢', `
    <p class="mem-text">請使用<strong>委託時提供的 Gmail</strong> 登入，即可查看你的委託紀錄與點數。<br>只會顯示屬於你自己的資料。</p>
    ${DEMO ? `<label class="demo-login">示範模式：模擬登入的 Email <input id="demoEmail" value="client@example.com"></label>` : ''}
    <button class="btn" data-mem="login">以 Google 帳號登入</button>`);

  const idBar = u => `<div class="mem-bar"><span class="mem-id"><b>LOGGED IN //</b> ${esc(u.email)}</span><button class="btn ghost sm" data-mem="logout">登出</button></div>`;

  const notFound = u => idBar(u) + block('NO RECORD', '查無紀錄', `
    ${(u.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase()
      ? '<p class="mem-text">你目前以站主帳號登入。客戶資料請到 <a href="admin.html">後台</a> 管理。</p>'
      : `<p class="mem-text">找不到 <strong>${esc(u.email)}</strong> 的委託紀錄。</p>
         <div class="prose lined"><ul><li>請確認登入的 Gmail 與委託時提供的相同</li><li>新委託的紀錄需要等站方建立後才會出現</li><li>如果換過信箱，請來信告知以便更新</li></ul></div>`}`);

  const view = (u, { client, records }) => {
    const list = [...records].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.created || 0) - (a.created || 0));
    const pts = list.reduce((t, r) => t + (Number(r.points) || 0), 0);
    const live = list.filter(r => r.status !== '已取消');
    const spent = live.reduce((t, r) => t + (Number(r.amount) || 0), 0);
    const jobs = live.filter(r => Number(r.amount) > 0).length;
    const stCls = st => ({ '已完成': 'done', '製作中': 'active', '已付款': 'active', '洽談中': 'pending', '已取消': 'cancel', '點數調整': 'adjust' })[st] || 'pending';
    return idBar(u) + `
      <div class="mem-hello">${client.name ? `<b>${esc(client.name)}</b>，` : ''}你好。</div>
      <div class="mem-stats">
        <div class="stat main"><small>POINTS // 目前點數</small><b>${fmt(pts)}</b><span>PT</span></div>
        <div class="stat"><small>ORDERS // 委託次數</small><b>${fmt(jobs)}</b></div>
        <div class="stat"><small>TOTAL // 累計金額</small><b><i>NT$</i>${fmt(spent)}</b></div>
      </div>
      ${block('LOG', '交易紀錄', list.length ? `
        <table class="rec-table">
          <thead><tr><th>日期</th><th>項目</th><th>狀態</th><th class="r">金額</th><th class="r">點數</th><th>備註</th></tr></thead>
          <tbody>${list.map(r => {
            const p = Number(r.points) || 0;
            return `<tr class="${r.status === '已取消' ? 'cancel' : ''}">
              <td class="mono" data-l="日期">${esc(r.date || '')}</td>
              <td data-l="項目"><b>${esc(r.title || '')}</b></td>
              <td data-l="狀態"><span class="st st-${stCls(r.status)}">${esc(r.status || '')}</span></td>
              <td class="r mono" data-l="金額">${Number(r.amount) ? 'NT$ ' + fmt(r.amount) : '—'}</td>
              <td class="r mono pt ${p > 0 ? 'plus' : p < 0 ? 'minus' : ''}" data-l="點數">${p > 0 ? '+' : ''}${p ? fmt(p) : '—'}</td>
              <td class="memo" data-l="備註">${esc(r.memo || '')}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>` : '<p class="empty">目前沒有紀錄。</p>')}`;
  };

  S.onAuth(async u => {
    if (!u) return render(loginBox());
    render('<p class="empty">讀取中…</p>');
    try {
      const r = await S.getMyRecords(u.email);
      render(r ? view(u, r) : notFound(u));
    } catch (e) {
      console.error(e);
      render(idBar(u) + `<p class="error">讀取失敗：${esc(e.message)}</p>`);
    }
  });

  main.addEventListener('click', async e => {
    const b = e.target.closest('[data-mem]');
    if (!b) return;
    if (b.dataset.mem === 'logout') return S.signOut();
    try {
      b.disabled = true;
      await S.signIn(DEMO ? (document.getElementById('demoEmail')?.value || '').trim() : undefined);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') alert('登入失敗：' + err.message);
    } finally { b.disabled = false; }
  });
}

// ================= 圖片 =================
function hydrate(root = document) {
  root.querySelectorAll('img[data-thumb]:not([src])').forEach(async img => {
    const src = await S.getThumb(img.dataset.thumb);
    if (src) img.src = src; else img.closest('.card-img')?.classList.add('noimg');
  });
  root.querySelectorAll('[data-full]').forEach(async el => {
    const src = (await S.getImage(el.dataset.full)) || (await S.getThumb(el.dataset.full));
    if (src) { el.style.setProperty('--hero-img', `url("${src}")`); el.classList.add('has-img'); }
  });
}

function gallery(ids, start = 0) {
  let i = start;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `
    <button class="lb-close" aria-label="關閉">×</button>
    ${ids.length > 1 ? '<button class="lb-prev" aria-label="上一張">‹</button><button class="lb-next" aria-label="下一張">›</button>' : ''}
    <figure><img alt=""><figcaption></figcaption></figure>`;
  document.body.appendChild(box);
  document.body.style.overflow = 'hidden';
  const img = box.querySelector('img'), cap = box.querySelector('figcaption');
  const show = async () => {
    const id = ids[i];
    cap.textContent = `${pad(i + 1)} / ${pad(ids.length)}`;
    img.src = (await S.getThumb(id)) || '';
    const full = await S.getImage(id);
    if (full && ids[i] === id) img.src = full;
  };
  const close = () => { box.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
  const go = d => { i = (i + d + ids.length) % ids.length; show(); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); };
  box.addEventListener('click', e => {
    if (e.target.closest('.lb-prev')) go(-1);
    else if (e.target.closest('.lb-next')) go(1);
    else if (e.target === box || e.target.closest('.lb-close')) close();
  });
  document.addEventListener('keydown', key);
  show();
}
