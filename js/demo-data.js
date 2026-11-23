// 示範內容（也作為後台「匯入範本」用的初始內容）。全部都可以在後台修改。

function ph(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#C8C8C8"/><text x="450" y="610" font-size="40" text-anchor="middle" fill="#9A9A9A" font-family="monospace" letter-spacing="6">${label}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}


export const DEMO_IMAGES = {
  'demo-a1': ph('設定稿 01'), 'demo-a2': ph('設定稿 02'),
  'demo-b1': ph('設定書 01'), 'demo-b2': ph('設定書 02'), 'demo-b3': ph('設定書 03'),
  'demo-c1': ph('短篇 01'), 'demo-d1': ph('小傳 01'), 'demo-e1': ph('校對 01'),
};

export const DEMO_DATA = {
  settings: {
    siteName: '麥的委託價目表',
    subtitle: '原創角色設定・角色文字・校對潤稿',
    status: 'open',
    statusText: '【 商用 】\n可來信詢問\n【 非商用 】\n預計2027年2月開放',
    announcement: '目前開放 1–2 月檔期，名額以收到完整委託表單的順序為準。\n\n委託前請務必先閱讀〈委託須知〉，送出委託即視為已閱讀並同意。',
    accent: '#AAA55A',
    marquee: '/// COMMISSION OPEN /// 2027.01 檔期剩 2 名 /// 委託前請先閱讀委託須知 ///',
    heroTitle: 'COMMISSION',
    heroImage: '',
    logo: '',
    footerText: '本站文字與範例皆為原創作品，請勿轉載或模仿。',
    commercialRate: 2,
    commercialNote: '商業用途以表定價格 × 2 計算，請於委託時說明用途。',
  },
  content: {
    process: [
      { title: '填寫委託表單', desc: '依〈關於與聯絡〉的方式寄出表單與角色資料。' },
      { title: '確認報價與檔期', desc: '約 3 個工作天內回覆是否接受，並提供正式報價。' },
      { title: '付款', desc: '確認後 3 天內完成付款，逾期名額會釋出給候補。' },
      { title: '排單等待', desc: '依付款順序排入檔期。' },
      { title: '草稿確認', desc: '提供草稿或大綱，可在此階段提出修改。' },
      { title: '完稿交付', desc: '交付完稿檔案，委託完成。' },
    ],
    payment: [
      { name: '銀行轉帳', note: '付款後請提供帳號末五碼' },
      { name: '街口支付 / LINE Pay', note: '' },
      { name: 'PayPal', note: '海外委託適用，手續費由委託人負擔' },
    ],
    paymentNote: '原則上全額預付；總額超過 NT$5,000 可分兩期（訂金 50%）。',
    rules: [
      { id: 'r1', title: '委託前須知', body: '- 送出委託即視為已閱讀並同意本須知全部內容。\n- 不保證接受每一件委託，有權拒絕不適合的題材。\n- 約稿不是必需品，請在能力範圍內理性消費。' },
      { id: 'r2', title: '接受與不接受的內容', body: '**接受**\n- 原創角色、TRPG 角色、企劃角色\n- 同人角色（視內容而定）\n\n**不接受**\n- R18、獵奇、真人相關內容\n- 政治或宗教宣傳用途\n- 以 AI 生成內容作為參考或素材\n- 多人共同審稿（請由一位窗口統一回覆）' },
      { id: 'r3', title: '修改', body: '- 草稿階段可免費修改 2 次，請盡量一次列出所有意見。\n- 完稿後僅修正與設定不符的部分。\n- 超出次數或大幅變更方向，會另外報價。' },
      { id: 'r4', title: '交期', body: '- 一般排單約 1–3 個月，請預留充足時間。\n- 急件（14 天內交付）加收 50%，請先詢問是否可接。\n- 如遇身體狀況或不可抗力，會主動告知並協調延期。' },
      { id: 'r5', title: '使用範圍與版權', body: '- 著作權歸作者所有，委託人取得使用權。\n- 個人非營利用途：社群頭像、個人網站、企劃使用、20 份以內的自用小物。\n- 商業用途須事先告知，另計商用費用。\n- 作者保留將作品縮圖或節錄公開於作品集的權利；不希望公開請事先說明，加收原價 50%。' },
      { id: 'r6', title: '禁止事項', body: '- 冒充作者，或讓人誤會作品出自他人之手\n- 去除署名後轉載、轉售或再授權給第三方\n- 用於 AI 訓練、生成或任何資料蒐集用途\n- 用於違法、誹謗、中傷他人的用途\n- 公開討論委託時誇大或扭曲事實' },
      { id: 'r7', title: '取消與退款', body: '- 開始製作前：可全額退款。\n- 草稿完成後取消：退還 50%。\n- 完稿後：不接受退款。\n- 作者因個人因素無法完成：全額退還。\n- 超過 30 天聯繫不上委託人，視為放棄委託，款項不退還。' },
    ],
    faqs: [
      { id: 'f1', q: '怎麼知道目前還有沒有名額？', a: '首頁的狀態章會顯示目前是開放、候補或暫停，名額資訊也會寫在旁邊。' },
      { id: 'f2', q: '可以指定交件日期嗎？', a: '可以，請在表單中填寫死線。死線距離目前檔期太近時可能無法接受，或需以急件計價。' },
      { id: 'f3', q: '為什麼一定要填表單？', a: '表單可以避免遺漏資訊，也方便排單管理。資料越完整，成品越貼近你的想像。' },
      { id: 'f4', q: '作品會公開嗎？', a: '預設會在交付後以縮圖或節錄形式放進作品集。不希望公開請在委託時說明（加收原價 50%）。' },
      { id: 'f5', q: '價目表上沒有的項目可以委託嗎？', a: '可以來信詢問，但不保證接受。' },
    ],
    addons: [
      { id: 'a1', name: '急件（14 天內）', mode: 'percent', price: 50, note: '需事先詢問' },
      { id: 'a2', name: '不公開作品', mode: 'percent', price: 50, note: '' },
      { id: 'a3', name: '追加修改', mode: 'fixed', price: 200, note: '每次，依幅度調整' },
      { id: 'a4', name: '複雜設定 / 大量資料閱讀', mode: 'text', price: null, priceText: '另議', note: '' },
    ],
    addonsNote: '加價項目以基本價格計算，多項可疊加。',
    memberNote: '- 每消費 NT$10 累積 1 點，完稿後入帳。\n- 100 點可折抵 NT$100，請於委託時告知要折抵的點數。\n- 點數不可兌換現金、不可轉讓。',
    privacyNote: '本頁只會顯示與你登入的 Google 帳號相同 Email 的紀錄。\n站方僅保存 Email、暱稱與委託紀錄，用於委託聯繫與點數計算；如需刪除資料請來信告知。',
    about: {
      name: '麥',
      bio: '寫字的人，主要創作原創奇幻與角色故事。\n喜歡替角色找到他們自己的聲音。',
      avatar: '',
      links: [
        { label: 'Plurk', url: 'https://www.plurk.com/' },
        { label: 'X', url: 'https://x.com/' },
      ],
      email: 'commission@example.com',
      contactNote: '委託請一律以 Email 聯繫，信件標題格式：【日期】暱稱－委託項目－死線。\n約 3 個工作天內回覆，未收到回覆請檢查垃圾郵件匣。',
      official: [
        { platform: 'Plurk', account: '@your_plurk_id' },
        { platform: 'Email', account: 'commission@example.com' },
      ],
      officialNote: '本人只使用以下帳號接洽委託，其他帳號主動私訊接案皆為冒充，請小心詐騙。',
    },
  },
  categories: [
    {
      id: 'c1', name: '角色設定', desc: '從零開始或依既有概念，整理成可直接使用的角色設定。', notes: '價格依角色複雜度浮動，表定為底價。', visible: true,
      items: [
        { id: 'i1', name: '基礎設定稿', spec: '約 1,500 字・外貌 / 個性 / 背景', price: 1500, priceTo: null, suffix: '起', desc: '適合企劃報名、TRPG 角色卡。', images: [], visible: true },
        { id: 'i2', name: '完整設定書', spec: '約 5,000 字・含人際關係與年表', price: 3800, priceTo: null, suffix: '起', desc: '附排版 PDF。', images: [], visible: true },
      ],
    },
    {
      id: 'c2', name: '文字委託', desc: '角色短篇、小傳、互動劇情。', notes: '', visible: true,
      items: [
        { id: 'i3', name: '角色短篇', spec: '3,000 字以內', price: 1200, priceTo: 2000, suffix: '', desc: '', images: [], visible: true },
        { id: 'i4', name: '角色小傳', spec: '800 字以內', price: 600, priceTo: null, suffix: '起', desc: '', images: [], visible: true },
      ],
    },
    {
      id: 'c3', name: '校對潤稿', desc: '錯字、標點、語句通順度與角色口吻一致性。', notes: '', visible: true,
      items: [
        { id: 'i5', name: '中文校對', spec: '以原文字數計算', price: 300, priceTo: null, suffix: '/ 千字', desc: '', images: [], visible: true },
      ],
    },
  ],
};

// 後台「匯入範本」用：同樣內容但不含示範圖片
export const TEMPLATE = (() => {
  const t = JSON.parse(JSON.stringify(DEMO_DATA));
  t.categories.forEach(c => c.items.forEach(i => (i.images = [])));
  t.settings.heroImage = '';
  return t;
})();

// 示範客戶（只在示範模式使用）
export const DEMO_CLIENTS = {
  'client@example.com': {
    info: { email: 'client@example.com', name: '示範客戶 小林', points: 180, count: 3, lastDate: '2026-11-02', created: '2026-08-10' },
    note: '喜歡冷色調，溝通順暢。（這是站主私人備註，客戶看不到）',
    records: {
      r1: { date: '2026-08-12', title: '基礎設定稿', amount: 1500, points: 150, status: '已完成', memo: '感謝委託！' },
      r2: { date: '2026-10-01', title: '點數折抵', amount: 0, points: -100, status: '點數調整', memo: '折抵角色小傳 NT$100' },
      r3: { date: '2026-11-02', title: '角色小傳', amount: 600, points: 130, status: '製作中', memo: '預計 12 月中交付草稿' },
    },
  },
};
