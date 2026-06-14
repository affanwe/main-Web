import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
const db = getFirestore(app);

try {
  const docRef = doc(db, 'system', 'emailjs');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("FIRESTORE_SETTINGS:", JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("No document system/emailjs found in Firestore!");
  }
} catch (err) {
  console.error("Firestore read error:", err);
}
process.exit(0);
