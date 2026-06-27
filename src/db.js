import { supabase } from './supabase';

// ============ NON-ACTIVATED INVESTORS ============

export const getUnactivatedInvestors = async () => {
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .neq('status', 'Active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const acceptInvestorAsPartner = async (investorId) => {
  const { error } = await supabase
    .from('investors')
    .update({ status: 'Active', is_activated: true, updated_at: new Date().toISOString() })
    .eq('id', investorId);
  if (error) throw error;
};

// ============ PROJECTS ============

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createProject = async (project) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProject = async (id, updates) => {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
};

export const uploadProjectImage = async (file) => {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('project-images')
    .upload(filename, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('project-images').getPublicUrl(filename);
  return data.publicUrl;
};

export const deleteProjectImage = async (url) => {
  const filename = url.split('/project-images/')[1];
  if (!filename) return;
  await supabase.storage.from('project-images').remove([filename]);
};

// ============ SHARE TRANSACTIONS ============

export const logShareTransaction = async (tx) => {
  const { error } = await supabase.from('share_transactions').insert({
    type: tx.type,
    investor_id: tx.investorId,
    investor_name: tx.investorName,
    shares: tx.shares,
    amount: tx.amount,
    payment_method: tx.paymentMethod,
    trx_id: tx.trxId || tx.id,
    from_investor_id: tx.fromInvestorId || null,
    from_name: tx.fromInvestorName || null,
    to_investor_id: tx.toInvestorId || null,
    to_name: tx.toInvestorName || null,
    user_id: tx.userId || null,
    date: tx.date || new Date().toISOString()
  });
  if (error) throw error;
};

export const getShareTransactions = async () => {
  const { data, error } = await supabase
    .from('share_transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.trx_id || row.id,
    type: row.type,
    investorId: row.investor_id,
    investorName: row.investor_name,
    shares: row.shares,
    amount: row.amount,
    paymentMethod: row.payment_method,
    trxId: row.trx_id,
    fromInvestorId: row.from_investor_id,
    fromInvestorName: row.from_name,
    toInvestorId: row.to_investor_id,
    toInvestorName: row.to_name,
    date: row.date
  }));
};

// ============ ADMIN AUTH ============

export const loginUser = async (email, password) => {
  const { data: users, error: checkError } = await supabase.from('admin_users').select('*');
  if (checkError) throw checkError;

  if (!users || users.length === 0) {
    const { error: insertErr } = await supabase.from('admin_users').insert({
      id: '100',
      name: 'Super Admin',
      email: 'momsudul06@gmail.com',
      phone: '01700000000',
      nid: '1234567890',
      password_hash: 'admin',
      role: 'Founder'
    });
    if (insertErr) throw insertErr;
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      nid: data.nid,
      role: data.role
    };
  }
  return null;
};

export const getUsers = async () => {
  const { data, error } = await supabase.from('admin_users').select('*');
  if (error) throw error;
  return (data || []).map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, nid: u.nid, role: u.role, password: u.password_hash
  }));
};

export const addUser = async (user) => {
  const users = await getUsers();
  let maxId = 100;
  users.forEach(u => {
    const num = parseInt(String(u.id).replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxId) maxId = num;
  });
  const nextId = (maxId + 1).toString();

  const { error } = await supabase.from('admin_users').insert({
    id: nextId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    nid: user.nid,
    password_hash: user.password,
    role: user.role || 'admin'
  });
  if (error) throw error;
  return { ...user, id: nextId };
};

export const updateUser = async (id, updates) => {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.phone !== undefined) mapped.phone = updates.phone;
  if (updates.nid !== undefined) mapped.nid = updates.nid;
  if (updates.password !== undefined) mapped.password_hash = updates.password;
  if (updates.role !== undefined) mapped.role = updates.role;

  const { error } = await supabase.from('admin_users').update(mapped).eq('id', id.toString());
  if (error) throw error;
};

export const deleteUser = async (id) => {
  const { error } = await supabase.from('admin_users').delete().eq('id', id.toString());
  if (error) throw error;
};

// ============ INVESTORS ============

