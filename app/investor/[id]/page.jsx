"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvestors, deleteInvestor, addShareToInvestor, sellSharesFromInvestor, getShareStatus, transferShares } from '../../../src/db';
import { sendReceiptEmail } from '../../../src/email';
import { User, Phone, Mail, MapPin, CreditCard, Calendar, Activity, CheckCircle, Clock, Trash2, Plus, X, DollarSign, Printer } from 'lucide-react';

const getDynamicInvestorStatus = (inv) => {
  if (!inv) return 'Pending';
  if (!inv.investments || inv.investments.length === 0) return inv.status || 'Pending';
  
  const currentDate = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonthName = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  let hasActive = false;
  let hasPending = false;
  
  inv.investments.forEach(block => {
    if (block.status === 'Closed') return;
    const blockStatus = getShareStatus(block.joiningDate, currentYear, currentMonthName, block.status);
    if (blockStatus === 'Active') {
      hasActive = true;
    } else if (blockStatus === 'Pending') {
      hasPending = true;
    }
  });
  
  if (hasActive) return 'Active';
  if (hasPending) return 'Pending';
  return 'Closed';
};

const InvestorProfile = () => {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [investor, setInvestor] = useState(null);

  useEffect(() => {
    const fetchInv = async () => {
      const investors = await getInvestors();
      const inv = investors.find(i => i.id.toString() === id.toString());
      setInvestor(inv);
    };
    fetchInv();
  }, [id]);

  const [showAddShare, setShowAddShare] = useState(false);
  const [newShare, setNewShare] = useState({
    shares: 1,
    joiningDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    trxId: '',
    status: 'Pending'
  });

  const handleAddShare = async (e) => {
    e.preventDefault();
    if (!confirm(`Confirm: Buy ${newShare.shares} investment unit(s) for ${investor?.name || 'this investor'}?\n\nAmount: ৳${(newShare.shares * 500).toLocaleString()}\nPayment: ${newShare.paymentMethod}\nTrx ID: ${newShare.trxId || 'N/A'}`)) return;
    try {
      const activationDate = newShare.status === 'Active'
        ? newShare.joiningDate
        : new Date(new Date(newShare.joiningDate).setMonth(new Date(newShare.joiningDate).getMonth() + 1)).toISOString().split('T')[0];
      const shareData = {
        ...newShare,
        activationDate
      };
      const userStr = localStorage.getItem('woora_user');
      const adminId = userStr ? JSON.parse(userStr).id : 'System';
      const txId = await addShareToInvestor(investor.id, shareData, adminId);
      
      if (investor.email) {
        sendReceiptEmail({
          to_email: investor.email,
          to_name: investor.name,
          shares_count: shareData.shares,
          amount: shareData.shares * 500,
          joining_date: shareData.joiningDate,
          trx_id: txId || 'N/A',
          type: 'BUY',
          receipt_title: 'Thank You!',
          receipt_subtitle: 'Thank you for purchasing investment units of Woora.',
          receipt_emoji: '👏',
          appreciation_text: 'We sincerely appreciate your trust and support in Woora.'
        }).catch(err => console.error("Error sending share receipt email:", err));
      }

      const investors = await getInvestors();
      setInvestor(investors.find(i => i.id.toString() === id.toString()));
      setShowAddShare(false);
      setNewShare({ ...newShare, shares: 1, trxId: '' });
      alert("New share added successfully!");
    } catch (err) {
      alert("Error adding share: " + err.message);
    }
  };

  const [showSellModal, setShowSellModal] = useState(false);
  const [sellStep, setSellStep] = useState('input');
  const [sellData, setSellData] = useState({ sharesToSell: 1, editedBy: '', maxShares: 1 });

  const openSellModal = () => {
    const totalShares = investor.shares || 0;
    if (totalShares <= 0) {
      alert('This investor has no investment units to sell.');
      return;
    }
    const userStr = localStorage.getItem('woora_user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const authorizerId = userObj ? userObj.id : 'System';

    setSellData({ sharesToSell: 1, editedBy: authorizerId, maxShares: totalShares });
    setSellStep('input');
    setShowSellModal(true);
  };

  const changeSellQty = (delta) => {
    setSellData(prev => {
      const next = parseInt(prev.sharesToSell, 10) + delta;
      if (next < 1) return prev;
      if (next > prev.maxShares) return prev;
      return { ...prev, sharesToSell: next };
    });
  };

  const handleSellShares = async () => {
    const qty = parseInt(sellData.sharesToSell, 10);
    if (!qty || qty <= 0) { alert('Please enter a valid number of shares.'); return; }
    if (qty > sellData.maxShares) { alert('Cannot sell more than total shares.'); return; }
    try {
      const userStr = localStorage.getItem('woora_user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const authorizerId = userObj ? userObj.id : 'System';
      const txId = await sellSharesFromInvestor(investor.id, qty, authorizerId);
      
      if (investor.email) {
        sendReceiptEmail({
          to_email: investor.email,
          to_name: investor.name,
          shares_count: qty,
          amount: qty * 500,
          joining_date: new Date().toISOString().split('T')[0],
          trx_id: txId || 'N/A',
          type: 'SELL',
          receipt_title: 'Investment Units Sold Successfully',
          receipt_subtitle: `This receipt confirms that you have sold ${qty} investment unit(s) of Woora.`,
          receipt_emoji: '💸',
          appreciation_text: 'The refund amount has been successfully disbursed. Thank you for being a part of Woora.'
        }).catch(err => console.error("Error sending sell receipt email:", err));
      }

      const investors = await getInvestors();
      setInvestor(investors.find(i => i.id.toString() === id.toString()));
      setShowSellModal(false);
      alert(`✅ ${qty} investment unit(s) sold successfully! ৳${qty * 500} refunded from Reserve Fund.`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStep, setTransferStep] = useState('input');
  const [transferData, setTransferData] = useState({
    toInvestorId: '',
    blockIndex: 0,
    sharesToTransfer: 1,
    authorizedBy: ''
  });
  const [recipientName, setRecipientName] = useState('');
  const [recipientError, setRecipientError] = useState('');

  useEffect(() => {
    if (!transferData.toInvestorId) {
      setRecipientName('');
      setRecipientError('');
      return;
    }
    const lookupRecipient = async () => {
      try {
        const investors = await getInvestors();
        const found = investors.find(i => i.id.toString() === transferData.toInvestorId.toString());
        if (found) {
          if (found.id.toString() === investor.id.toString()) {
            setRecipientName('');
            setRecipientError('Cannot transfer shares to oneself');
          } else {
            setRecipientName(found.name);
            setRecipientError('');
          }
        } else {
          setRecipientName('');
          setRecipientError('Investor ID not found');
        }
      } catch (err) {
        setRecipientError('Error looking up investor');
      }
    };
    lookupRecipient();
  }, [transferData.toInvestorId, investor]);

  const openTransferModal = () => {
    if (!investor.investments || investor.investments.length === 0) {
      alert('This investor has no investment units to transfer.');
      return;
    }
    const userStr = localStorage.getItem('woora_user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const authorizerId = userObj ? userObj.id : 'System';

    setTransferData({
      toInvestorId: '',
      blockIndex: 0,
      sharesToTransfer: 1,
      authorizedBy: authorizerId
    });
    setTransferStep('input');
    setRecipientName('');
    setRecipientError('');
    setShowTransferModal(true);
  };

  const changeTransferQty = (delta) => {
    setTransferData(prev => {
      const selectedBlock = investor.investments[prev.blockIndex];
      const maxQty = selectedBlock ? parseInt(selectedBlock.shares, 10) : 0;
      const next = parseInt(prev.sharesToTransfer, 10) + delta;
      if (next < 1) return prev;
      if (next > maxQty) return prev;
      return { ...prev, sharesToTransfer: next };
    });
  };

  const handleTransferShares = async () => {
    const qty = parseInt(transferData.sharesToTransfer, 10);
    const selectedBlock = investor.investments[transferData.blockIndex];
    const maxQty = selectedBlock ? parseInt(selectedBlock.shares, 10) : 0;

    if (!transferData.toInvestorId.trim()) { alert('Please enter recipient Investor ID.'); return; }
    if (recipientError) { alert(recipientError); return; }
    if (!qty || qty <= 0 || qty > maxQty) { alert('Invalid transfer quantity.'); return; }

    try {
      const userStr = localStorage.getItem('woora_user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const authorizerId = userObj ? userObj.id : 'System';

      const result = await transferShares(
        investor.id,
        transferData.toInvestorId.trim(),
        transferData.blockIndex,
        qty,
        authorizerId
      );
      
      if (investor.email) {
        sendReceiptEmail({
          to_email: investor.email,
          to_name: investor.name,
          shares_count: qty,
          amount: qty * 500,
          joining_date: new Date().toISOString().split('T')[0],
          trx_id: result.txId || 'N/A',
          type: 'TRANSFER',
          transferor_name: investor.name,
          recipient_name: result.toName,
          receipt_title: 'Investment Units Transferred',
          receipt_subtitle: `You have successfully transferred ${qty} investment unit(s) of Woora to ${result.toName} (ID: ${transferData.toInvestorId.trim()}).`,
          receipt_emoji: '📤',
          appreciation_text: 'Thank you for your active cooperation and trust in Woora.'
        }).catch(err => console.error("Error sending transfer out receipt email:", err));
      }

      if (result.toEmail) {
        sendReceiptEmail({
          to_email: result.toEmail,
          to_name: result.toName,
          shares_count: qty,
          amount: qty * 500,
          joining_date: new Date().toISOString().split('T')[0],
          trx_id: result.txId || 'N/A',
          type: 'TRANSFER',
          transferor_name: result.fromName,
          recipient_name: result.toName,
          receipt_title: 'Investment Units Received',
          receipt_subtitle: `You have successfully received ${qty} investment unit(s) of Woora transferred from ${result.fromName} (ID: ${investor.id}).`,
          receipt_emoji: '📥',
          appreciation_text: 'Welcome! These investment units have been added to your portfolio. We appreciate your support in Woora.'
        }).catch(err => console.error("Error sending transfer in receipt email:", err));
      }

      const investors = await getInvestors();
      setInvestor(investors.find(i => i.id.toString() === id.toString()));
      setShowTransferModal(false);
      alert(`✅ ${qty} investment unit(s) successfully transferred to ${recipientName} (ID: ${transferData.toInvestorId})!`);
    } catch (err) {
      alert('Error transferring shares: ' + err.message);
    }
  };

  const handlePrint = () => {
    const status = getDynamicInvestorStatus(investor);
    const currentDate = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const currentMonthName = months[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    const investmentRows = (investor.investments || []).map((block, idx) => {
      const blockStatus = getShareStatus(block.joiningDate, currentYear, currentMonthName, block.status);
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;font-weight:600">${idx + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;font-weight:700">${block.shares}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right">৳${(block.amount || block.shares * 500).toLocaleString()}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">${block.joiningDate || 'N/A'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">${block.activationDate || 'N/A'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">${block.paymentMethod || 'N/A'}${block.trxId ? ` (${block.trxId})` : ''}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${blockStatus === 'Active' ? '#dcfce7;color:#166534' : blockStatus === 'Pending' ? '#fef9c3;color:#854d0e' : '#fee2e2;color:#991b1b'}">${blockStatus}</span></td>
      </tr>`;
    }).join('');

    const printContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Investment Statement - ${investor.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Inter,system-ui,sans-serif;color:#1a1a2e;padding:40px;max-width:900px;margin:0 auto}
.header{text-align:center;padding-bottom:24px;margin-bottom:32px;border-bottom:3px solid #1a1a2e}
.logo{font-size:36px;font-weight:800;letter-spacing:4px;color:#1a1a2e}
.subtitle{font-size:13px;color:#666;margin-top:6px;letter-spacing:1px}
.doc-title{font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:24px;display:flex;align-items:center;gap:10px}
.doc-title::before{content:'';display:inline-block;width:4px;height:22px;background:#00D09C;border-radius:2px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 40px;margin-bottom:32px}
.field{padding:10px 0;border-bottom:1px solid #f0f0f0}
.label{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#999;margin-bottom:3px}
.value{font-size:14px;font-weight:600;color:#1a1a2e}
.summary-box{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #00D09C;border-radius:12px;padding:24px;text-align:center;margin:28px 0}
.summary-big{font-size:32px;font-weight:800;color:#1a1a2e}
.summary-sub{font-size:13px;color:#666;margin-top:6px}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
thead th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;border-bottom:2px solid #e2e8f0}
.sig-row{display:flex;justify-content:space-between;margin-top:80px;padding-top:0}
.sig-box{text-align:center;width:200px;border-top:1.5px solid #333;padding-top:10px;font-size:11px;color:#888}
.footer{text-align:center;margin-top:48px;font-size:10px;color:#bbb;border-top:1px solid #eee;padding-top:16px}
@media print{body{padding:20px}}
</style></head><body>
<div class="header">
  <div class="logo">WOORA GROUP</div>
  <div class="subtitle">Institutional-Grade Investment Platform</div>
</div>

<div class="doc-title">Investment Statement</div>

<div class="info-grid">
  <div class="field"><div class="label">Investor ID</div><div class="value">${investor.id}</div></div>
  <div class="field"><div class="label">Full Name</div><div class="value">${investor.name || 'N/A'}</div></div>
  <div class="field"><div class="label">Mobile</div><div class="value">${investor.mobile || 'N/A'}</div></div>
  <div class="field"><div class="label">Email</div><div class="value">${investor.email || 'N/A'}</div></div>
  <div class="field"><div class="label">NID / Birth Certificate</div><div class="value">${investor.nid || 'N/A'}</div></div>
  <div class="field"><div class="label">Address</div><div class="value">${investor.address || 'N/A'}</div></div>
  <div class="field"><div class="label">Guardian Mobile</div><div class="value">${investor.guardianMobile || 'N/A'}</div></div>
  <div class="field"><div class="label">Overall Status</div><div class="value">${status}</div></div>
</div>

<div class="summary-box">
  <div class="summary-big">${investor.shares} Investment Units — ৳${(investor.amount || 0).toLocaleString()}</div>
  <div class="summary-sub">Total Investment Units Owned</div>
</div>

<div class="doc-title" style="font-size:16px;margin-top:36px">Investment Unit Details</div>
<table>
  <thead>
    <tr>
      <th style="text-align:center">#</th>
      <th style="text-align:center">Units</th>
      <th style="text-align:right">Amount</th>
      <th>Joining Date</th>
      <th>Activation Date</th>
      <th>Payment</th>
      <th style="text-align:center">Status</th>
    </tr>
  </thead>
  <tbody>
    ${investmentRows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:#999">No investment units found.</td></tr>'}
  </tbody>
</table>

<div class="sig-row">
  <div class="sig-box">Investor Signature</div>
  <div class="sig-box">Authorized Signature</div>
</div>

<div class="footer">
  Generated on ${currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} — WOORA Group<br>
  This is a computer-generated document and does not require a physical signature for internal records.
</div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const handleEmailSummary = async () => {
    if (!investor.email) { alert('This investor has no email address.'); return; }
    const status = getDynamicInvestorStatus(investor);
    try {
      await sendReceiptEmail({
        to_email: investor.email,
        to_name: investor.name,
        shares_count: investor.shares,
        amount: investor.amount || 0,
        joining_date: investor.joiningDate || 'N/A',
        trx_id: 'N/A',
        type: 'BUY',
        receipt_title: 'Your Investment Summary',
        receipt_subtitle: `You currently hold ${investor.shares} investment unit(s) worth ৳${(investor.amount || 0).toLocaleString()} in Woora Group.`,
        receipt_emoji: '📊',
        appreciation_text: `Status: ${status}. Thank you for being a valued investor with Woora Group.`
      });
      alert('Investment summary email sent to ' + investor.email);
    } catch (err) {
      alert('Failed to send email: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this investor? All their data and shares will be permanently removed, and their amount will be deducted from the total.")) {
      try {
        await deleteInvestor(investor.id, investor.amount);
        alert("Investor deleted successfully.");
        router.push('/investors');
      } catch (err) {
        alert("Failed to delete investor: " + err.message);
      }
    }
  };

  if (!investor) {
    return (
      <div style={{ textAlign: 'center', margin: '40px auto', color: 'var(--color-text-white)' }}>
        <h2>Investor Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>No investor found with ID: {id}</p>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => router.push('/investors')}>Back to Investors</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/investors')}>&larr; Back</button>
        <h1 className="page-title" style={{ margin: 0 }}>Investor Profile: {investor.name}</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', flexWrap: 'wrap' }}>
          {investor.image ? (
            <img src={investor.image} alt={investor.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: '32px', fontWeight: 'bold' }}>
              {investor.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ color: 'var(--color-text-white)', fontSize: '24px', marginBottom: '8px' }}>{investor.name}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                ID: {investor.id}
              </span>
              {(() => {
                const dynamicStatus = getDynamicInvestorStatus(investor);
                return (
                  <span className={`badge badge-${dynamicStatus.toLowerCase().replace(' ', '-')}`}>
                    Status: {dynamicStatus}
                  </span>
                );
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              <Printer size={16} style={{ marginRight: '6px' }} /> Print
            </button>
            <button onClick={handleEmailSummary} className="btn btn-secondary" style={{ color: '#10B981', borderColor: '#10B981' }}>
              <Mail size={16} style={{ marginRight: '6px' }} /> Email Summary
            </button>
            <button onClick={handleDelete} className="btn btn-secondary" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
              <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '16px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>Personal Info</h3>
            
            <InfoItem icon={<Phone size={18}/>} label="Mobile" value={investor.mobile} />
            <InfoItem icon={<User size={18}/>} label="Guardian Mobile" value={investor.guardianMobile || 'N/A'} />
            <InfoItem icon={<Mail size={18}/>} label="Email" value={investor.email || 'N/A'} />
            <InfoItem icon={<CreditCard size={18}/>} label="NID / Birth Cert." value={investor.nid || 'N/A'} />
            <InfoItem icon={<MapPin size={18}/>} label="Address" value={investor.address || 'N/A'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '16px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>Investment Details</h3>
            
            <InfoItem icon={<Calendar size={18}/>} label="Joining Date" value={investor.joiningDate || 'N/A'} />
            <InfoItem icon={<Clock size={18}/>} label="Activation Date" value={investor.activationDate || 'N/A'} />
            <InfoItem icon={<Activity size={18}/>} label="Investment Units" value={investor.shares} />
            <InfoItem icon={<CreditCard size={18}/>} label="Amount Invested" value={`৳${(investor.amount || 0).toLocaleString()}`} />
            <InfoItem icon={<CheckCircle size={18}/>} label="Payment Method" value={investor.paymentMethod ? `${investor.paymentMethod} ${investor.trxId ? `(Trx: ${investor.trxId})` : ''}` : 'N/A'} />
            <InfoItem icon={<User size={18}/>} label="Referred By" value={investor.referredBy || 'None'} />
          </div>
        </div>
        
        {/* Investments List Section */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '18px' }}>Investment Unit Purchases</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }} onClick={openSellModal}>
                <DollarSign size={16} style={{ marginRight: '6px' }} /> Sell Units
              </button>
              <button className="btn btn-secondary" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onClick={openTransferModal}>
                <Activity size={16} style={{ marginRight: '6px' }} /> Transfer Unit
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddShare(true)}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Buy New Unit
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {investor.investments && investor.investments.map((invShare, index) => (
              <div key={index} style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>Units</span>
                    <strong style={{ color: 'var(--color-text-white)' }}>{invShare.shares} (৳{invShare.amount})</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>Dates</span>
                    <span style={{ color: 'var(--color-text-white)', fontSize: '14px' }}>{invShare.joiningDate} &rarr; {invShare.activationDate}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>Status</span>
                    {(() => {
                      const currentDate = new Date();
                      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                      const currentMonthName = months[currentDate.getMonth()];
                      const currentYear = currentDate.getFullYear();
                      
                      const blockStatus = getShareStatus(invShare.joiningDate, currentYear, currentMonthName, invShare.status);
                      return (
                        <span className={`badge badge-${blockStatus.toLowerCase().replace(' ', '-')}`}>
                          {blockStatus}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>Payment</span>
                    <span style={{ color: 'var(--color-text-white)', fontSize: '14px' }}>{invShare.paymentMethod} {invShare.trxId ? `(${invShare.trxId})` : ''}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!investor.investments || investor.investments.length === 0) && (
              <p style={{ color: 'var(--color-text-muted)' }}>No investment unit history found.</p>
            )}
          </div>
        </div>

        {investor.note && (
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
            <h3 style={{ color: 'var(--color-text-white)', fontSize: '14px', marginBottom: '8px' }}>Notes</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{investor.note}</p>
          </div>
        )}

      </div>
      
      {showAddShare && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'var(--color-text-white)' }}>Buy New Unit</h2>
              <button onClick={() => setShowAddShare(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddShare} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Number of Investment Units</label>
                <input type="number" min="1" className="input-field" value={newShare.shares} onChange={e => setNewShare({...newShare, shares: e.target.value})} required />
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Joining Date</label>
                <input type="date" className="input-field" value={newShare.joiningDate} onChange={e => setNewShare({...newShare, joiningDate: e.target.value})} required />
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Status</label>
                <select className="input-field" value={newShare.status} onChange={e => setNewShare({...newShare, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Payment Method</label>
                <select className="input-field" value={newShare.paymentMethod} onChange={e => setNewShare({...newShare, paymentMethod: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="bkash">bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Transaction ID</label>
                <input type="text" className="input-field" value={newShare.trxId} onChange={e => setNewShare({...newShare, trxId: e.target.value})} required={newShare.paymentMethod !== 'Cash'} />
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddShare(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSellModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '460px', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ color: 'var(--color-text-white)', fontSize: '18px', margin: 0 }}>Sell Investment Units</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: 0 }}>{investor.name} — ID: {investor.id}</p>
                </div>
              </div>
              <button onClick={() => setShowSellModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}><X size={22}/></button>
            </div>

            {sellStep === 'input' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Units</p>
                    <p style={{ color: '#3B82F6', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{investor.shares}</p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Remaining After</p>
                    <p style={{ color: '#10B981', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{Math.max(0, (investor.shares || 0) - sellData.sharesToSell)}</p>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-white)' }}>Units to Sell <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Max: {sellData.maxShares})</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <button type="button" onClick={() => changeSellQty(-1)} style={{ width: '48px', height: '48px', background: 'var(--color-bg)', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={sellData.maxShares}
                      value={sellData.sharesToSell}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= sellData.maxShares) setSellData({...sellData, sharesToSell: val});
                      }}
                      style={{ flex: 1, textAlign: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', fontWeight: 'bold', outline: 'none', padding: '8px 0' }}
                    />
                    <button type="button" onClick={() => changeSellQty(1)} style={{ width: '48px', height: '48px', background: 'var(--color-bg)', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                      +
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Refund Amount</span>
                    <strong style={{ color: '#F59E0B', fontSize: '18px' }}>৳{(sellData.sharesToSell * 500).toLocaleString()}</strong>
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', margin: 0 }}>Will be deducted from 20% Reserve Fund</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSellModal(false)}>Cancel</button>
                  <button
                    type="button"
                    style={{ flex: 2, padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#F59E0B', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => {
                      if (sellData.sharesToSell <= 0) { alert('Select at least 1 share.'); return; }
                      setSellStep('confirm');
                    }}
                  >
                    <DollarSign size={16} /> Continue Sell
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                  <h3 style={{ color: '#EF4444', marginBottom: '8px', fontSize: '16px' }}>Confirm Share Sell</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                    Are you sure you want to sell <strong style={{ color: 'var(--color-text-white)' }}>{sellData.sharesToSell} shares</strong> from <strong style={{ color: 'var(--color-text-white)' }}>{investor.name}</strong>?
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[['Units to Sell', `${sellData.sharesToSell} shares`], ['Refund Amount', `৳${(sellData.sharesToSell * 500).toLocaleString()}`], ['Deducted From', 'Reserve Fund (20%)'], ['Authorized By', sellData.editedBy]].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{label}</span>
                      <strong style={{ color: 'var(--color-text-white)', fontSize: '13px' }}>{value}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSellStep('input')}>&larr; Go Back</button>
                  <button
                    type="button"
                    style={{ flex: 2, padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                    onClick={handleSellShares}
                  >
                    ✓ Yes, Confirm Sell
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTransferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '460px', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '16px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color="var(--color-primary)" />
                </div>
                <div>
                  <h2 style={{ color: 'var(--color-text-white)', fontSize: '18px', margin: 0 }}>Transfer Investment Units</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: 0 }}>From: {investor.name} — ID: {investor.id}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}><X size={22}/></button>
            </div>

            {transferStep === 'input' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-white)' }}>Select Investment Block to Transfer</label>
                  <select
                    className="input-field"
                    value={transferData.blockIndex}
                    onChange={e => {
                      const idx = parseInt(e.target.value, 10);
                      setTransferData(prev => ({
                        ...prev,
                        blockIndex: idx,
                        sharesToTransfer: 1
                      }));
                    }}
                  >
                    {investor.investments && investor.investments.map((block, idx) => {
                      const currentDate = new Date();
                      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                      const currentMonthName = months[currentDate.getMonth()];
                      const currentYear = currentDate.getFullYear();
                      const status = getShareStatus(block.joiningDate, currentYear, currentMonthName, block.status);
                      return (
                        <option key={idx} value={idx}>
                          Block {idx + 1}: {block.shares} Units (Status: {status}, Joined: {block.joiningDate})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-white)' }}>Recipient Investor ID</label>
                  <input
                    type="text"
                    className="input-field"
                    value={transferData.toInvestorId}
                    onChange={e => setTransferData({ ...transferData, toInvestorId: e.target.value })}
                    placeholder="Enter Recipient ID"
                  />
                  {recipientName && (
                    <p style={{ color: '#10B981', fontSize: '12px', marginTop: '6px', margin: 0 }}>✓ Recipient: <strong>{recipientName}</strong></p>
                  )}
                  {recipientError && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', margin: 0 }}>✗ {recipientError}</p>
                  )}
                </div>

                {(() => {
                  const block = investor.investments[transferData.blockIndex];
                  const maxShares = block ? parseInt(block.shares, 10) : 0;
                  return (
                    <div>
                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-white)' }}>Units to Transfer <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Max: {maxShares})</span></label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <button type="button" onClick={() => changeTransferQty(-1)} style={{ width: '48px', height: '48px', background: 'var(--color-bg)', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={maxShares}
                          value={transferData.sharesToTransfer}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= maxShares) setTransferData({...transferData, sharesToTransfer: val});
                          }}
                          style={{ flex: 1, textAlign: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', fontWeight: 'bold', outline: 'none', padding: '8px 0' }}
                        />
                        <button type="button" onClick={() => changeTransferQty(1)} style={{ width: '48px', height: '48px', background: 'var(--color-bg)', border: 'none', color: 'var(--color-text-white)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTransferModal(false)}>Cancel</button>
                  <button
                    type="button"
                    style={{ flex: 2, padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => {
                      const block = investor.investments[transferData.blockIndex];
                      const maxShares = block ? parseInt(block.shares, 10) : 0;
                      if (!transferData.toInvestorId.trim()) { alert('Please enter Recipient Investor ID.'); return; }
                      if (recipientError) { alert(recipientError); return; }
                      if (transferData.sharesToTransfer <= 0 || transferData.sharesToTransfer > maxShares) { alert('Invalid share quantity.'); return; }
                      setTransferStep('confirm');
                    }}
                  >
                    Continue Transfer
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
                  <h3 style={{ color: 'var(--color-primary)', marginBottom: '8px', fontSize: '16px' }}>Confirm Share Transfer</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                    You are transferring <strong style={{ color: 'var(--color-text-white)' }}>{transferData.sharesToTransfer} shares</strong> from <strong style={{ color: 'var(--color-text-white)' }}>{investor.name}</strong> to <strong style={{ color: 'var(--color-text-white)' }}>{recipientName} (ID: {transferData.toInvestorId})</strong>.
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
                    Note: The original joining date and share aging lifecycle progress will be preserved on the recipient's profile.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    ['Units to Transfer', `${transferData.sharesToTransfer} shares`],
                    ['From Investor', `${investor.name} (ID: ${investor.id})`],
                    ['Recipient Investor', `${recipientName} (ID: ${transferData.toInvestorId})`],
                    ['Original Date', investor.investments[transferData.blockIndex].joiningDate],
                    ['Authorized By', transferData.authorizedBy]
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{label}</span>
                      <strong style={{ color: 'var(--color-text-white)', fontSize: '13px' }}>{value}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTransferStep('input')}>&larr; Go Back</button>
                  <button
                    type="button"
                    style={{ flex: 2, padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                    onClick={handleTransferShares}
                  >
                    ✓ Yes, Confirm Transfer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ overflow: 'hidden' }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color: 'var(--color-text-white)', fontSize: '14px', marginTop: '2px', wordBreak: 'break-word' }}>{value}</p>
    </div>
  </div>
);

export default InvestorProfile;
