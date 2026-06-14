import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

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

const COLLECTIONS_TO_DELETE = [
  "investors",
  "shareTransactions",
  "transactions",
  "pnlRecords",
  "freeShares",
  "freeSharePayments",
  "returnPayments"
];

const runCleanup = async () => {
  try {
    console.log("Starting Firebase Firestore cleanup...");

    // 1. Check existing users (Should not delete these, just audit them)
    console.log("\n--- Users (Will NOT be deleted) ---");
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.empty) {
      console.log("No users found.");
    } else {
      usersSnap.forEach(doc => {
        const data = doc.data();
        console.log(`User ID: ${doc.id} | Name: ${data.name} | Email: ${data.email} | Role: ${data.role}`);
      });
    }

    // 2. Delete test data collections
    for (const colName of COLLECTIONS_TO_DELETE) {
      console.log(`\n--- Cleaning collection: ${colName} ---`);
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      if (snap.empty) {
        console.log(`Collection ${colName} is already empty.`);
        continue;
      }

      let count = 0;
      for (const document of snap.docs) {
        await deleteDoc(doc(db, colName, document.id));
        count++;
      }
      console.log(`Deleted ${count} documents from ${colName}.`);
    }

    // 3. Reset system funds
    console.log("\n--- Resetting System Funds ---");
    const fundsRef = doc(db, "system", "funds");
    await setDoc(fundsRef, {
      companyFund: 0,
      reserveFund: 0
    });
    console.log("system/funds reset to { companyFund: 0, reserveFund: 0 } successfully.");

    console.log("\nDatabase cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed with error:", error);
    process.exit(1);
  }
};

runCleanup();