const mapInvestorFromDb = (row, investments) => ({
  id: row.id,
  uid: row.uid,
  name: row.name,
  email: row.email,
  mobile: row.mobile,
  guardianMobile: row.guardian_mobile,
  nid: row.nid,
  address: row.address,
  image: row.image,
  shares: row.shares,
  amount: row.amount,
  awardedFreeShares: row.awarded_free_shares,
  referralCount: row.referral_count,
  profitReceived: row.profit_received,
  referredBy: row.referred_by,
  status: row.status,
  note: row.note,
  joiningDate: row.joining_date,
  activationDate: row.activation_date,
  investments: investments || []
});

const getInvestorInvestments = async (investorId) => {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('investor_id', investorId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(inv => ({
    id: inv.id,
    shares: inv.shares,
    amount: inv.amount,
    joiningDate: inv.joining_date,
    activationDate: inv.activation_date,
    status: inv.status,
    paymentMethod: inv.payment_method,
    trxId: inv.trx_id,
    transferDate: inv.transfer_date
  }));
};

export const addInvestor = async (investor) => {
  if (!investor.id) {
    investor.id = await getNextInvestorId();
  }

  const shares = parseInt(investor.shares, 10) || 0;
  const amount = shares * 500;

  const { error } = await supabase.from('investors').insert({
    id: investor.id.toString(),
    uid: investor.uid || null,
    name: investor.name,
    email: investor.email,
    mobile: investor.mobile,
    guardian_mobile: investor.guardianMobile,
    nid: investor.nid,
    address: investor.address,
    image: investor.image,
    shares,
    amount,
    awarded_free_shares: 0,
    referral_count: 0,
    referred_by: investor.referredBy || null,
    status: investor.status || 'Active',
    is_activated: true,
    note: investor.note,
    joining_date: investor.joiningDate || null,
    activation_date: investor.activationDate || null
  });
  if (error) throw error;

  if (shares > 0) {
    const txId = 'BUY' + Math.floor(100000 + Math.random() * 900000).toString();

    const { error: invErr } = await supabase.from('investments').insert({
      investor_id: investor.id.toString(),
      shares,
      amount,
      joining_date: investor.joiningDate || new Date().toISOString().split('T')[0],
      activation_date: investor.activationDate || null,
      status: investor.status || 'Pending',
      payment_method: investor.paymentMethod || 'Cash',
      trx_id: txId
    });
    if (invErr) throw invErr;

    await logShareTransaction({
      id: txId,
      type: 'BUY',
      investorId: investor.id,
      investorName: investor.name,
      shares,
      amount,
      paymentMethod: investor.paymentMethod || 'Cash',
      date: investor.joiningDate ? new Date(investor.joiningDate).toISOString() : new Date().toISOString()
    });
  }

  return { ...investor, shares, amount };
};

export const getInvestors = async () => {
  const { data: rows, error } = await supabase.from('investors').select('*').eq('status', 'Active').order('id');
  if (error) throw error;

  const result = [];
  for (const row of (rows || [])) {
    const investments = await getInvestorInvestments(row.id);
    result.push(mapInvestorFromDb(row, investments));
  }
  return result;
};

export const updateInvestor = async (id, updates) => {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.mobile !== undefined) mapped.mobile = updates.mobile;
  if (updates.guardianMobile !== undefined) mapped.guardian_mobile = updates.guardianMobile;
  if (updates.nid !== undefined) mapped.nid = updates.nid;
  if (updates.address !== undefined) mapped.address = updates.address;
  if (updates.image !== undefined) mapped.image = updates.image;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.note !== undefined) mapped.note = updates.note;
  if (updates.referredBy !== undefined) mapped.referred_by = updates.referredBy;
  if (updates.joiningDate !== undefined) mapped.joining_date = updates.joiningDate;
  if (updates.activationDate !== undefined) mapped.activation_date = updates.activationDate;
  if (updates.awardedFreeShares !== undefined) mapped.awarded_free_shares = updates.awardedFreeShares;
  if (updates.profitReceived !== undefined) mapped.profit_received = updates.profitReceived;

  if (updates.investments) {
    // Rebuild investments table rows
    await supabase.from('investments').delete().eq('investor_id', id.toString());
    let tShares = 0, tAmount = 0;
    for (const inv of updates.investments) {
      const s = parseInt(inv.shares, 10) || 0;
      const a = parseInt(inv.amount, 10) || 0;
      tShares += s;
      tAmount += a;
      await supabase.from('investments').insert({
        investor_id: id.toString(),
        shares: s,
        amount: a,
        joining_date: inv.joiningDate || null,
        activation_date: inv.activationDate || null,
        status: inv.status || 'Pending',
        payment_method: inv.paymentMethod || 'Cash',
        trx_id: inv.trxId || null,
        transfer_date: inv.transferDate || null
      });
    }
    mapped.shares = tShares;
    mapped.amount = tAmount;
  } else if (updates.shares !== undefined) {
    mapped.shares = parseInt(updates.shares, 10) || 0;
    mapped.amount = mapped.shares * 500;
  }

  if (Object.keys(mapped).length > 0) {
    const { error } = await supabase.from('investors').update(mapped).eq('id', id.toString());
    if (error) throw error;
  }
};

