"use client";

import { useState, useEffect } from 'react';
import { getFunds, deductFund, getTransactions } from '../../src/db';
import { Wallet, ArrowDownCircle } from 'lucide-react';

const Funds = () => {
  const [funds, setFunds] = useState({ companyFund: 0, reserveFund: 0, marketingFund: 0 });
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('company');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    const f = await getFunds();
    if (f) setFunds(f);
    const tx = await getTransactions();
    setTransactions(tx.sort((a,b) => new Date(b.date) - new Date(a.date)));
  };

  const handleDeduct = async (e) => {
    e.preventDefault();
    if (amount <= 0) return alert("Enter a valid amount");
    if (!reason) return alert("Enter a reason");

    const userStr = localStorage.getItem('woora_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user ? user.id : 'N/A';

    try {
      await deductFund(type, parseFloat(amount), reason, userId);
      await loadData();
      setAmount(0);
      setReason('');
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Funds Details</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Company Profit (45%)</h3>
          <h2 style={{ fontSize: '36px', margin: '8px 0' }}>৳{funds.companyFund.toLocaleString()}</h2>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Available for company expenses and improvements.</p>
        </div>

        <div className="card" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-warning)' }}>
          <h3 style={{ color: 'var(--color-warning)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reserve Fund (20%)</h3>
          <h2 style={{ color: 'var(--color-text-white)', fontSize: '36px', margin: '8px 0' }}>৳{funds.reserveFund.toLocaleString()}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Reserved for losses or emergency situations.</p>
        </div>

        <div className="card" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid #10B981' }}>
          <h3 style={{ color: '#10B981', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extra Marketing (10%)</h3>
          <h2 style={{ color: 'var(--color-text-white)', fontSize: '36px', margin: '8px 0' }}>৳{funds.marketingFund.toLocaleString()}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Reserved for promotional and marketing activities.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <ArrowDownCircle color="var(--color-error)" />
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '18px' }}>Deduct Expense</h3>
          </div>
          
          <form onSubmit={handleDeduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Fund Source</label>
              <select className="input-field" value={type} onChange={e => setType(e.target.value)} required>
                <option value="company">Company Profit</option>
                <option value="reserve">Reserve Fund</option>
                <option value="marketing">Marketing Fund</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Amount (৳)</label>
              <input type="number" min="1" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Reason / Description</label>
              <input type="text" className="input-field" value={reason} onChange={e => setReason(e.target.value)} required placeholder="e.g. Office rent" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-error)', marginTop: '8px' }}>Confirm Deduction</button>
          </form>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>Transaction History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Date</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Fund</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Reason</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Amount</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Edited By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '12px', color: 'var(--color-text-white)' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-closed">{t.type}</span>
                  </td>
                  <td style={{ padding: '12px', textTransform: 'capitalize' }}>{t.fund}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-white)' }}>{t.reason}</td>
                  <td style={{ padding: '12px', color: 'var(--color-error)' }}>-৳{t.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>ID: {t.userId || 'N/A'}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;
