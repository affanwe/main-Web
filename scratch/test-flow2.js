import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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

const runTest = async () => {
  try {
    console.log("=== Testing Woora Invest Database Operations ===");
    
    // 1. Create a dummy investor
    console.log("1. Adding Investor...");
    const invId = "999999";
    const investorRef = doc(db, "investors", invId);
    
    const investorData = {
      id: invId,
      name: "Auto Test Investor",
      email: "auto@test.com",
      shares: 2,
      amount: 1000,
      investments: [{
        shares: 2,
        amount: 1000,
        joiningDate: new Date().toISOString(),
        activationDate: new Date().toISOString(),
        status: 'Active',
        paymentMethod: 'Cash',
        trxId: 'TEST-BUY-1'
      }]
    };
    
    await setDoc(investorRef, investorData);
    console.log("   -> Success: Investor added!");

    // 2. Read Investor
    console.log("2. Fetching Investors...");
    const snap = await getDocs(collection(db, "investors"));
    let found = false;
    snap.forEach(d => {
      if(d.id === invId) found = true;
    });
    if(!found) throw new Error("Investor not found after adding.");
    console.log("   -> Success: Investor retrieved from list!");

    // 3. Delete Investor
    console.log("3. Deleting Investor (Cleanup)...");
    await deleteDoc(investorRef);
    console.log("   -> Success: Investor deleted!");

    // 4. Test Funds Access
    console.log("4. Checking system funds...");
    const fundsRef = doc(db, 'system', 'funds');
    const fsnap = await getDocs(collection(db, 'system'));
    let fundsOk = false;
    fsnap.forEach(d => {
      if(d.id === 'funds') fundsOk = true;
    });
    if(!fundsOk) throw new Error("Funds document missing.");
    console.log("   -> Success: Funds document exists!");

    console.log("=== All core database operations passed without errors! ===");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

runTest();