export const addShareToInvestor = async (id, newShare) => {
  const shares = parseInt(newShare.shares, 10) || 0;
  const amount = shares * 500;
  const txId = 'BUY' + Math.floor(100000 + Math.random() * 900000).toString();

  const { error: invErr } = await supabase.from('investments').insert({
    investor_id: id.toString(),
    shares,
    amount,
    joining_date: newShare.joiningDate || new Date().toISOString().split('T')[0],
    activation_date: newShare.activationDate || null,
    status: newShare.status || 'Pending',
    payment_method: newShare.paymentMethod || 'Cash',
    trx_id: txId
  });
  if (invErr) throw invErr;

  // Recalculate totals
  const allInvestments = await getInvestorInvestments(id.toString());
  let tShares = 0, tAmount = 0;
  allInvestments.forEach(inv => { tShares += inv.shares; tAmount += inv.amount; });

  const { data: investor } = await supabase.from('investors').select('name').eq('id', id.toString()).single();

  await supabase.from('investors').update({ shares: tShares, amount: tAmount }).eq('id', id.toString());

  await logShareTransaction({
    id: txId,
    type: 'BUY',
    investorId: id,
    investorName: investor?.name || '',
    shares,
    amount,
    paymentMethod: newShare.paymentMethod || 'Cash',
    date: newShare.joiningDate ? new Date(newShare.joiningDate).toISOString() : new Date().toISOString()
  });

  return txId;
};

export const sellSharesFromInvestor = async (id, sharesToSell, editedBy) => {
  const { data: investorRow } = await supabase.from('investors').select('*').eq('id', id.toString()).single();
  if (!investorRow) throw new Error("Investor not found");

  const investments = await getInvestorInvestments(id.toString());
  if (!investments.length) throw new Error("No investments found to sell");

  let totalCurrentShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
  if (sharesToSell <= 0 || sharesToSell > totalCurrentShares) {
    throw new Error("Invalid number of shares to sell.");
  }

  const refundAmount = sharesToSell * 500;
  await deductFund('reserve', refundAmount, `Refund for selling ${sharesToSell} shares from Investor ID ${id}`, editedBy);

  const txId = 'SELL' + Math.floor(100000 + Math.random() * 900000).toString();
  let remainingToSell = sharesToSell;

  for (let i = investments.length - 1; i >= 0; i--) {
    if (remainingToSell <= 0) break;
    const block = investments[i];
    if (block.shares <= remainingToSell) {
      remainingToSell -= block.shares;
      await supabase.from('investments').delete().eq('id', block.id);
    } else {
      const newShares = block.shares - remainingToSell;
      await supabase.from('investments').update({ shares: newShares, amount: newShares * 500 }).eq('id', block.id);
      remainingToSell = 0;
    }
  }

  const updatedInvestments = await getInvestorInvestments(id.toString());
  let tShares = 0, tAmount = 0;
  updatedInvestments.forEach(inv => { tShares += inv.shares; tAmount += inv.amount; });
  await supabase.from('investors').update({ shares: tShares, amount: tAmount }).eq('id', id.toString());

  await logShareTransaction({
    id: txId, type: 'SELL', investorId: id, investorName: investorRow.name,
    shares: sharesToSell, amount: refundAmount, paymentMethod: 'Refund to Reserve Fund',
    date: new Date().toISOString()
  });

  return txId;
};

