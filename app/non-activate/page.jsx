"use client";

import { useState, useEffect } from 'react';
import { getUnactivatedInvestors } from '../../src/db';
import {
  UserX, User, Mail, Phone, Hash, Calendar, ChevronRight,
  Search, RefreshCw, AlertCircle, CreditCard, MapPin
} from 'lucide-react';

const SEEN_KEY = 'woora_seen_nonactivate';

const getSeenIds = () => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
};

const markAsSeen = (id) => {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
};

export default function NonActivatePage() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [seenIds, setSeenIds]     = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUnactivatedInvestors();
      setInvestors(data);
      setSeenIds(getSeenIds());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unseenCount = investors.filter(inv => !seenIds.includes(inv.id)).length;

  const filtered = investors.filter(inv => {
    const q = search.toLowerCase();
    return (
      (inv.id    || '').toLowerCase().includes(q) ||
      (inv.email || '').toLowerCase().includes(q) ||
      (inv.mobile|| '').toLowerCase().includes(q) ||
      (inv.name  || '').toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const aUnseen = !seenIds.includes(a.id);
    const bUnseen = !seenIds.includes(b.id);
    if (aUnseen && !bUnseen) return -1;
    if (!aUnseen && bUnseen) return 1;
    return 0;
  });

  const handleSelect = (inv) => {
    if (selected?.id === inv.id) {
      setSelected(null);
      return;
    }
    setSelected(inv);
    if (!seenIds.includes(inv.id)) {
      markAsSeen(inv.id);
      setSeenIds(prev => [...prev, inv.id]);
    }
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
            Registered users who have not yet completed their profile (Step 2)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {unseenCount > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '13px', fontWeight: 600, padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.25)' }}>
              {unseenCount} new
            </span>
          )}
          <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 600, padding: '4px 14px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
            {investors.length} total
          </span>
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
        These users created an account (email + mobile + password) but have not completed Step 2 — they cannot access the investor dashboard yet. Once they fill their name, NID and photo on the website, they will automatically become Investment Partners and move to the Investors list.
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search by ID, email or mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '38px', width: '100%', maxWidth: '380px' }}
        />
      </div>

      {/* List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <UserX size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>{search ? 'No results found.' : 'No pending accounts.'}</p>
            </div>
          ) : (
            <table className="inv-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Registered</th>
                  <th>Referred By</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const isSeen = seenIds.includes(inv.id);
                  return (
                  <tr
                    key={inv.id}
                    onClick={() => handleSelect(inv)}
                    style={{ cursor: 'pointer', background: selected?.id === inv.id ? 'rgba(59,130,246,0.08)' : undefined, opacity: isSeen ? 0.5 : 1, transition: 'background 0.15s, opacity 0.15s' }}
                  >
                    <td>
                      <span style={{ fontWeight: isSeen ? 500 : 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{inv.id}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{inv.email || '—'}</td>
                    <td style={{ fontSize: '13px' }}>{inv.mobile || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {inv.referred_by ? <span style={{ color: 'var(--color-primary)' }}>#{inv.referred_by}</span> : 'Direct'}
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
        {selected && (
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Account Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#EF4444', marginBottom: '16px' }}>
              <AlertCircle size={14} />
              Profile not completed — waiting for user to fill Step 2
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: Hash,     label: 'Investor ID', value: `#${selected.id}` },
                { icon: Mail,     label: 'Email',       value: selected.email   || '—' },
                { icon: Phone,    label: 'Mobile',      value: selected.mobile  || '—' },
                { icon: Calendar, label: 'Registered',  value: selected.created_at ? new Date(selected.created_at).toLocaleString() : '—' },
                { icon: User,     label: 'Referred By', value: selected.referred_by ? `#${selected.referred_by}` : 'Direct' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Icon size={13} style={{ color: 'var(--color-text-muted)', marginTop: '3px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(59,130,246,0.06)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Once this user logs in and completes their profile on wooragroup.com, they will automatically appear in the Investors list as an Active partner.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
