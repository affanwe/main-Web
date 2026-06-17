"use client";

import { useState, useEffect } from 'react';
import { getShareRequests, approveShareRequest, rejectShareRequest } from '../../src/db';
import LocomotiveText from '../../src/components/LocomotiveText';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [user, setUser] = useState(null);

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
    if (!confirm(`Approve ${req.sharesCount} shares for ${req.investorName} (ID: ${req.investorId})?\n\nAmount: ৳${parseInt(req.amount || 0).toLocaleString()}\nPayment: ${req.paymentMethod}\nTrx ID: ${req.trxId || 'N/A'}`)) return;

    setProcessingId(req.id);
    try {
      await approveShareRequest(req.id, user?.id || 'System');
      alert("Request approved! Shares added to investor.");
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

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title text-locomotive"><LocomotiveText text="Share Requests" /></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pendingCount > 0 && (
            <span style={{ backgroundColor: 'var(--color-primary)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
              {pendingCount} Pending
            </span>
          )}
          <button className="btn btn-secondary btn-magnetic no-print" onClick={loadRequests} disabled={loading}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} /> <LocomotiveText text="Refresh" />
          </button>
        </div>
      </div>

      <div className="card card-premium no-print" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading requests...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Investor" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="ID" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Shares" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Amount" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Payment" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Trx ID" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Date" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Status" /></th>
                <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Actions" /></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const isPending = req.status === 'Pending';
                const isProcessed = !isPending;
                return (
                  <tr key={req.id} className="tr-hover-premium" style={{ borderBottom: '1px solid var(--color-border-light)', opacity: isProcessed ? 0.5 : 1 }}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-white)', fontWeight: 500 }}>{req.investorName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-white)' }}>{req.investorId}</td>
                    <td style={{ padding: '12px 16px' }}>{req.sharesCount}</td>
                    <td style={{ padding: '12px 16px' }}>৳{parseInt(req.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>{req.paymentMethod}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-primary)', fontSize: '13px' }}>{req.trxId || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{req.dateRequested ? new Date(req.dateRequested).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isPending ? (
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
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {req.status === 'Approved' ? `By ${req.approvedBy || '—'}` : `By ${req.rejectedBy || '—'}`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No share requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: 'var(--color-text-white)', marginBottom: '8px' }}>Reject Request</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Rejecting {rejectTarget.sharesCount} shares for <strong style={{ color: 'var(--color-text-white)' }}>{rejectTarget.investorName}</strong> (ID: {rejectTarget.investorId})
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
