import { db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, runTransaction } from 'firebase/firestore';

const ensureSystemDoc = async () => {
  const systemRef = doc(db, 'system', 'funds');
  const snap = await getDoc(systemRef);
  if (!snap.exists()) {
    await setDoc(systemRef, { companyFund: 0, reserveFund: 0 });
  }
};

export const logShareTransaction = async (tx) => {
  const txRef = doc(collection(db, "shareTransactions"), tx.id);
  await setDoc(txRef, {
    ...tx,
    date: tx.date || new Date().toISOString()
  });
};

export const getShareTransactions = async () => {
  const querySnapshot = await getDocs(collection(db, "shareTransactions"));
  const list = [];
  querySnapshot.forEach((doc) => list.push(doc.data()));
  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const loginUser = async (email, password) => {
  const usersRef = collection(db, "users");
  
  // Check if any users exist at all
  const allUsersSnap = await getDocs(usersRef);
  if (allUsersSnap.empty) {
    // Auto-create default admin
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
  }

  const q = query(usersRef, where("email", "==", email), where("password", "==", password));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};

export const getUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  const list = [];
  querySnapshot.forEach((doc) => list.push(doc.data()));
  return list;
};

export const addUser = async (user) => {
  let nextId = 101;
  const users = await getUsers();
  if (users.length > 0) {
    let maxId = 100;
    users.forEach(u => {
      let numStr = u.id ? u.id.toString().replace(/\D/g, '') : '';
      let num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });
    nextId = maxId + 1;
  }
  user.id = nextId.toString();
  await setDoc(doc(db, "users", user.id), user);
  return user;
};

export const updateUser = async (id, updates) => {
  const userRef = doc(db, "users", id.toString());
  await updateDoc(userRef, updates);
};

export const deleteUser = async (id) => {
  const userRef = doc(db, "users", id.toString());
  await deleteDoc(userRef);
};

export const addInvestor = async (investor) => {
  if (!investor.id) {
    investor.id = await getNextInvestorId();
  }
  
  // Set defaults for purely profile creation
  investor.shares = parseInt(investor.shares, 10) || 0;
  investor.amount = investor.shares * 500;
  
  if (investor.shares === 0) {
    // If no shares are being purchased, initialize empty investments array
    investor.investments = [];
    investor.status = investor.status || 'Pending';
    // Remove transaction-specific keys that don't belong to the base profile
    delete investor.trxId;
    delete investor.joiningDate;
    delete investor.activationDate;
    delete investor.paymentMethod;
    
    await setDoc(doc(db, "investors", investor.id.toString()), investor);
  } else {
    // Legacy support: if shares are provided during creation
    const txId = 'BUY' + Math.floor(100000 + Math.random() * 900000).toString();
    investor.trxId = txId;
    
    if (!investor.investments) {
      investor.investments = [{
        shares: investor.shares,
        amount: investor.amount,
        joiningDate: investor.joiningDate,
        activationDate: investor.activationDate,
        status: investor.status || 'Pending',
        paymentMethod: investor.paymentMethod || 'Cash',
        trxId: txId
      }];
    }
    
    await setDoc(doc(db, "investors", investor.id.toString()), investor);
    
    // Log share transaction
    await logShareTransaction({
      id: txId,
      type: 'BUY',
      investorId: investor.id,
      investorName: investor.name,
      shares: investor.shares,
      amount: investor.amount,
      paymentMethod: investor.paymentMethod || 'Cash',
      date: investor.joiningDate ? new Date(investor.joiningDate).toISOString() : new Date().toISOString()
    });
  }
  
  return investor;
};

export const getInvestors = async () => {
  const querySnapshot = await getDocs(collection(db, "investors"));
  const list = [];
  querySnapshot.forEach((doc) => {
    let data = doc.data();
    // Legacy migration
    if (!data.investments) {
      data.investments = [{
        shares: parseInt(data.shares) || 0,
        amount: parseInt(data.amount) || 0,
        joiningDate: data.joiningDate,
        activationDate: data.activationDate,
        status: data.status,
        paymentMethod: data.paymentMethod,
        trxId: data.trxId
      }];
    }
    list.push(data);
  });
  return list;
};

export const updateInvestor = async (id, updates) => {
  const invRef = doc(db, "investors", id.toString());
  // Recalculate totals if investments array is updated directly
  if (updates.investments) {
    let tShares = 0;
    let tAmount = 0;
    updates.investments.forEach(inv => {
      tShares += parseInt(inv.shares, 10) || 0;
      tAmount += parseInt(inv.amount, 10) || 0;
    });
    updates.shares = tShares;
    updates.amount = tAmount;
  } else if (updates.shares) {
      updates.shares = parseInt(updates.shares, 10) || 0;
      updates.amount = updates.shares * 500;
  }
  await updateDoc(invRef, updates);
};