export const deleteInvestor = async (id, amount) => {
  await supabase.from('investments').delete().eq('investor_id', id.toString());
  await supabase.from('investors').delete().eq('id', id.toString());

  await supabase.from('fund_transactions').insert({
    type: 'REFUND/DELETE', fund: 'investor', amount: amount || 0,
    reason: `Investor ID ${id} deleted`, user_id: 'System', date: new Date().toISOString()
  });
};

// ============ PNL RECORDS ============

export const getPnlRecords = async () => {
  const { data, error } = await supabase.from('pnl_records').select('*').order('year', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, month: r.month, year: r.year,
    revenue: r.revenue, cost: r.cost, netProfit: r.net_profit,
    investorShare: r.investor_share, companyShare: r.company_share, reserveShare: r.reserve_share, marketingShare: r.marketing_share || 0,
    totalActiveShares: r.total_active_shares
  }));
};

export const addPnLRecord = async (record) => {
  const netProfit = record.revenue - record.cost;
  const companyShare = netProfit * 0.45;
  const investorShare = netProfit * 0.25;
  const reserveShare = netProfit * 0.20;
  const marketingShare = netProfit * 0.10;

  const { error } = await supabase.from('pnl_records').insert({
    month: record.month, year: record.year,
    revenue: record.revenue, cost: record.cost, net_profit: netProfit,
    investor_share: investorShare, company_share: companyShare, reserve_share: reserveShare, marketing_share: marketingShare,
    total_active_shares: record.totalActiveShares || 0
  });
  if (error) throw error;

  const { data: funds } = await supabase.from('system_funds').select('*').eq('id', 'main').single();
  await supabase.from('system_funds').update({
    company_fund: (funds?.company_fund || 0) + companyShare,
    reserve_fund: (funds?.reserve_fund || 0) + reserveShare,
    marketing_fund: (funds?.marketing_fund || 0) + marketingShare
  }).eq('id', 'main');

  return { ...record, netProfit, investorShare, companyShare, reserveShare, marketingShare };
};

// ============ FUNDS ============

export const getFunds = async () => {
  const { data, error } = await supabase.from('system_funds').select('*').eq('id', 'main').single();
  if (error && error.code === 'PGRST116') {
    await supabase.from('system_funds').insert({ id: 'main', company_fund: 0, reserve_fund: 0, marketing_fund: 0 });
    return { companyFund: 0, reserveFund: 0, marketingFund: 0 };
  }
  if (error) throw error;
  return { companyFund: data.company_fund, reserveFund: data.reserve_fund, marketingFund: data.marketing_fund || 0 };
};

export const deductFund = async (type, amount, reason, userId) => {
  const funds = await getFunds();

  if (type === 'company' && funds.companyFund < amount) throw new Error('Insufficient funds');
  if (type === 'reserve' && funds.reserveFund < amount) throw new Error('Insufficient funds');
  if (type === 'marketing' && funds.marketingFund < amount) throw new Error('Insufficient funds');

  const update = {};
  if (type === 'company') update.company_fund = funds.companyFund - amount;
  if (type === 'reserve') update.reserve_fund = funds.reserveFund - amount;
  if (type === 'marketing') update.marketing_fund = funds.marketingFund - amount;

  await supabase.from('system_funds').update(update).eq('id', 'main');

  await supabase.from('fund_transactions').insert({
    type: `WITHDRAW/${type.toUpperCase()}`, fund: type, amount, reason, user_id: userId, date: new Date().toISOString()
  });
};

export const getTransactions = async () => {
  const { data, error } = await supabase.from('fund_transactions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(t => ({
    type: t.type, fund: t.fund, amount: t.amount, reason: t.reason, date: t.date, userId: t.user_id
  }));
};

