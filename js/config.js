// ==========================================================
//  Firebase 設定：到 Firebase 主控台 → 專案設定 → 你的應用程式
//  把 firebaseConfig 整段貼上來取代下面的內容。
//  還沒填的時候，網站會自動進入「示範模式」（資料只存在這台瀏覽器）。
// ==========================================================
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "",
  appId: ""
};

// 唯一可以登入後台的 Google 帳號（要和 firestore.rules 裡的一樣）
export const OWNER_EMAIL = "you@gmail.com";
