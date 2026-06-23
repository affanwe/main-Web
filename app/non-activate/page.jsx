"use client";

import { useState, useEffect } from 'react';
import { getUnactivatedInvestors, acceptInvestorAsPartner } from '../../src/db';
import {
  UserX, User, Mail, Phone, Hash, Calendar, ChevronRight,
  Search, RefreshCw, ShieldCheck, Clock, AlertCircle, CreditCard, MapPin, CheckCircle2
} from 'lucide-react';

export default function NonActivatePage() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [accepting, setAccepting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUnactivatedInvestors();
      setInvestors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = investors.filter(inv => {
    const q = search.toLowerCase();
    return (
      (inv.id    || '').toLowerCase().includes(q) ||
      (inv.email || '').toLowerCase().includes(q) ||
      (inv.mobile|| '').toLowerCase().includes(q) ||
      (inv.name  || '').toLowerCase().includes(q)
    );
  });

  const handleAccept = async () => {
    if (!selected) return;
    if (!window.confirm(`Accept #${selected.id} as an Investment Partner?`)) return;
    setAccepting(true);
    try {
      await acceptInvestorAsPartner(selected.id);
      setInvestors(prev => prev.filter(i => i.id !== selected.id));
      setSelected(null);
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setAccepting(false);
    }
  };

  // Step tag: step1=registered only, step2=profile submitted (is_activated true, pending admin)
  const getStep = (inv) => {
    if (inv.is_activated && inv.name) return 'step2';
    return 'step1';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <UserX size={22} color="var(--color-primary)" />
            Non-Activated Accounts
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Pending verification — accept to make them Investment Partners
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '13px', fontWeight: 600, padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.25)' }}>
            {investors.length} pending
          </span>
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} />
          Step 1 only — registered, profile not filled
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          Step 2 done — profile submitted, awaiting admin approval
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search by ID, name, email or mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '38px', width: '100%', maxWidth: '380px' }}
        />
      </div>

      {/* List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <UserX size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>{search ? 'No results found.' : 'All accounts are verified!'}</p>
            </div>
          ) : (
            <table className="inv-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email / Mobile</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const step = getStep(inv);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
                      style={{ cursor: 'pointer', background: selected?.id === inv.id ? 'rgba(59,130,246,0.08)' : undefined, transition: 'background 0.15s' }}
                    >
                      <td>
                        {step === 'step2' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <Clock size={10} /> Awaiting Approval
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(107,114,128,0.12)', color: '#6b7280', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(107,114,128,0.25)' }}>
                            <AlertCircle size={10} /> Profile Incomplete
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{inv.id}</span>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 500 }}>{inv.name || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <div>{inv.email || '—'}</div>
                        <div>{inv.mobile || '—'}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ChevronRight size={16} color="var(--color-text-muted)" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (() => {
          const step = getStep(selected);
          return (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Account Details</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>

              {/* Step badge */}
              <div style={{ marginBottom: '16px' }}>
                {step === 'step2' ? (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#f59e0b' }}>
                    <Clock size={14} />
                    Profile submitted — waiting for admin approval to become Investment Partner
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.25)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                    <AlertCircle size={14} />
                    Registered only — user has not completed their profile yet
                  </div>
                )}
              </div>

              {/* Photo */}
              {selected.image && (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <img src={selected.image} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
                </div>
              )}

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {[
                  { icon: Hash,       label: 'Investor ID',     value: `#${selected.id}` },
                  { icon: User,       label: 'Full Name',       value: selected.name    || '—' },
                  { icon: Mail,       label: 'Email',           value: selected.email   || '—' },
                  { icon: Phone,      label: 'Mobile',          value: selected.mobile  || '—' },
                  { icon: CreditCard, label: 'NID',             value: selected.nid     || '—' },
                  { icon: Phone,      label: 'Guardian Mobile', value: selected.guardian_mobile || '—' },
                  { icon: MapPin,     label: 'Address',         value: selected.address || '—' },
                  { icon: User,       label: 'Referred By',     value: selected.referred_by ? `#${selected.referred_by}` : 'Direct' },
                  { icon: Calendar,   label: 'Registered',      value: selected.created_at ? new Date(selected.created_at).toLocaleString() : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Icon size={13} style={{ color: 'var(--color-text-muted)', marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all', color: value === '—' ? 'var(--color-text-muted)' : undefined }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Accept button — only if profile is filled */}
              {step === 'step2' ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} />
                  {accepting ? 'Processing...' : 'Accept as Investment Partner'}
                </button>
              ) : (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(107,114,128,0.06)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Cannot accept yet — user must complete their profile first
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