// ============ FREE SHARES ============

export const awardFreeShareRecord = async (investorId, referrerName) => {
  const userStr = localStorage.getItem('woora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user.id : 'N/A';

  await deductFund('company', 500, `Free share awarded to ${investorId} for referrals`, userId);

  await supabase.from('free_shares').insert({
    investor_id: investorId.toString(),
    investor_name: referrerName,
    shares_count: 1,
    date_awarded: new Date().toISOString()
  });

  const { data: inv } = await supabase.from('investors').select('awarded_free_shares').eq('id', investorId.toString()).single();
  await supabase.from('investors').update({
    awarded_free_shares: (inv?.awarded_free_shares || 0) + 1
  }).eq('id', investorId.toString());
};

export const getFreeShares = async () => {
  const { data, error } = await supabase.from('free_shares').select('*');
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, investorId: r.investor_id, investorName: r.investor_name,
    dateAwarded: r.date_awarded, sharesCount: r.shares_count
  }));
};

export const getFreeSharePayments = async (year, month) => {
  const { data, error } = await supabase
    .from('return_payments')
    .select('*')
    .eq('year', parseInt(year, 10))
    .eq('month', month);
  if (error) throw error;
  return (data || []).map(mapReturnPayment);
};

export const saveFreeSharePayment = async (payment) => {
  const existing = await supabase
    .from('return_payments')
    .select('id')
    .eq('investor_id', payment.investorId)
    .eq('year', payment.year)
    .eq('month', payment.month)
    .maybeSingle();

  if (existing.data) {
    await supabase.from('return_payments').update({
      profit_per_share: payment.profitPerShare,
      active_shares: payment.activeShares,
      total_amount: payment.amount || payment.totalAmount,
      payment_status: payment.paymentStatus || payment.status || 'Pending',
      payment_method: payment.paymentMethod,
      trx_id: payment.trxId,
      investor_name: payment.investorName
    }).eq('id', existing.data.id);
  } else {
    await supabase.from('return_payments').insert({
      investor_id: payment.investorId,
      investor_name: payment.investorName,
      year: payment.year,
      month: payment.month,
      profit_per_share: payment.profitPerShare,
      active_shares: payment.activeShares,
      total_amount: payment.amount || payment.totalAmount,
      payment_status: payment.paymentStatus || payment.status || 'Pending',
      payment_method: payment.paymentMethod,
      trx_id: payment.trxId
    });
  }
};

// ============ RETURN PAYMENTS ============

const mapReturnPayment = (r) => ({
  id: r.id,
  investorId: r.investor_id,
  investorName: r.investor_name,
  year: r.year,
  month: r.month,
  profitPerShare: r.profit_per_share,
  activeShares: r.active_shares,
  amount: r.total_amount,
  totalAmount: r.total_amount,
  status: r.payment_status,
  paymentStatus: r.payment_status,
  paymentMethod: r.payment_method,
  trxId: r.trx_id,
  lastUpdated: r.last_updated
});

export const getShareStatus = (joiningDateStr, targetYear, targetMonthName) => {
  if (!joiningDateStr) return 'Pending';
  const joinDate = new Date(joiningDateStr);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const targetMonthIndex = months.indexOf(targetMonthName);
  if (targetMonthIndex === -1) return 'Pending';
  const diffMonths = (targetYear - joinDate.getFullYear()) * 12 + (targetMonthIndex - joinDate.getMonth());
  return diffMonths <= 0 ? 'Pending' : 'Active';
};

export const getReturnPayments = async (year, month) => {
  const { data, error } = await supabase
    .from('return_payments')
    .select('*')
    .eq('year', parseInt(year, 10))
    .eq('month', month);
  if (error) throw error;
  return (data || []).map(mapReturnPayment);
};

export const saveReturnPayment = async (payment) => {
  await saveFreeSharePayment(payment);
};