export const addShareToInvestor = async (id, newShare) => {
  const invRef = doc(db, "investors", id.toString());
  const snap = await getDoc(invRef);
  if (snap.exists()) {
    let data = snap.data();
    if (!data.investments) {
      data.investments = [{
        shares: parseInt(data.shares) || 0,
        amount: parseInt(data.amount) || 0,
        joiningDate: data.joiningDate,
        activationDate: data.activationDate,
        status: data.status,
        paymentMethod: data.paymentMethod,
        trxId: data.trxId
      }];
    }
    
    newShare.shares = parseInt(newShare.shares, 10) || 0;
    newShare.amount = newShare.shares * 500;
    
    // Generate BUY transaction ID
    const txId = 'BUY' + Math.floor(100000 + Math.random() * 900000).toString();
    newShare.trxId = txId;
    
    data.investments.push(newShare);
    
    let tShares = 0;
    let tAmount = 0;
    data.investments.forEach(inv => {
      tShares += inv.shares;
      tAmount += inv.amount;
    });
    
    const updates = {
      investments: data.investments,
      shares: tShares,
      amount: tAmount
    };
    
    // If this is their first ever share purchase, set the top-level info
    if (data.investments.length === 1) {
      updates.joiningDate = newShare.joiningDate;
      updates.activationDate = newShare.activationDate;
      updates.paymentMethod = newShare.paymentMethod;
      updates.trxId = newShare.trxId;
    }
    
    await updateDoc(invRef, updates);
    
    // Log share transaction
    await logShareTransaction({
      id: txId,
      type: 'BUY',
      investorId: id,
      investorName: data.name,
      shares: newShare.shares,
      amount: newShare.amount,
      paymentMethod: newShare.paymentMethod || 'Cash',
      date: newShare.joiningDate ? new Date(newShare.joiningDate).toISOString() : new Date().toISOString()
    });
    
    return txId;
  }
  return null;
};

export const sellSharesFromInvestor = async (id, sharesToSell, editedBy) => {
  const invRef = doc(db, "investors", id.toString());
  const snap = await getDoc(invRef);
  if (!snap.exists()) throw new Error("Investor not found");
  
  let data = snap.data();
  if (!data.investments || data.investments.length === 0) throw new Error("No investments found to sell");
  
  let totalCurrentShares = 0;
  data.investments.forEach(inv => {
    totalCurrentShares += parseInt(inv.shares, 10) || 0;
  });
  
  if (sharesToSell <= 0 || sharesToSell > totalCurrentShares) {
    throw new Error("Invalid number of shares to sell. You cannot sell more than the investor owns.");
  }
  
  const refundAmount = sharesToSell * 500;
  
  // Deduct from reserve fund first (will throw if insufficient)
  await deductFund('reserve', refundAmount, `Refund for selling ${sharesToSell} shares from Investor ID ${id}`, editedBy);
  
  // Generate SELL transaction ID
  const txId = 'SELL' + Math.floor(100000 + Math.random() * 900000).toString();
  
  let remainingToSell = sharesToSell;
  
  // Deduct from newest blocks first
  for (let i = data.investments.length - 1; i >= 0; i--) {
    const block = data.investments[i];
    const blockShares = parseInt(block.shares, 10) || 0;
    
    if (remainingToSell <= 0) break;
    
    if (blockShares <= remainingToSell) {
      // Remove entire block
      remainingToSell -= blockShares;
      data.investments.splice(i, 1);
    } else {
      // Reduce block
      block.shares = blockShares - remainingToSell;
      block.amount = block.shares * 500;
      remainingToSell = 0;
    }
  }
  
  // Recalculate totals
  let tShares = 0;
  let tAmount = 0;
  data.investments.forEach(inv => {
    tShares += parseInt(inv.shares, 10) || 0;
    tAmount += parseInt(inv.amount, 10) || 0;
  });
  
  await updateDoc(invRef, {
    investments: data.investments,
    shares: tShares,
    amount: tAmount
  });
  
  // Log share transaction
  await logShareTransaction({
    id: txId,
    type: 'SELL',
    investorId: id,
    investorName: data.name,
    shares: sharesToSell,
    amount: refundAmount,
    paymentMethod: 'Refund to Reserve Fund',
    date: new Date().toISOString()
  });
  
  return txId;
};
export const deleteInvestor = async (id, amount) => {
  const invRef = doc(db, "investors", id.toString());
  await deleteDoc(invRef);
  
  // Create a record in transactions so it shows up that money left
  try {
    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, { 
      type: 'REFUND/DELETE', 
      fund: 'investor', 
      amount: amount || 0, 
      reason: `Investor ID ${id} deleted`, 
      date: new Date().toISOString(), 
      userId: 'System' 
    });
  } catch (e) {
    console.error("Failed to add transaction for deleted investor", e);
  }
};

