import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBV4NLfWBqJH4YzFqBV6XJdM52CGInv-Kk",
  authDomain: "woora-database.firebaseapp.com",
  projectId: "woora-database",
  storageBucket: "woora-database.firebasestorage.app",
  messagingSenderId: "916363246901",
  appId: "1:916363246901:web:30d30f5721cc3da285207c",
  measurementId: "G-4SCG4LKDTN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const test = async () => {
  try {
    const snap = await getDocs(collection(db, "users"));
    console.log("Empty?", snap.empty);
    const defaultAdmin = {
      id: "100",
      name: "Super Admin",
      email: "momsudul06@gmail.com",
      phone: "01700000000",
      nid: "1234567890",
      password: "admin",
      role: "Founder"
    };
    await setDoc(doc(db, "users", "100"), defaultAdmin);
    console.log("Created successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
};

test();
