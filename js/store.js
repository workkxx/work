import { firebaseConfig } from './config.js';

export const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR');

// 兩個後端有相同的介面：loadAll / getThumb / getImage / save* / uploadImage / deleteImage / onAuth / signIn / signOut
export const store = DEMO ? import('./backend-demo.js') : import('./backend-firebase.js');