export const getPnlRecords = async () => {
  const querySnapshot = await getDocs(collection(db, "pnlRecords"));
  const list = [];
  querySnapshot.forEach((doc) => list.push(doc.data()));
  return list;
};

export const addPnLRecord = async (record) => {
  await ensureSystemDoc();
  const netProfit = record.revenue - record.cost;
  record.netProfit = netProfit;
  record.investorShare = netProfit * 0.4;
  record.companyShare = netProfit * 0.4;
  record.reserveShare = netProfit * 0.2;
  
  const pnlRef = doc(collection(db, "pnlRecords"));
  await setDoc(pnlRef, record);
  
  // Add to funds
  const systemRef = doc(db, 'system', 'funds');
  const snap = await getDoc(systemRef);
  const currentFunds = snap.data();
  await updateDoc(systemRef, {
      companyFund: currentFunds.companyFund + record.companyShare,
      reserveFund: currentFunds.reserveFund + record.reserveShare
  });
  
  return record;
};

export const getFunds = async () => {
  await ensureSystemDoc();
  const systemRef = doc(db, 'system', 'funds');
  const snap = await getDoc(systemRef);
  return snap.data();
};

export const deductFund = async (type, amount, reason, userId) => {
  await ensureSystemDoc();
  const systemRef = doc(db, 'system', 'funds');
  const snap = await getDoc(systemRef);
  const currentFunds = snap.data();
  
  let newCompanyFund = currentFunds.companyFund;
  let newReserveFund = currentFunds.reserveFund;

  if (type === 'company' && currentFunds.companyFund >= amount) {
    newCompanyFund -= amount;
  } else if (type === 'reserve' && currentFunds.reserveFund >= amount) {
    newReserveFund -= amount;
  } else {
    throw new Error('Insufficient funds');
  }
  
  await updateDoc(systemRef, {
      companyFund: newCompanyFund,
      reserveFund: newReserveFund
  });
  
  const txRef = doc(collection(db, "transactions"));
  await setDoc(txRef, { type: 'DEDUCTION', fund: type, amount, reason, date: new Date().toISOString(), userId: userId || 'N/A' });
};

export const getTransactions = async () => {
  const querySnapshot = await getDocs(collection(db, "transactions"));
  const list = [];
  querySnapshot.forEach((doc) => list.push(doc.data()));
  return list;
};

export const awardFreeShareRecord = async (investorId, referrerName) => {
  const userStr = localStorage.getItem('woora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user.id : 'N/A';

  // Deduct 500 from Company Fund
  await deductFund('company', 500, `Free share awarded to ${investorId} for referrals`, userId);

  // Add a document to "freeShares" collection
  const freeShareRef = doc(collection(db, "freeShares"));
  const dateAwarded = new Date().toISOString();
  await setDoc(freeShareRef, {
    id: freeShareRef.id,
    investorId: investorId.toString(),
    investorName: referrerName,
    dateAwarded: dateAwarded,
    sharesCount: 1
  });

  // Update investor's awardedFreeShares count
  const invRef = doc(db, "investors", investorId.toString());
  const snap = await getDoc(invRef);
  if (snap.exists()) {
    const currentAwarded = snap.data().awardedFreeShares || 0;
    await updateDoc(invRef, {
      awardedFreeShares: currentAwarded + 1
    });
  }
};

export const getFreeShares = async () => {
  const querySnapshot = await getDocs(collection(db, "freeShares"));
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push(doc.data());
  });
  return list;
};

export const getFreeSharePayments = async (year, month) => {
  const q = query(
    collection(db, "freeSharePayments"),
    where("year", "==", parseInt(year, 10)),
    where("month", "==", month)
  );
  const querySnapshot = await getDocs(q);
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push(doc.data());
  });
  return list;
};

