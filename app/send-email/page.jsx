"use client";

import { useState, useEffect } from 'react';
import { getInvestors } from '../../src/db';
import LocomotiveText from '../../src/components/LocomotiveText';
import { Mail, Send, Users, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SendEmail = () => {
  const [investors, setInvestors] = useState([]);
  const [mode, setMode] = useState('range'); // 'range' or 'single'
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [singleId, setSingleId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [results, setResults] = useState(null);

  useEffect(() => {
    getInvestors().then(setInvestors).catch(console.error);
  }, []);

  const getTargetInvestors = () => {
    if (mode === 'single') {
      const inv = investors.find(i => String(i.id) === String(singleId));
      return inv ? [inv] : [];
    }
    const from = parseInt(fromId, 10);
    const to = parseInt(toId, 10);
    if (isNaN(from) || isNaN(to)) return [];
    return investors.filter(i => {
      const id = parseInt(i.id, 10);
      return !isNaN(id) && id >= from && id <= to && i.email;
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const targets = getTargetInvestors();
    if (targets.length === 0) return alert('No investors found with email in the selected range.');
    if (!subject.trim() || !message.trim()) return alert('Subject and message are required.');

    const confirmed = window.confirm(`Send email to ${targets.length} investor(s)?\n\n${targets.map(t => `#${t.id} - ${t.name || 'No name'} (${t.email})`).join('\n')}`);
    if (!confirmed) return;

    setSending(true);
    setResults(null);
    const prog = { sent: 0, total: targets.length, failed: 0 };
    setProgress({ ...prog });

    const failedList = [];

    for (const inv of targets) {
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'custom',
            to_email: inv.email,
            to_name: inv.name || 'Investor',
            subject: subject,
            message: message,
          }),
        });
        if (res.ok) {
          prog.sent++;
        } else {
          prog.failed++;
          failedList.push({ id: inv.id, name: inv.name, error: 'API error' });
        }
      } catch {
        prog.failed++;
        failedList.push({ id: inv.id, name: inv.name, error: 'Network error' });
      }
      setProgress({ ...prog });
    }

    setSending(false);
    setResults({ sent: prog.sent, failed: prog.failed, failedList });
  };

  const targets = getTargetInvestors();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title text-locomotive"><LocomotiveText text="Send Email" /></h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Form */}
        <div className="card card-premium" style={{ padding: '28px' }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              type="button"
              className={`btn ${mode === 'range' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('range')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Users size={16} /> Range (ID to ID)
            </button>
            <button
              type="button"
              className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('single')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <User size={16} /> Single Investor
            </button>
          </div>

          <form onSubmit={handleSend}>
            {/* Target Selection */}
            {mode === 'range' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">From ID</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 1001"
                    value={fromId}
                    onChange={e => setFromId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">To ID</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 1050"
                    value={toId}
                    onChange={e => setToId(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Investor ID</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 1001"
                  value={singleId}
                  onChange={e => setSingleId(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Subject */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Email Subject</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Important Update from Woora Group"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Message Body</label>
              <textarea
                className="input-field"
                placeholder="Write your message here... Each investor will receive a personalized email with their name."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
                required
                style={{ resize: 'vertical', minHeight: '160px', lineHeight: '1.6' }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || targets.length === 0}
              style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {sending ? (
                <><Loader2 size={18} className="spin" /> Sending ({progress.sent}/{progress.total})...</>
              ) : (
                <><Send size={18} /> Send to {targets.length} Investor{targets.length !== 1 ? 's' : ''}</>
              )}
            </button>
          </form>

          {/* Progress Bar */}
          {sending && progress.total > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((progress.sent + progress.failed) / progress.total) * 100}%`,
                  background: 'linear-gradient(90deg, #00D09C, #00b386)',
                  borderRadius: '3px',
                  transition: 'width 0.3s',
                }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'center' }}>
                {progress.sent} sent, {progress.failed} failed of {progress.total}
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '10px',
              background: results.failed > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(0,208,156,0.08)',
              border: `1px solid ${results.failed > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(0,208,156,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {results.failed > 0 ? <AlertCircle size={18} color="#ef4444" /> : <CheckCircle size={18} color="#00D09C" />}
                <strong style={{ color: 'var(--color-text-white)', fontSize: '14px' }}>
                  {results.sent} email{results.sent !== 1 ? 's' : ''} sent successfully
                  {results.failed > 0 && `, ${results.failed} failed`}
                </strong>
              </div>
              {results.failedList?.length > 0 && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                  {results.failedList.map((f, i) => (
                    <div key={i}>#{f.id} {f.name} — {f.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview + Target List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Investors */}
          <div className="card card-premium" style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--color-text-white)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} /> Target Investors ({targets.length})
            </h3>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {targets.length > 0 ? targets.map(inv => (
                <div key={inv.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: '6px', marginBottom: '4px',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-white)' }}>
                    <strong>#{inv.id}</strong> — {inv.name || 'No name'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{inv.email}</span>
                </div>
              )) : (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  {mode === 'range' ? 'Enter FROM and TO IDs to see matching investors' : 'Enter an Investor ID'}
                </p>
              )}
            </div>
          </div>

          {/* Email Preview */}
          <div className="card card-premium" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ color: 'var(--color-text-white)', marginBottom: '12px', fontSize: '14px' }}>
              Email Preview
            </h3>
            <div style={{
              background: '#ffffff', borderRadius: '10px', overflow: 'hidden',
              border: '1px solid var(--color-border)',
            }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '20px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '2px' }}>WOORA GROUP</div>
                <div style={{ width: '30px', height: '2px', background: '#00D09C', margin: '8px auto 0' }} />
              </div>
              {/* Body */}
              <div style={{ padding: '20px', color: '#333', fontSize: '13px', lineHeight: '1.7' }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '12px' }}>Assalamu Alaikum,</p>
                <p style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                  {targets.length > 0 ? targets[0].name || 'Investor' : '{Investor Name}'}
                </p>
                <div style={{ whiteSpace: 'pre-wrap', color: '#444' }}>
                  {message || 'Your message will appear here...'}
                </div>
              </div>
              {/* Footer */}
              <div style={{ background: '#f8f9fb', padding: '12px', textAlign: 'center', borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: '10px', color: '#aaa' }}>&copy; 2026 Woora Group</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-label { display: block; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SendEmail;
