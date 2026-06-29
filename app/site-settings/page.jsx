"use client";

import { useState, useEffect } from 'react';
import { getSiteSettings, saveSiteSettings, logAudit, getAuditLogs } from '../../src/db';
import {
  Globe, CreditCard, Building2, Home, FileText, Layout,
  Save, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, History, X
} from 'lucide-react';

const TABS = [
  { key: 'payment', label: 'Payment Methods', icon: CreditCard },
  { key: 'company', label: 'Company Info', icon: Building2 },
  { key: 'home', label: 'Home Page', icon: Home },
  { key: 'about', label: 'About Page', icon: FileText },
  { key: 'footer', label: 'Footer & Meta', icon: Layout },
];

const DEFAULT_PAYMENT_METHODS = [
  { name: 'bKash', type: 'MFS', number: '01712-345678', active: true },
  { name: 'Nagad', type: 'MFS', number: '01812-345678', active: true },
  { name: 'Rocket', type: 'MFS', number: '01912-345678-0', active: true },
  { name: 'Cash', type: 'Cash', number: '', active: true, address: 'Office — Gulshan 2, Dhaka' },
];

const DEFAULT_COMPANY = {
  name: 'WOORA Group',
  foundedYear: '2026',
  phone: '+880 1712-345678',
  email: 'support@wooragroup.com',
  address: 'Gulshan 2, Dhaka',
  officeAddress: 'Level 5, WOORA Tower, Road 12\nGulshan-2, Dhaka',
  description: 'Connecting investors with institutional-grade opportunities across Real Estate, Technology, Agriculture, and Renewable Energy sectors.',
  verificationTimeline: '1–4 hours',
};

const DEFAULT_HOME = {
  heroLine1: "Let's make",
  heroLine2: 'Your dream a reality',
  heroSubtitle: 'Access premium, vetted investment opportunities across Real Estate, Agriculture, and Technology. Start with just ৳500 per share.',
  sharePrice: 500,
  roiDisplay: 25,
  tiers: [
    { name: 'Bronze', shares: 50, cost: 25000 },
    { name: 'Silver', shares: 200, cost: 100000 },
    { name: 'Gold', shares: 1000, cost: 500000 },
  ],
  ctaTitle: 'Ready to Get Started?',
  ctaSubtitle: 'Create an account or explore our active projects to start investing today.',
};

const DEFAULT_ABOUT = {
  storyHeading: 'Democratizing Investment Access in Bangladesh',
  storyParagraphs: [
    'Founded with a vision to democratize investment access in Bangladesh, WOORA Group connects everyday investors with institutional-grade opportunities across Real Estate, Technology, Agriculture, and Renewable Energy sectors.',
    "We believe that wealth creation shouldn't be reserved for the privileged few. By fractionalizing ownership of premium assets into affordable shares starting at just ৳500, we've opened the doors for Bangladeshi citizens to participate in institutional-quality investments that were previously inaccessible.",
    'Our team comprises seasoned financial analysts, technology experts, and industry veterans who work tirelessly to identify, vet, and manage high-yield opportunities — so our investors can grow their wealth with confidence.',
  ],
  mission: 'To empower every citizen of Bangladesh with accessible, transparent, and high-yield investment opportunities. We strive to break down financial barriers and build a platform where anyone — regardless of economic background — can participate in institutional-grade asset ownership and create sustainable, generational wealth.',
  vision: "To become South Asia's most trusted fractional investment platform by 2030, managing over ৳50 Billion in diversified assets. We envision a future where technology-driven financial inclusion eliminates inequality and creates a thriving community of empowered investors building wealth together.",
  visionYear: '2030',
  visionTarget: '৳50 Billion',
  values: [
    { title: 'Transparency', description: 'Every investment decision, fund allocation, and project update is shared openly with our investor community. No hidden fees, no surprises.' },
    { title: 'Innovation', description: 'We leverage cutting-edge fintech, blockchain verification, and AI-driven analytics to identify and manage the highest-potential investment opportunities.' },
    { title: 'Security', description: 'Enterprise-grade data encryption, multi-layer admin verification, and strict regulatory compliance protect every transaction and investor account.' },
    { title: 'Growth', description: 'Our diversified portfolio strategy across multiple high-growth sectors ensures consistent, compounding returns for long-term wealth creation.' },
  ],
};