export const recordPayout = async (payout, payAmount, userId) => {
  await saveFreeSharePayment(payout);

  await supabase.from('fund_transactions').insert({
    type: 'PAYOUT', fund: 'investor', amount: parseFloat(payAmount),
    reason: `Monthly Return Payout to Investor ID ${payout.investorId} for ${payout.month} ${payout.year}`,
    date: new Date().toISOString(), user_id: userId || 'System'
  });
};

// ============ SHARE TRANSFERS ============

export const transferShares = async (fromId, toId, blockIndex, qty, authorizedBy) => {
  const { data: fromRow } = await supabase.from('investors').select('*').eq('id', fromId.toString()).single();
  const { data: toRow } = await supabase.from('investors').select('*').eq('id', toId.toString()).single();
  if (!fromRow) throw new Error(`Sender Investor ID ${fromId} not found`);
  if (!toRow) throw new Error(`Recipient Investor ID ${toId} not found`);

  const fromInvestments = await getInvestorInvestments(fromId.toString());
  if (!fromInvestments[blockIndex]) throw new Error("Selected investment block not found on sender");

  const block = fromInvestments[blockIndex];
  if (qty <= 0 || qty > block.shares) throw new Error(`Invalid transfer quantity`);

  const txId = 'TRANS' + Math.floor(100000 + Math.random() * 900000).toString();
  const transferAmount = qty * 500;

  // Reduce or remove sender block
  if (block.shares === qty) {
    await supabase.from('investments').delete().eq('id', block.id);
  } else {
    await supabase.from('investments').update({
      shares: block.shares - qty, amount: (block.shares - qty) * 500
    }).eq('id', block.id);
  }

  // Add block to receiver
  await supabase.from('investments').insert({
    investor_id: toId.toString(), shares: qty, amount: transferAmount,
    joining_date: block.joiningDate, activation_date: block.activationDate,
    status: block.status || 'Pending',
    payment_method: `Transferred from ID ${fromId}`, trx_id: txId,
    transfer_date: new Date().toISOString().split('T')[0]
  });

  // Recalculate both investors
  for (const invId of [fromId.toString(), toId.toString()]) {
    const inv = await getInvestorInvestments(invId);
    let tS = 0, tA = 0;
    inv.forEach(i => { tS += i.shares; tA += i.amount; });
    await supabase.from('investors').update({ shares: tS, amount: tA }).eq('id', invId);
  }

  await supabase.from('fund_transactions').insert({
    type: 'TRANSFER', fund: 'none', amount: transferAmount,
    reason: `Transferred ${qty} shares from ID ${fromId} to ID ${toId}`,
    date: new Date().toISOString(), user_id: authorizedBy || 'System'
  });

  await logShareTransaction({
    id: txId, type: 'TRANSFER',
    fromInvestorId: fromId, fromInvestorName: fromRow.name,
    toInvestorId: toId, toInvestorName: toRow.name,
    investorId: fromId, investorName: fromRow.name,
    shares: qty, amount: transferAmount, paymentMethod: 'Internal Transfer',
    date: new Date().toISOString()
  });

  return { txId, fromName: fromRow.name, toName: toRow.name, toEmail: toRow.email };
};

// ============ SITE SETTINGS (Generic) ============

export const getSiteSettings = async (key, defaults = {}) => {
  const { data } = await supabase.from('metadata').select('value').eq('key', key).maybeSingle();
  if (data?.value) return data.value;
  return defaults;
};

export const saveSiteSettings = async (key, value) => {
  const { data: existing } = await supabase.from('metadata').select('key').eq('key', key).maybeSingle();
  if (existing) {
    await supabase.from('metadata').update({ value }).eq('key', key);
  } else {
    await supabase.from('metadata').insert({ key, value });
  }
};

// ============ BREVO EMAIL SETTINGS ============

export const getBrevoSettings = async () => {
  const { data } = await supabase.from('metadata').select('value').eq('key', 'brevo').maybeSingle();
  if (data?.value) return data.value;
  return { apiKey: '' };
};

