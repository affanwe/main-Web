import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

const run = async () => {
  try {
    const docRef = doc(db, 'system', 'emailjs');
    await setDoc(docRef, {
      sellServiceId: "service_uwvbbdg",
      sellPublicKey: "ZQLWtqA2HF60AbQJV",
      sellTemplateId: "template_o4y4qso",
      transferServiceId: "service_uwvbbdg",
      transferPublicKey: "ZQLWtqA2HF60AbQJV",
      transferTemplateId: "template_hc92nqe"
    }, { merge: true });
    console.log("Firestore settings updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating Firestore settings:", err);
    process.exit(1);
  }
};

run();
