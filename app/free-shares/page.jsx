"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFreeShares, getFreeSharePayments, getPnlRecords, saveFreeSharePayment, deductFund } from '../../src/db';
import { ArrowLeft, Gift, Coins, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FreeShares = () => {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [freeSharesList, setFreeSharesList] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [profitPerShare, setProfitPerShare] = useState(0);
  const [pnlExists, setPnlExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [trxId, setTrxId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch PnL records to get the profit per share for selected month/year
      const pnlRecords = await getPnlRecords();
      const pnlRecord = pnlRecords.find(r => r.month === selectedMonth && parseInt(r.year, 10) === parseInt(selectedYear, 10));
      
      let pps = 0;
      if (pnlRecord) {
        const netProfit = pnlRecord.revenue - pnlRecord.cost;
        const invShare = netProfit * 0.4;
        const totalSharesCount = pnlRecord.totalActiveShares !== undefined ? pnlRecord.totalActiveShares : (pnlRecord.totalUltraActiveShares || 0);
        pps = totalSharesCount > 0 ? (invShare / totalSharesCount) : 0;
        setPnlExists(true);
      } else {
        setPnlExists(false);
      }
      setProfitPerShare(pps);

      // 2. Fetch all free shares
      const allFreeShares = await getFreeShares();

      // 3. Fetch all payments for this month/year
      const paymentsList = await getFreeSharePayments(selectedYear, selectedMonth);
      const payMap = {};
      paymentsList.forEach(p => {
        payMap[p.investorId] = p;
      });
      setPaymentsMap(payMap);

      // 4. Group free shares by investor and calculate status
      const grouped = {};
      const targetMonthIdx = MONTHS.indexOf(selectedMonth);

      allFreeShares.forEach(share => {
        const invId = share.investorId;
        const awardedDate = new Date(share.dateAwarded);
        
        // Calculate difference in months
        const diffMonths = (parseInt(selectedYear, 10) - awardedDate.getFullYear()) * 12 + (targetMonthIdx - awardedDate.getMonth());

        if (diffMonths >= 0) {
          if (!grouped[invId]) {
            grouped[invId] = {
              investorId: invId,
              name: share.investorName,
              pending: 0,
              active: 0,
              totalCount: 0
            };
          }

          const count = parseInt(share.sharesCount, 10) || 1;
          grouped[invId].totalCount += count;

          if (diffMonths === 0) {
            grouped[invId].pending += count;
          } else {
            grouped[invId].active += count;
          }
        }
      });

      setFreeSharesList(Object.values(grouped));
    } catch (err) {
      console.error(err);
      alert("Failed to load free shares data: " + err.message);
    }
    setLoading(false);
  };

  const openPaymentModal = (investor, expectedProfit, paid) => {
    setActivePayment({
      investorId: investor.investorId,
      name: investor.name,
      activeShares: investor.active,
      expectedProfit,
      paid,
      due: expectedProfit - paid
    });
    setPayAmount((expectedProfit - paid).toString());
    setPayMethod('Cash');
    setTrxId('');
    setShowPayModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activePayment) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    if (amount > activePayment.due) {
      alert("Payment amount cannot exceed the remaining due amount.");
      return;
    }

    try {
      const userStr = localStorage.getItem('woora_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const adminId = user ? user.id : 'N/A';

      // Deduct from company fund
      await deductFund(
        'company',
        amount,
        `Free Share Profit Payout to ID ${activePayment.investorId} for ${selectedMonth} ${selectedYear}`,
        adminId
      );

      // Save payment record
      const newPaid = activePayment.paid + amount;
      const status = newPaid >= activePayment.expectedProfit ? 'Paid' : 'Partially Paid';

      await saveFreeSharePayment({
        investorId: activePayment.investorId,
        investorName: activePayment.name,
        month: selectedMonth,
        year: parseInt(selectedYear, 10),
        expectedProfit: activePayment.expectedProfit,
        paidAmount: newPaid,
        paymentStatus: status,
        lastPaymentDetails: {
          amount,
          method: payMethod,
          trxId,
          date: new Date().toISOString()
        }
      });

      alert("Payment recorded successfully!");
      setShowPayModal(false);
      await loadData();
    } catch (err) {
      alert("Failed to record payment: " + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/referrals')}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>Free Share Profits</h1>
      </div>

      {/* Date Filter & Info Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Month</label>
              <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', minWidth: '130px' }}>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Year</label>
              <input
                type="number"
                className="input-field"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{ padding: '8px 12px', width: '100px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Dividend Per Share</span>
              <h3 style={{ color: 'var(--color-primary)', fontSize: '18px', margin: '4px 0 0 0' }}>৳{profitPerShare.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3>
            </div>
          </div>
        </div>

        {!pnlExists && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', color: 'var(--color-warning)' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '13px' }}>Monthly PnL report not submitted for {selectedMonth} {selectedYear} yet. Dividend per share is ৳0.00.</span>
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Investor ID</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Free Units (Counts)</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Expected Profit</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Paid</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Due</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Payment Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading free investment units data...</td>
              </tr>
            ) : freeSharesList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No free investment units found active in this month.</td>
              </tr>
            ) : (
              freeSharesList.map(inv => {
                const expectedProfit = inv.active * profitPerShare;
                const payRecord = paymentsMap[inv.investorId];
                const paid = payRecord ? payRecord.paidAmount : 0;
                const due = Math.max(0, expectedProfit - paid);
                
                let paymentStatus = 'Unpaid';
                if (expectedProfit === 0) {
                  paymentStatus = 'N/A';
                } else if (paid >= expectedProfit) {
                  paymentStatus = 'Paid';
                } else if (paid > 0) {
                  paymentStatus = 'Partially Paid';
                }

                return (
                  <tr key={inv.investorId} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{inv.investorId}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-white)', fontWeight: 500 }}>{inv.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>Pending: {inv.pending}</span>
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>Active: {inv.active}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-white)' }}>৳{expectedProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td style={{ padding: '12px 16px', color: '#10B981' }}>৳{paid.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td style={{ padding: '12px 16px', color: due > 0 ? '#EF4444' : 'var(--color-text-muted)' }}>৳{due.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge badge-${paymentStatus.toLowerCase().replace(' ', '-')}`}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {due > 0 ? (
                        <button
                          onClick={() => openPaymentModal(inv, expectedProfit, paid)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Coins size={14} /> Pay Profit
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          {paymentStatus === 'N/A' ? 'Not eligible yet' : 'Fully Paid'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPayModal && activePayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--color-text-white)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins color="var(--color-primary)" /> Record Profit Payment
              </h2>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
              <p style={{ margin: '0 0 6px 0', color: 'var(--color-text-white)' }}>Investor: <strong>{activePayment.name} (ID: {activePayment.investorId})</strong></p>
              <p style={{ margin: '0 0 6px 0' }}>Eligible Free Shares: <strong>{activePayment.activeShares} Active</strong></p>
              <p style={{ margin: '0 0 6px 0' }}>Expected Profit: <strong>৳{activePayment.expectedProfit.toLocaleString()}</strong></p>
              <p style={{ margin: '0 0 6px 0', color: '#10B981' }}>Paid So Far: <strong>৳{activePayment.paid.toLocaleString()}</strong></p>
              <p style={{ margin: '0', color: '#EF4444' }}>Remaining Due: <strong>৳{activePayment.due.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Amount to Pay (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={activePayment.due}
                  className="input-field"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payment Method</label>
                <select className="input-field" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="bkash">bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Transaction ID / Reference</label>
                <input
                  type="text"
                  className="input-field"
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                  required={payMethod !== 'Cash'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeShares;
