// ==========================================================
//  Firebase 設定：到 Firebase 主控台 → 專案設定 → 你的應用程式
//  把 firebaseConfig 整段貼上來取代下面的內容。
//  還沒填的時候，網站會自動進入「示範模式」（資料只存在這台瀏覽器）。
// ==========================================================
export const firebaseConfig = {
  apiKey: "AIzaSyAkD0-mVT5ONRer7-uwkYoZBYK7BmW4oUU",
  authDomain: "work-4ed9f.firebaseapp.com",
  projectId: "work-4ed9f",
  storageBucket: "work-4ed9f.firebasestorage.app",
  messagingSenderId: "186006198481",
  appId: "1:186006198481:web:c0d65293b778efafb00df0"
};
// 唯一可以登入後台的 Google 帳號（要和 firestore.rules 裡的一樣）
export const OWNER_EMAIL = "workkxx@gmail.com";
