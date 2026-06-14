import { useState, useEffect } from 'react';
import { getInvestors, addInvestor, updateInvestor, getShareStatus } from '../db';
import { Plus, Printer, Edit2, X } from 'lucide-react';
import { sendReceiptEmail } from '../email';

const getDynamicInvestorStatus = (inv) => {
  if (!inv.investments || inv.investments.length === 0) return inv.status || 'Pending';
  
  const currentDate = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonthName = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  let hasUltraActive = false;
  let hasActive = false;
  let hasPending = false;
  
  inv.investments.forEach(block => {
    if (block.status === 'Closed') return;
    const blockStatus = getShareStatus(block.joiningDate, currentYear, currentMonthName);
    if (blockStatus === 'Ultra Active') {
      hasUltraActive = true;
    } else if (blockStatus === 'Active') {
      hasActive = true;
    } else if (blockStatus === 'Pending') {
      hasPending = true;
    }
  });
  
  if (hasUltraActive) return 'Ultra Active';
  if (hasActive) return 'Active';
  if (hasPending) return 'Pending';
  return 'Closed';
};

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    id: '', name: '', mobile: '', guardianMobile: '', email: '', nid: '', address: '',
    shares: 0, referredBy: '', note: '', image: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadInvestors = async () => {
    const inv = await getInvestors();
    setInvestors(inv);
  };

  const calculateActivationDate = (joinDateStr) => {
    const d = new Date(joinDateStr);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };

  const getNextId = () => {
    let maxId = 1000;
    investors.forEach(inv => {
      let numStr = (inv.id || '').toString().replace(/\D/g, '');
      let num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });
    return maxId + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      if (formData.joiningDate) {
        dataToSave.activationDate = calculateActivationDate(formData.joiningDate);
      }
      
      if (editingId) {
        await updateInvestor(editingId, dataToSave);
      } else {
        const savedInvestor = await addInvestor(dataToSave);
        // Email receipt is no longer sent here because 0 shares are purchased.
        // It will be sent from InvestorProfile.jsx when they actually buy shares.
      }
      
      await loadInvestors();
      setShowModal(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      alert('Failed to save investor. Error: ' + err.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, image: compressedBase64 }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (inv) => {
    setFormData(inv);
    setEditingId(inv.id);
    setShowModal(true);
  };

  const handlePrint = (inv) => {
    const printContent = `
      <div style="font-family: Inter, sans-serif; padding: 40px; color: #000;">
        <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px;">WOORA INVESTMENT RECEIPT</h1>
        <div style="margin-top: 30px; line-height: 2;">
          <p><strong>Investor ID:</strong> ${inv.id}</p>
          <p><strong>Name:</strong> ${inv.name}</p>
          <p><strong>Mobile:</strong> ${inv.mobile}</p>
          <p><strong>Joining Date:</strong> ${inv.joiningDate}</p>
          <p><strong>Activation Date:</strong> ${inv.activationDate}</p>
          <p><strong>Shares Purchased:</strong> ${inv.shares} (৳${inv.amount.toLocaleString()})</p>
          <p><strong>Payment Method:</strong> ${inv.paymentMethod} ${inv.trxId ? `(Trx: ${inv.trxId})` : ''}</p>
          <p><strong>Status:</strong> ${inv.status}</p>
        </div>
        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; padding-top: 10px;">Investor Signature</div>
          <div style="border-top: 1px solid #000; padding-top: 10px;">Authorized Signature</div>
        </div>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  useEffect(() => {
    loadInvestors();
  }, []);


  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Investor Management</h1>
        <button className="btn btn-primary no-print" onClick={() => { setFormData(initialForm); setEditingId(null); setShowModal(true); }}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Add Investor
        </button>
      </div>

      <div className="card no-print" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Shares</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Activation</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-white)' }}>{inv.id}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-white)', fontWeight: 500 }}>{inv.name} <br/><span style={{fontSize:'12px', color:'var(--color-text-muted)'}}>{inv.mobile}</span></td>
                <td style={{ padding: '12px 16px' }}>{inv.shares}</td>
                <td style={{ padding: '12px 16px' }}>৳{inv.amount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>{inv.activationDate}</td>
                <td style={{ padding: '12px 16px' }}>
                  {(() => {
                    const dynamicStatus = getDynamicInvestorStatus(inv);
                    return (
                      <span className={`badge badge-${dynamicStatus.toLowerCase().replace(' ', '-')}`}>
                        {dynamicStatus}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(inv)} className="btn btn-secondary" style={{ padding: '6px' }} title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => handlePrint(inv)} className="btn btn-secondary" style={{ padding: '6px' }} title="Print Receipt"><Printer size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {investors.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No investors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: 'var(--color-text-white)' }}>{editingId ? 'Edit Investor' : 'New Investor'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label className="form-label">Photo</label>
                  <input type="file" accept="image/*" className="input-field" onChange={handleImageUpload} style={{ padding: '8px' }} />
                </div>
                {formData.image && (
                  <img src={formData.image} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                )}
              </div>
              <div><label className="form-label">Investor ID</label><input type="text" className="input-field" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} required disabled={!!editingId} /></div>
              <div><label className="form-label">Name</label><input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="form-label">Mobile</label><input type="text" className="input-field" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required /></div>
              <div><label className="form-label">Guardian Mobile</label><input type="text" className="input-field" value={formData.guardianMobile} onChange={e => setFormData({...formData, guardianMobile: e.target.value})} /></div>
              <div><label className="form-label">Email</label><input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className="form-label">NID / Birth Cert.</label><input type="text" className="input-field" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><input type="text" className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              

              <div><label className="form-label">Referred By (ID)</label><input type="text" className="input-field" value={formData.referredBy} onChange={e => setFormData({...formData, referredBy: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Note</label><input type="text" className="input-field" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
              
              <div style={{ gridColumn: '1 / -1', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Investor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ 
        position: 'fixed', 
        bottom: '24px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--color-primary)', 
        color: '#000', 
        padding: '12px 24px', 
        borderRadius: '24px', 
        fontWeight: 'bold', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', 
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>New investor id ({getNextId()})</span>
      </div>

      <style>{`
        .form-label { display: block; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text); }
      `}</style>
    </div>
  );
};

export default Investors;
