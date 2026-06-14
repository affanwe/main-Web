import { useState, useEffect } from 'react';
import { getShareTransactions } from '../db';
import { Search, ReceiptText } from 'lucide-react';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getShareTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
      return false;
    }
    
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    const txId = (tx.id || '').toLowerCase();
    const invId = (tx.investorId || '').toString().toLowerCase();
    const name = (tx.investorName || '').toLowerCase();
    
    const fromId = (tx.fromInvestorId || '').toString().toLowerCase();
    const fromName = (tx.fromInvestorName || '').toLowerCase();
    const toId = (tx.toInvestorId || '').toString().toLowerCase();
    const toName = (tx.toInvestorName || '').toLowerCase();

    return (
      txId.includes(term) ||
      invId.includes(term) ||
      name.includes(term) ||
      fromId.includes(term) ||
      fromName.includes(term) ||
      toId.includes(term) ||
      toName.includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'BUY':
        return 'badge-buy';
      case 'SELL':
        return 'badge-sell';
      case 'TRANSFER':
        return 'badge-transfer';
      default:
        return '';
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">Transaction History</h1>
        <p className="history-subtitle">View and audit all share buy, sell, and transfer transactions.</p>
      </div>

      {/* Toolbar containing filter buttons & search bar */}
      <div className="history-toolbar">
        <div className="filter-group">
          {['ALL', 'BUY', 'SELL', 'TRANSFER'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <Search className="search-icon-local" size={16} />
          <input
            type="text"
            placeholder="Search Transaction ID / Investor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-local"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="history-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--color-warning)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <ReceiptText style={{ margin: '0 auto 16px auto', color: 'var(--color-text-muted)', opacity: 0.5 }} size={48} />
            <p style={{ fontWeight: 600, color: 'var(--color-text-white)', marginBottom: '4px' }}>No Transactions Found</p>
            <p style={{ fontSize: '13px' }}>Try modifying your search query or filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Investor Details</th>
                  <th style={{ textAlign: 'right' }}>Shares</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="tx-id-mono">{tx.id}</td>
                    <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      {tx.type === 'TRANSFER' ? (
                        <div className="investor-details-box transfer-info">
                          <div>
                            <span className="transfer-label-from">From:</span> {tx.fromInvestorName} <span style={{ color: 'var(--color-text-muted)' }}>(ID: {tx.fromInvestorId})</span>
                          </div>
                          <div>
                            <span className="transfer-label-to">To:</span> {tx.toInvestorName} <span style={{ color: 'var(--color-text-muted)' }}>(ID: {tx.toInvestorId})</span>
                          </div>
                        </div>
                      ) : (
                        <div className="investor-details-box" style={{ color: 'var(--color-text-white)' }}>
                          {tx.investorName} <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>(ID: {tx.investorId})</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-white)', whiteSpace: 'nowrap' }}>
                      {tx.shares} Units
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className="amount-highlight">
                      ৳{(tx.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {tx.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .history-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .history-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .history-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text-white);
          margin: 0;
        }
        .history-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }
        .history-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }
        .filter-group {
          display: flex;
          gap: 8px;
        }
        .filter-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--color-text-white);
        }
        .filter-btn.active {
          background: var(--color-warning);
          border-color: var(--color-warning);
          color: #000;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }
        .search-wrapper {
          position: relative;
          min-width: 280px;
        }
        .search-icon-local {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }
        .search-input-local {
          width: 100%;
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text-white);
          border-radius: var(--radius-sm);
          padding: 10px 12px 10px 38px;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .search-input-local:focus {
          outline: none;
          border-color: var(--color-warning);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
        .history-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .history-table th {
          padding: 14px 20px;
          background-color: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--color-border-light);
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .history-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border-light);
          color: var(--color-text);
          font-size: 14px;
        }
        .history-table tr:last-child td {
          border-bottom: none;
        }
        .history-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.015);
          color: var(--color-text-white);
        }
        .tx-id-mono {
          font-family: monospace;
          font-weight: 700;
          color: var(--color-text-white);
        }
        .badge-buy {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .badge-sell {
          background-color: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .badge-transfer {
          background-color: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .amount-highlight {
          font-weight: 700;
          color: var(--color-warning);
        }
        .investor-details-box {
          font-size: 13px;
          line-height: 1.4;
        }
        .transfer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .transfer-label-from {
          color: #EF4444;
          font-weight: 600;
        }
        .transfer-label-to {
          color: #10B981;
          font-weight: 600;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .history-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .search-wrapper {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
