import { firebaseConfig } from '../config.js?v=20261124j';

export const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR');

// 兩個後端有相同的介面：loadAll / getThumb / getImage / save* / uploadImage / deleteImage / onAuth / signIn / signOut
export const store = DEMO ? import('./backend-demo.js?v=20261124j') : import('./backend-firebase.js?v=20261124j');