export const saveFreeSharePayment = async (payment) => {
  const docId = `${payment.investorId}_${payment.year}_${payment.month}`;
  const payRef = doc(db, "freeSharePayments", docId);
  await setDoc(payRef, {
    ...payment,
    id: docId,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
};

export const getShareStatus = (joiningDateStr, targetYear, targetMonthName) => {
  if (!joiningDateStr) return 'Pending';
  const joinDate = new Date(joiningDateStr);
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth(); // 0-based
  
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const targetMonthIndex = months.indexOf(targetMonthName);
  if (targetMonthIndex === -1) return 'Pending';
  
  const diffMonths = (targetYear - joinYear) * 12 + (targetMonthIndex - joinMonth);
  
  if (diffMonths <= 0) {
    return 'Pending';
  } else {
    return 'Active';
  }
};

export const getReturnPayments = async (year, month) => {
  const q = query(
    collection(db, "returnPayments"),
    where("year", "==", parseInt(year, 10)),
    where("month", "==", month)
  );
  const querySnapshot = await getDocs(q);
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push(doc.data());
  });
  return list;
};

export const saveReturnPayment = async (payment) => {
  const docId = `${payment.investorId}_${payment.year}_${payment.month}`;
  const payRef = doc(db, "returnPayments", docId);
  await setDoc(payRef, {
    ...payment,
    id: docId,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
};

export const recordPayout = async (payout, payAmount, userId) => {
  const docId = `${payout.investorId}_${payout.year}_${payout.month}`;
  const payRef = doc(db, "returnPayments", docId);
  await setDoc(payRef, {
    ...payout,
    id: docId,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
  
  const txRef = doc(collection(db, "transactions"));
  await setDoc(txRef, {
    type: 'PAYOUT',
    fund: 'investor',
    amount: parseFloat(payAmount),
    reason: `Monthly Return Payout to Investor ID ${payout.investorId} for ${payout.month} ${payout.year}`,
    date: new Date().toISOString(),
    userId: userId || 'System'
  });
};

export const transferShares = async (fromId, toId, blockIndex, qty, authorizedBy) => {
  const fromRef = doc(db, "investors", fromId.toString());
  const toRef = doc(db, "investors", toId.toString());

  const fromSnap = await getDoc(fromRef);
  const toSnap = await getDoc(toRef);

  if (!fromSnap.exists()) throw new Error(`Sender Investor ID ${fromId} not found`);
  if (!toSnap.exists()) throw new Error(`Recipient Investor ID ${toId} not found`);

  let fromData = fromSnap.data();
  let toData = toSnap.data();

  if (!fromData.investments || !fromData.investments[blockIndex]) {
    throw new Error("Selected investment block not found on sender");
  }

  const block = fromData.investments[blockIndex];
  const blockShares = parseInt(block.shares, 10) || 0;

  if (qty <= 0 || qty > blockShares) {
    throw new Error(`Invalid transfer quantity: cannot exceed block shares of ${blockShares}`);
  }

  // Generate TRANS transaction ID
  const txId = 'TRANS' + Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Reduce block shares from sender
  const transferAmount = qty * 500;
  if (blockShares === qty) {
    fromData.investments.splice(blockIndex, 1);
  } else {
    block.shares = blockShares - qty;
    block.amount = block.shares * 500;
  }

  // Recalculate sender totals
  let fromTShares = 0;
  let fromTAmount = 0;
  fromData.investments.forEach(inv => {
    fromTShares += parseInt(inv.shares, 10) || 0;
    fromTAmount += parseInt(inv.amount, 10) || 0;
  });

  await updateDoc(fromRef, {
    investments: fromData.investments,
    shares: fromTShares,
    amount: fromTAmount
  });

  // 2. Initialize receiver investments if empty
  if (!toData.investments) {
    toData.investments = [{
      shares: parseInt(toData.shares, 10) || 0,
      amount: parseInt(toData.amount, 10) || 0,
      joiningDate: toData.joiningDate,
      activationDate: toData.activationDate,
      status: toData.status,
      paymentMethod: toData.paymentMethod || 'Cash',
      trxId: toData.trxId || ''
    }];
  }

  // Add transferred share block preserving original date characteristics
  const originalJoiningDate = block.joiningDate;
  const originalActivationDate = block.activationDate;
  const originalStatus = block.status || 'Pending';
  
  toData.investments.push({
    shares: qty,
    amount: transferAmount,
    joiningDate: originalJoiningDate,
    activationDate: originalActivationDate,
    status: originalStatus,
    paymentMethod: `Transferred from ID ${fromId}`,
    trxId: txId,
    transferDate: new Date().toISOString().split('T')[0] // To identify transfer month
  });

  // Recalculate receiver totals
  let toTShares = 0;
  let toTAmount = 0;
  toData.investments.forEach(inv => {
    toTShares += parseInt(inv.shares, 10) || 0;
    toTAmount += parseInt(inv.amount, 10) || 0;
  });

  await updateDoc(toRef, {
    investments: toData.investments,
    shares: toTShares,
    amount: toTAmount
  });

  // 3. Log a transfer transaction audit trail
  const txRef = doc(collection(db, "transactions"));
  await setDoc(txRef, {
    type: 'TRANSFER',
    fund: 'none',
    amount: parseFloat(transferAmount),
    reason: `Transferred ${qty} shares (orig. date ${originalJoiningDate}) from ID ${fromId} to ID ${toId}`,
    date: new Date().toISOString(),
    userId: authorizedBy || 'System'
  });

  // 4. Log to shareTransactions
  await logShareTransaction({
    id: txId,
    type: 'TRANSFER',
    fromInvestorId: fromId,
    fromInvestorName: fromData.name,
    toInvestorId: toId,
    toInvestorName: toData.name,
    shares: qty,
    amount: transferAmount,
    paymentMethod: 'Internal Transfer',
    date: new Date().toISOString()
  });

  return { txId, fromName: fromData.name, toName: toData.name, toEmail: toData.email };
};

export const getEmailJsSettings = async () => {
  const docRef = doc(db, 'system', 'emailjs');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return {
    publicKey: 'ktSyvmbjRztQFjNhq',
    serviceId: 'service_zssdwhn',
    otpTemplateId: 'template_42akj3o',
    receiptTemplateId: 'template_receipt'
  };
};

export const saveEmailJsSettings = async (settings) => {
  const docRef = doc(db, 'system', 'emailjs');
  await setDoc(docRef, settings, { merge: true });
};

export const getNextInvestorId = async () => {
  const counterRef = doc(db, 'system', 'counters');
  let nextId = 1001;
  
  try {
    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      if (!counterSnap.exists()) {
        transaction.set(counterRef, { nextInvestorId: 1002 });
        nextId = 1001;
      } else {
        const currentId = counterSnap.data().nextInvestorId || 1001;
        transaction.update(counterRef, { nextInvestorId: currentId + 1 });
        nextId = currentId;
      }
    });
  } catch (e) {
    console.error("Transaction failed to get next investor ID, falling back to max ID search:", e);
    const querySnapshot = await getDocs(collection(db, "investors"));
    let maxId = 1000;
    querySnapshot.forEach((doc) => {
      let numStr = doc.data().id ? doc.data().id.toString().replace(/\D/g, '') : '';
      let num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });
    nextId = maxId + 1;
    try {
      await setDoc(counterRef, { nextInvestorId: nextId + 1 });
    } catch (err) {
      console.error("Failed to write fallback nextInvestorId", err);
    }
  }
  return nextId.toString();
};

export const approveShareRequest = async (requestId, adminId) => {
  const reqRef = doc(db, "shareRequests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  
  const reqData = reqSnap.data();
  if (reqData.status !== 'Pending') throw new Error("Request is already processed");
  
  const newShare = {
    shares: parseInt(reqData.sharesCount, 10),
    amount: parseInt(reqData.amount, 10),
    joiningDate: new Date(reqData.dateRequested || new Date()).toISOString().split('T')[0],
    activationDate: '',
    status: 'Pending',
    paymentMethod: reqData.paymentMethod || 'Cash',
    trxId: reqData.trxId || ''
  };
  
  const txId = await addShareToInvestor(reqData.investorId, newShare);
  if (!txId) throw new Error("Failed to add shares to investor");
  
  await updateDoc(reqRef, {
    status: 'Approved',
    approvedBy: adminId,
    approvedAt: new Date().toISOString(),
    txId: txId
  });
  
  return txId;
};

export const rejectShareRequest = async (requestId, adminId, reason) => {
  const reqRef = doc(db, "shareRequests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  
  const reqData = reqSnap.data();
  if (reqData.status !== 'Pending') throw new Error("Request is already processed");
  
  await updateDoc(reqRef, {
    status: 'Rejected',
    rejectedBy: adminId,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason || 'N/A'
  });
};

export const markNotificationAsRead = async (notificationId) => {
  const notifRef = doc(db, "notifications", notificationId);
  await updateDoc(notifRef, { read: true });
};

export const markAllNotificationsAsRead = async () => {
  const querySnapshot = await getDocs(
    query(collection(db, "notifications"), where("read", "==", false))
  );
  const batchPromises = [];
  querySnapshot.forEach((docSnap) => {
    batchPromises.push(updateDoc(doc(db, "notifications", docSnap.id), { read: true }));
  });
  await Promise.all(batchPromises);
};