const DEFAULT_FOOTER = {
  description: 'Connecting investors with institutional-grade opportunities across Real Estate, Technology, Agriculture, and Renewable Energy sectors.',
  email: 'support@wooragroup.com',
  phone: '+880 1712-345678',
  address: 'Gulshan 2, Dhaka',
  poweredBy: 'Powered by Woora Tech',
  siteTitle: 'WOORA GROUP - Institutional-Grade Investment Platform',
  metaDescription: 'Access premium, vetted investment opportunities across Real Estate, Agriculture, and Technology. Start with just ৳500 per share.',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
};

const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' };

const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: 'rgba(255,255,255,0.7)', marginBottom: '6px',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px', padding: '24px', marginBottom: '20px',
};

const SECTION_LABELS = {
  site_payment_methods: 'Payment Methods',
  site_company_info: 'Company Info',
  site_content_home: 'Home Page',
  site_content_about: 'About Page',
  site_content_footer: 'Footer & Meta',
};

const SiteSettings = () => {
  const [activeTab, setActiveTab] = useState('payment');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [home, setHome] = useState(DEFAULT_HOME);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [pm, co, ho, ab, ft] = await Promise.all([
          getSiteSettings('site_payment_methods', DEFAULT_PAYMENT_METHODS),
          getSiteSettings('site_company_info', DEFAULT_COMPANY),
          getSiteSettings('site_content_home', DEFAULT_HOME),
          getSiteSettings('site_content_about', DEFAULT_ABOUT),
          getSiteSettings('site_content_footer', DEFAULT_FOOTER),
        ]);
        setPaymentMethods(pm);
        setCompany(co);
        setHome(ho);
        setAbout(ab);
        setFooter(ft);
      } catch (e) {
        console.error('Failed to load site settings', e);
      }
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await saveSiteSettings(key, value);
      await logAudit({
        category: 'settings',
        action: 'update',
        section: SECTION_LABELS[key] || key,
      });
      setSaved(key);
      setTimeout(() => setSaved(''), 2000);
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
    setSaving(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const logs = await getAuditLogs('settings');
      setHistoryLogs(logs);
    } catch (e) {
      console.error('Failed to load history', e);
    }
    setHistoryLoading(false);
  };

  const SaveButton = ({ settingsKey, value }) => (
    <button
      onClick={() => handleSave(settingsKey, value)}
      disabled={saving}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '10px 24px', borderRadius: '8px', border: 'none',
        background: saved === settingsKey ? '#00D09C' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
        color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        marginTop: '16px', transition: 'all 0.3s',
      }}
    >
      {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
      {saved === settingsKey ? 'Saved!' : 'Save Changes'}
    </button>
  );

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        <Loader2 size={32} className="spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
            <Globe size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Site Settings</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Control public website content from here
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowHistory(true); loadHistory(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#A78BFA', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <History size={15} /> History
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', border: 'none', borderRadius: '8px 8px 0 0',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.5)',
                fontWeight: isActive ? 600 : 400, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.2s',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
              }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== PAYMENT METHODS TAB ===== */}
      {activeTab === 'payment' && (
        <div>
          {paymentMethods.map((pm, idx) => (
            <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={labelStyle}>Method Name</label>
                <input style={inputStyle} value={pm.name}
                  onChange={e => { const arr = [...paymentMethods]; arr[idx] = { ...arr[idx], name: e.target.value }; setPaymentMethods(arr); }} />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={pm.type}
                  onChange={e => { const arr = [...paymentMethods]; arr[idx] = { ...arr[idx], type: e.target.value }; setPaymentMethods(arr); }}>
                  <option value="MFS">MFS (Mobile)</option>
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div style={{ flex: '2 1 200px' }}>
                <label style={labelStyle}>{pm.type === 'Cash' ? 'Office Address' : 'Account Number'}</label>
                <input style={inputStyle}
                  value={pm.type === 'Cash' ? (pm.address || '') : pm.number}
                  onChange={e => {
                    const arr = [...paymentMethods];
                    if (pm.type === 'Cash') arr[idx] = { ...arr[idx], address: e.target.value };
                    else arr[idx] = { ...arr[idx], number: e.target.value };
                    setPaymentMethods(arr);
                  }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                <button
                  onClick={() => { const arr = [...paymentMethods]; arr[idx] = { ...arr[idx], active: !arr[idx].active }; setPaymentMethods(arr); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: pm.active ? '#00D09C' : 'rgba(255,255,255,0.3)' }}
                  title={pm.active ? 'Active' : 'Inactive'}
                >
                  {pm.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <button
                  onClick={() => { if (paymentMethods.length > 1) setPaymentMethods(paymentMethods.filter((_, i) => i !== idx)); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.7)' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setPaymentMethods([...paymentMethods, { name: '', type: 'MFS', number: '', active: true }])}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add Payment Method
          </button>

          <div><SaveButton settingsKey="site_payment_methods" value={paymentMethods} /></div>
        </div>
      )}

      {/* ===== COMPANY INFO TAB ===== */}
      {activeTab === 'company' && (
        <div>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {[
                ['Company Name', 'name'],
                ['Founded Year', 'foundedYear'],
                ['Phone', 'phone'],
                ['Email', 'email'],
                ['Address', 'address'],
                ['Verification Timeline', 'verificationTimeline'],
              ].map(([label, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={company[field] || ''}
                    onChange={e => setCompany({ ...company, [field]: e.target.value })} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Company Description</label>
              <textarea style={textareaStyle} value={company.description || ''}
                onChange={e => setCompany({ ...company, description: e.target.value })} />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Office Full Address (for Cash Payment)</label>
              <textarea style={{ ...textareaStyle, minHeight: '70px' }} value={company.officeAddress || ''}
                onChange={e => setCompany({ ...company, officeAddress: e.target.value })} />
            </div>
          </div>
          <SaveButton settingsKey="site_company_info" value={company} />
        </div>
      )}

      {/* ===== HOME PAGE TAB ===== */}
      {activeTab === 'home' && (
        <div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Hero Section</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Hero Line 1</label>
                <input style={inputStyle} value={home.heroLine1 || ''}
                  onChange={e => setHome({ ...home, heroLine1: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Hero Line 2 (Gradient)</label>
                <input style={inputStyle} value={home.heroLine2 || ''}
                  onChange={e => setHome({ ...home, heroLine2: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Hero Subtitle</label>
              <textarea style={{ ...textareaStyle, minHeight: '70px' }} value={home.heroSubtitle || ''}
                onChange={e => setHome({ ...home, heroSubtitle: e.target.value })} />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Pricing & Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Unit Price (৳ per unit)</label>
                <input style={inputStyle} type="number" value={home.sharePrice || 500}
                  onChange={e => setHome({ ...home, sharePrice: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>ROI Display (%)</label>
                <input style={inputStyle} type="number" value={home.roiDisplay || 25}
                  onChange={e => setHome({ ...home, roiDisplay: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Pricing Tiers</h3>
            {(home.tiers || []).map((tier, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: '1' }} placeholder="Tier Name" value={tier.name}
                  onChange={e => { const t = [...home.tiers]; t[idx] = { ...t[idx], name: e.target.value }; setHome({ ...home, tiers: t }); }} />
                <input style={{ ...inputStyle, flex: '1' }} type="number" placeholder="Units" value={tier.shares}
                  onChange={e => { const t = [...home.tiers]; t[idx] = { ...t[idx], shares: Number(e.target.value) }; setHome({ ...home, tiers: t }); }} />
                <input style={{ ...inputStyle, flex: '1' }} type="number" placeholder="Cost (৳)" value={tier.cost}
                  onChange={e => { const t = [...home.tiers]; t[idx] = { ...t[idx], cost: Number(e.target.value) }; setHome({ ...home, tiers: t }); }} />
                <button onClick={() => { const t = home.tiers.filter((_, i) => i !== idx); setHome({ ...home, tiers: t }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.7)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={() => setHome({ ...home, tiers: [...(home.tiers || []), { name: '', shares: 0, cost: 0 }] })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer' }}>
              <Plus size={12} /> Add Tier
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Bottom CTA</h3>
            <div>
              <label style={labelStyle}>CTA Title</label>
              <input style={inputStyle} value={home.ctaTitle || ''} onChange={e => setHome({ ...home, ctaTitle: e.target.value })} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>CTA Subtitle</label>
              <input style={inputStyle} value={home.ctaSubtitle || ''} onChange={e => setHome({ ...home, ctaSubtitle: e.target.value })} />
            </div>
          </div>

          <SaveButton settingsKey="site_content_home" value={home} />
        </div>
      )}

      {/* ===== ABOUT PAGE TAB ===== */}
      {activeTab === 'about' && (
        <div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Our Story</h3>
            <div>
              <label style={labelStyle}>Story Heading</label>
              <input style={inputStyle} value={about.storyHeading || ''}
                onChange={e => setAbout({ ...about, storyHeading: e.target.value })} />
            </div>
            {(about.storyParagraphs || []).map((p, idx) => (
              <div key={idx} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <textarea style={{ ...textareaStyle, flex: 1 }} value={p}
                  onChange={e => { const arr = [...about.storyParagraphs]; arr[idx] = e.target.value; setAbout({ ...about, storyParagraphs: arr }); }} />
                <button onClick={() => { const arr = about.storyParagraphs.filter((_, i) => i !== idx); setAbout({ ...about, storyParagraphs: arr }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.7)', paddingTop: '10px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={() => setAbout({ ...about, storyParagraphs: [...(about.storyParagraphs || []), ''] })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '6px 14px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer' }}>
              <Plus size={12} /> Add Paragraph
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Mission & Vision</h3>
            <div>
              <label style={labelStyle}>Mission Statement</label>
              <textarea style={textareaStyle} value={about.mission || ''}
                onChange={e => setAbout({ ...about, mission: e.target.value })} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Vision Statement</label>
              <textarea style={textareaStyle} value={about.vision || ''}
                onChange={e => setAbout({ ...about, vision: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div>
                <label style={labelStyle}>Vision Target Year</label>
                <input style={inputStyle} value={about.visionYear || ''}
                  onChange={e => setAbout({ ...about, visionYear: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Vision Target Amount</label>
                <input style={inputStyle} value={about.visionTarget || ''}
                  onChange={e => setAbout({ ...about, visionTarget: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Core Values</h3>
            {(about.values || []).map((val, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 180px' }}>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={val.title}
                    onChange={e => { const arr = [...about.values]; arr[idx] = { ...arr[idx], title: e.target.value }; setAbout({ ...about, values: arr }); }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...textareaStyle, minHeight: '60px' }} value={val.description}
                    onChange={e => { const arr = [...about.values]; arr[idx] = { ...arr[idx], description: e.target.value }; setAbout({ ...about, values: arr }); }} />
                </div>
                <button onClick={() => { const arr = about.values.filter((_, i) => i !== idx); setAbout({ ...about, values: arr }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.7)', paddingTop: '24px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={() => setAbout({ ...about, values: [...(about.values || []), { title: '', description: '' }] })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer' }}>
              <Plus size={12} /> Add Value
            </button>
          </div>

          <SaveButton settingsKey="site_content_about" value={about} />
        </div>
      )}

      {/* ===== FOOTER & META TAB ===== */}
      {activeTab === 'footer' && (
        <div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Footer Content</h3>
            <div>
              <label style={labelStyle}>Footer Description</label>
              <textarea style={{ ...textareaStyle, minHeight: '70px' }} value={footer.description || ''}
                onChange={e => setFooter({ ...footer, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={footer.email || ''}
                  onChange={e => setFooter({ ...footer, email: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={footer.phone || ''}
                  onChange={e => setFooter({ ...footer, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={footer.address || ''}
                  onChange={e => setFooter({ ...footer, address: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Powered By Text</label>
              <input style={inputStyle} value={footer.poweredBy || ''}
                onChange={e => setFooter({ ...footer, poweredBy: e.target.value })} />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>Site Meta (SEO)</h3>
            <div>
              <label style={labelStyle}>Site Title</label>
              <input style={inputStyle} value={footer.siteTitle || ''}
                onChange={e => setFooter({ ...footer, siteTitle: e.target.value })} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Meta Description</label>
              <textarea style={{ ...textareaStyle, minHeight: '70px' }} value={footer.metaDescription || ''}
                onChange={e => setFooter({ ...footer, metaDescription: e.target.value })} />
            </div>
          </div>

          <SaveButton settingsKey="site_content_footer" value={footer} />
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setShowHistory(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '14px', padding: '24px', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA' }}>
                <History size={18} /> Settings Change History
              </h2>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                <Loader2 size={24} className="spin" /> Loading history...
              </div>
            ) : historyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No changes recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyLogs.map(log => (
                  <div key={log.id} style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                          {log.section || log.action}
                        </span>
                        <span style={{
                          marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                          background: 'rgba(59,130,246,0.15)', color: '#60A5FA',
                        }}>
                          {log.action}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                        {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      by <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{log.admin_name}</strong>
                      <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.3)' }}>(ID: {log.admin_id})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SiteSettings;
