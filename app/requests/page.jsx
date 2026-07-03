"use client";

import { useState, useEffect } from 'react';
import { getShareRequests, approveShareRequest, approveSellRequest, rejectShareRequest, getInvestors } from '../../src/db';
import { sendReceiptEmail } from '../../src/email';
import LocomotiveText from '../../src/components/LocomotiveText';
import { CheckCircle, XCircle, RefreshCw, History, ArrowLeft, Search } from 'lucide-react';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getShareRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load share requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('woora_user');
    if (userStr) setUser(JSON.parse(userStr));
    loadRequests();
  }, []);

  const handleApprove = async (req) => {
    const isSell = req.requestType === 'SELL';
    const action = isSell ? 'sell' : 'buy';
    if (!confirm(`Approve ${action.toUpperCase()} request: ${req.sharesCount} shares for ${req.investorName} (ID: ${req.investorId})?\n\nOrder: ${req.orderId || '—'}\nAmount: ৳${parseInt(req.amount || 0).toLocaleString()}${isSell ? '' : `\nPayment: ${req.paymentMethod}\nTrx ID: ${req.trxId || 'N/A'}`}`)) return;

    setProcessingId(req.id);
    try {
      const txId = isSell
        ? await approveSellRequest(req.id, user?.id || 'System')
        : await approveShareRequest(req.id, user?.id || 'System');

      try {
        const allInvestors = await getInvestors();
        const investor = allInvestors.find(i => i.id?.toString() === req.investorId?.toString());
        if (investor?.email) {
          sendReceiptEmail({
            to_email: investor.email,
            to_name: req.investorName,
            shares_count: req.sharesCount,
            amount: req.amount || req.sharesCount * 500,
            joining_date: req.dateRequested ? new Date(req.dateRequested).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            trx_id: txId || req.trxId || 'N/A',
            type: isSell ? 'SELL' : 'BUY',
            receipt_title: isSell ? 'Shares Sold Successfully' : 'Thank You!',
            receipt_subtitle: isSell ? `Your ${req.sharesCount} shares of Woora have been sold.` : 'Thank you for purchasing shares of Woora.',
            receipt_emoji: isSell ? '📋' : '👏',
            appreciation_text: isSell ? 'Thank you for being a valued member of Woora.' : 'We sincerely appreciate your trust and support in Woora.'
          }).catch(err => console.error("Failed to send approval email:", err));
        }
      } catch (emailErr) {
        console.error("Email lookup error:", emailErr);
      }

      alert(`Request approved! Shares ${isSell ? 'sold from' : 'added to'} investor.`);
      await loadRequests();
    } catch (err) {
      alert("Failed to approve: " + err.message);
    }
    setProcessingId(null);
  };

  const handleRejectClick = (req) => {
    setRejectTarget(req);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setProcessingId(rejectTarget.id);
    try {
      await rejectShareRequest(rejectTarget.id, user?.id || 'System', rejectReason);
      alert("Request rejected.");
      setShowRejectModal(false);
      setRejectTarget(null);
      await loadRequests();
    } catch (err) {
      alert("Failed to reject: " + err.message);
    }
    setProcessingId(null);
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="badge badge-active">Approved</span>;
    if (status === 'Rejected') return <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>Rejected</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const processedRequests = requests.filter(r => r.status !== 'Pending');

  const filteredHistory = processedRequests.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.orderId && r.orderId.toLowerCase().includes(q)) ||
      (r.trxId && r.trxId.toLowerCase().includes(q)) ||
      (r.investorName && r.investorName.toLowerCase().includes(q)) ||
      (r.investorId && r.investorId.toString().includes(q))
    );
  });

  const thStyle = { padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 };
  const tdStyle = { padding: '12px 16px' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title text-locomotive"><LocomotiveText text="Unit Requests" /></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeTab === 'pending' && pendingRequests.length > 0 && (
            <span style={{ backgroundColor: 'var(--color-primary)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
              {pendingRequests.length} Pending
            </span>
          )}
          {activeTab === 'pending' ? (
            <button className="btn btn-secondary btn-magnetic no-print" onClick={() => setActiveTab('history')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} /> <LocomotiveText text="History" />
            </button>
          ) : (
            <button className="btn btn-secondary btn-magnetic no-print" onClick={() => { setActiveTab('pending'); setSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> <LocomotiveText text="Back" />
            </button>
          )}
          <button className="btn btn-secondary btn-magnetic no-print" onClick={loadRequests} disabled={loading}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} /> <LocomotiveText text="Refresh" />
          </button>
        </div>
      </div>

      {/* ===== PENDING TAB ===== */}
      {activeTab === 'pending' && (
        <div className="card card-premium no-print" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading requests...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <th style={thStyle}><LocomotiveText text="Order ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Type" /></th>
                  <th style={thStyle}><LocomotiveText text="Investor" /></th>
                  <th style={thStyle}><LocomotiveText text="ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Units" /></th>
                  <th style={thStyle}><LocomotiveText text="Amount" /></th>
                  <th style={thStyle}><LocomotiveText text="Payment" /></th>
                  <th style={thStyle}><LocomotiveText text="Trx ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Date" /></th>
                  <th style={thStyle}><LocomotiveText text="Actions" /></th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id} className="tr-hover-premium" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ ...tdStyle, color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{req.orderId || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, backgroundColor: req.requestType === 'SELL' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: req.requestType === 'SELL' ? '#EF4444' : '#10B981' }}>
                        {req.requestType || 'BUY'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-white)', fontWeight: 500 }}>{req.investorName}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-white)' }}>{req.investorId}</td>
                    <td style={tdStyle}>{req.sharesCount}</td>
                    <td style={tdStyle}>৳{parseInt(req.amount || 0).toLocaleString()}</td>
                    <td style={tdStyle}>{req.paymentMethod}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-primary)', fontSize: '13px' }}>{req.trxId || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '13px' }}>{req.dateRequested ? new Date(req.dateRequested).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={processingId === req.id}
                          className="btn btn-magnetic"
                          style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: processingId === req.id ? 0.5 : 1 }}
                          title="Approve"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(req)}
                          disabled={processingId === req.id}
                          className="btn btn-magnetic"
                          style={{ padding: '6px 12px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: processingId === req.id ? 0.5 : 1 }}
                          title="Reject"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div className="card card-premium no-print" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by Order ID, Trx ID, Name, or Investor ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading history...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', marginTop: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <th style={thStyle}><LocomotiveText text="Order ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Type" /></th>
                  <th style={thStyle}><LocomotiveText text="Investor" /></th>
                  <th style={thStyle}><LocomotiveText text="ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Units" /></th>
                  <th style={thStyle}><LocomotiveText text="Amount" /></th>
                  <th style={thStyle}><LocomotiveText text="Payment" /></th>
                  <th style={thStyle}><LocomotiveText text="Trx ID" /></th>
                  <th style={thStyle}><LocomotiveText text="Requested" /></th>
                  <th style={thStyle}><LocomotiveText text="Processed" /></th>
                  <th style={thStyle}><LocomotiveText text="Status" /></th>
                  <th style={thStyle}><LocomotiveText text="Processed By" /></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(req => (
                  <tr key={req.id} className="tr-hover-premium" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ ...tdStyle, color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{req.orderId || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, backgroundColor: req.requestType === 'SELL' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: req.requestType === 'SELL' ? '#EF4444' : '#10B981' }}>
                        {req.requestType || 'BUY'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-white)', fontWeight: 500 }}>{req.investorName}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-white)' }}>{req.investorId}</td>
                    <td style={tdStyle}>{req.sharesCount}</td>
                    <td style={tdStyle}>৳{parseInt(req.amount || 0).toLocaleString()}</td>
                    <td style={tdStyle}>{req.paymentMethod}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-primary)', fontSize: '13px' }}>{req.trxId || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '13px' }}>{req.dateRequested ? new Date(req.dateRequested).toLocaleDateString() : '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '13px' }}>{req.dateProcessed ? new Date(req.dateProcessed).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}>{getStatusBadge(req.status)}</td>
                    <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {req.processedBy || '—'}
                      {req.status === 'Rejected' && req.rejectReason && (
                        <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '2px' }} title={req.rejectReason}>
                          Reason: {req.rejectReason.length > 30 ? req.rejectReason.slice(0, 30) + '...' : req.rejectReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      {searchQuery ? 'No results found for your search.' : 'No processed requests yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: 'var(--color-text-white)', marginBottom: '8px' }}>Reject Request</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Rejecting {rejectTarget.sharesCount} shares for <strong style={{ color: 'var(--color-text-white)' }}>{rejectTarget.investorName}</strong> (ID: {rejectTarget.investorId})
              {rejectTarget.orderId && <><br />Order: <strong style={{ color: 'var(--color-primary)' }}>{rejectTarget.orderId}</strong></>}
            </p>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Reason for Rejection</label>
            <textarea
              className="input-field"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
              style={{ width: '100%', height: '80px', padding: '8px 12px', fontSize: '13px', resize: 'none', marginBottom: '16px' }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowRejectModal(false); setRejectTarget(null); }} disabled={processingId}>Cancel</button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#EF4444', color: '#FFF' }}
                onClick={handleRejectConfirm}
                disabled={processingId === rejectTarget.id}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
