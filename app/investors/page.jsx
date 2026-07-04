"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getInvestors, addInvestor, updateInvestor, getShareStatus } from '../../src/db';
import { supabase } from '../../src/supabase';
import LocomotiveText from '../../src/components/LocomotiveText';
import { Plus, X, ShieldCheck, ShieldOff } from 'lucide-react';

const getDynamicInvestorStatus = (inv) => {
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

const Investors = () => {
  const router = useRouter();
  const [investors, setInvestors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    id: '', name: '', mobile: '', guardianMobile: '', email: '', nid: '', address: '',
    shares: 0, referredBy: '', note: '', image: '', password: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

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

  const [nextIdFromCounter, setNextIdFromCounter] = useState(null);
  useEffect(() => {
    supabase.from('metadata').select('value').eq('key', 'counters').single()
      .then(({ data }) => {
        const lastId = data?.value?.lastInvestorId || 1000;
        setNextIdFromCounter(lastId + 1);
      });
  }, [investors]);

  const getNextId = () => nextIdFromCounter || '...';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...formData };
      if (formData.joiningDate) {
        dataToSave.activationDate = calculateActivationDate(formData.joiningDate);
      }

      if (editingId) {
        await updateInvestor(editingId, dataToSave);
      } else {
        // If password provided, create Supabase Auth user first
        if (formData.password && formData.email) {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
          });
          if (authErr) throw new Error('Login account creation failed: ' + authErr.message);
          dataToSave.uid = authData?.user?.id || null;
          // Sign out so admin session is not affected
          await supabase.auth.signOut();
        }
        await addInvestor(dataToSave);
      }

      await loadInvestors();
      setShowModal(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      alert('Failed to save investor. Error: ' + err.message);
    }
    setSaving(false);
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

  useEffect(() => {
    loadInvestors();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title text-locomotive"><LocomotiveText text="Investor Management" /></h1>
        <button className="btn btn-primary btn-magnetic no-print" onClick={() => { setFormData(initialForm); setEditingId(null); setShowModal(true); }}>
          <Plus size={18} style={{ marginRight: '8px' }} /> <LocomotiveText text="Add Investor" />
        </button>
      </div>

      <div className="card card-premium no-print" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="ID" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Name" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Units" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Amount" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Activation" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Status" /></th>
              <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}><LocomotiveText text="Login" /></th>
            </tr>
          </thead>
          <tbody>
            {investors.map(inv => (
              <tr key={inv.id} className="tr-hover-premium" onClick={() => router.push(`/investor/${inv.id}`)} style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer' }}>
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
                  {inv.uid
                    ? <span title="Has login access" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><ShieldCheck size={15} /> Active</span>
                    : <span title="No login" style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><ShieldOff size={15} /> None</span>
                  }
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

              {!editingId && (
                <div style={{ gridColumn: '1 / -1', padding: '16px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-white)' }}>Login Access (Optional)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
                    Password set করলে investor তার email + এই password দিয়ে wooragroup.com এ login করতে পারবে।
                  </p>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Password (minimum 6 characters)"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    minLength={formData.password ? 6 : undefined}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              
              <div><label className="form-label">Referred By (ID)</label><input type="text" className="input-field" value={formData.referredBy} onChange={e => setFormData({...formData, referredBy: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Note</label><input type="text" className="input-field" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
              
              <div style={{ gridColumn: '1 / -1', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Investor'}</button>
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
