import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQq8jLSEVrf1mqHDRKNig5URCF_ACNZCM",
  authDomain: "wooratry.firebaseapp.com",
  projectId: "wooratry",
  storageBucket: "wooratry.firebasestorage.app",
  messagingSenderId: "986172487449",
  appId: "1:986172487449:web:59f3590479dacabd41b788",
  measurementId: "G-WEP123R00N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