export const saveBrevoSettings = async (settings) => {
  const { data: existing } = await supabase.from('metadata').select('key').eq('key', 'brevo').maybeSingle();
  if (existing) {
    await supabase.from('metadata').update({ value: settings }).eq('key', 'brevo');
  } else {
    await supabase.from('metadata').insert({ key: 'brevo', value: settings });
  }
};

// ============ INVESTOR ID COUNTER ============

export const getNextInvestorId = async () => {
  const { data, error } = await supabase.from('metadata').select('value').eq('key', 'counters').single();
  if (error) throw error;

  const current = data.value.lastInvestorId || 1000;
  const nextId = current + 1;

  await supabase.from('metadata').update({
    value: { ...data.value, lastInvestorId: nextId }
  }).eq('key', 'counters');

  return nextId.toString();
};

// ============ SHARE REQUESTS ============

export const getShareRequests = async () => {
  const { data, error } = await supabase.from('share_requests').select('*').order('date_requested', { ascending: false });
  if (error) throw error;

  const list = (data || []).map(r => ({
    id: r.id, investorId: r.investor_id, investorName: r.investor_name,
    sharesCount: r.shares_count, amount: r.amount,
    paymentMethod: r.payment_method, trxId: r.trx_id,
    status: r.status, rejectReason: r.reject_reason,
    requestType: r.request_type || 'BUY',
    dateRequested: r.date_requested, dateProcessed: r.date_processed
  }));

  list.sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.dateRequested || 0) - new Date(a.dateRequested || 0);
  });
  return list;
};

export const approveShareRequest = async (requestId, adminId) => {
  const { data: reqData, error } = await supabase.from('share_requests').select('*').eq('id', requestId).single();
  if (error || !reqData) throw new Error("Request not found");
  if (reqData.status !== 'Pending') throw new Error("Request is already processed");

  const newShare = {
    shares: reqData.shares_count,
    amount: reqData.amount,
    joiningDate: new Date(reqData.date_requested || new Date()).toISOString().split('T')[0],
    activationDate: '',
    status: 'Pending',
    paymentMethod: reqData.payment_method || 'Cash',
    trxId: reqData.trx_id || ''
  };

  const txId = await addShareToInvestor(reqData.investor_id, newShare);
  if (!txId) throw new Error("Failed to add shares to investor");

  const totalAmount = reqData.amount || 0;
  const companyShare = totalAmount * 0.45;
  const reserveShare = totalAmount * 0.20;
  const marketingShare = totalAmount * 0.10;

  const funds = await getFunds();
  await supabase.from('system_funds').update({
    company_fund: (funds.companyFund || 0) + companyShare,
    reserve_fund: (funds.reserveFund || 0) + reserveShare,
    marketing_fund: (funds.marketingFund || 0) + marketingShare
  }).eq('id', 'main');

  await supabase.from('share_requests').update({
    status: 'Approved', date_processed: new Date().toISOString()
  }).eq('id', requestId);

  return txId;
};

export const approveSellRequest = async (requestId, adminId) => {
  const { data: reqData, error } = await supabase.from('share_requests').select('*').eq('id', requestId).single();
  if (error || !reqData) throw new Error("Request not found");
  if (reqData.status !== 'Pending') throw new Error("Request is already processed");

  const qty = reqData.shares_count;
  const txId = await sellSharesFromInvestor(reqData.investor_id, qty, adminId);
  if (!txId) throw new Error("Failed to sell shares");

  await supabase.from('share_requests').update({
    status: 'Approved', date_processed: new Date().toISOString()
  }).eq('id', requestId);

  return txId;
};

export const rejectShareRequest = async (requestId, adminId, reason) => {
  const { data: reqData, error } = await supabase.from('share_requests').select('status').eq('id', requestId).single();
  if (error || !reqData) throw new Error("Request not found");
  if (reqData.status !== 'Pending') throw new Error("Request is already processed");

  await supabase.from('share_requests').update({
    status: 'Rejected', reject_reason: reason || 'N/A',
    date_processed: new Date().toISOString()
  }).eq('id', requestId);
};

// ============ NOTIFICATIONS (stub) ============

export const markNotificationAsRead = async (notificationId) => {};
export const markAllNotificationsAsRead = async () => {};
