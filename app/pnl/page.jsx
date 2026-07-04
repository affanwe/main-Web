"use client";

import { useState, useEffect } from 'react';
import { getPnlRecords, addPnLRecord, getInvestors, getShareStatus } from '../../src/db';
import { Calculator } from 'lucide-react';

const PnL = () => {
  const [records, setRecords] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenue, setRevenue] = useState(0);
  const [cost, setCost] = useState(0);
  const [totalActive, setTotalActive] = useState(0);

  const loadData = async () => {
    const data = await getPnlRecords();
    setRecords(data);
    
    const invs = await getInvestors();
    setInvestors(invs);
  };

  useEffect(() => {
    if (!month) {
      setTotalActive(0);
      return;
    }
    let count = 0;
    investors.forEach(inv => {
      if (inv.investments) {
        inv.investments.forEach(share => {
          if (share.status === 'Closed') return;
          const blockStatus = getShareStatus(share.joiningDate, parseInt(year, 10), month, share.status);
          if (blockStatus === 'Active') {
            count += parseInt(share.shares, 10) || 0;
          }
        });
      }
    });
    setTotalActive(count);
  }, [month, year, investors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!month) return alert("Please select a month");

    const record = {
      month,
      year,
      revenue: parseFloat(revenue),
      cost: parseFloat(cost),
      totalActiveShares: totalActive,
      totalUltraActiveShares: totalActive
    };

    await addPnLRecord(record);
    await loadData();
    setRevenue(0);
    setCost(0);
  };

  const netProfit = revenue - cost;
  const compShare = netProfit * 0.45;
  const invShare = netProfit * 0.25;
  const resShare = netProfit * 0.20;
  const mktShare = netProfit * 0.10;
  const profitPerShare = totalActive > 0 ? (invShare / totalActive) : 0;

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Company PnL</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Calculator color="var(--color-primary)" />
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '18px' }}>Add Monthly Report</h3>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Month</label>
              <select className="input-field" value={month} onChange={e => setMonth(e.target.value)} required>
                <option value="">Select Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Year</label>
              <input type="number" className="input-field" value={year} onChange={e => setYear(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Total Revenue (৳)</label>
              <input type="number" min="0" className="input-field" value={revenue} onChange={e => setRevenue(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Total Cost (৳)</label>
              <input type="number" min="0" className="input-field" value={cost} onChange={e => setCost(e.target.value)} required />
            </div>
            
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '8px' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Net Profit:</span> <strong style={{ color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>৳{netProfit.toLocaleString()}</strong></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted)' }}><span>Company (45%):</span> <span>৳{compShare.toLocaleString()}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted)' }}><span>Investor (25%):</span> <span>৳{invShare.toLocaleString()}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted)' }}><span>Reserve (20%):</span> <span>৳{resShare.toLocaleString()}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted)' }}><span>Marketing (10%):</span> <span>৳{mktShare.toLocaleString()}</span></p>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid var(--color-primary)', marginTop: '8px' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-white)' }}><span>Total Active Units:</span> <strong>{totalActive}</strong></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}><span>Dividend Per Unit:</span> <strong>৳{profitPerShare.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Save & Distribute</button>
          </form>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Month</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Revenue</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Cost</th>
                <th style={{ padding: '12px', color: 'var(--color-text-muted)' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '12px', color: 'var(--color-text-white)' }}>{r.month} {r.year}</td>
                  <td style={{ padding: '12px' }}>৳{r.revenue.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>৳{r.cost.toLocaleString()}</td>
                  <td style={{ padding: '12px', color: r.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>৳{r.netProfit.toLocaleString()}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PnL;
