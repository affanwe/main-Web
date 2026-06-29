"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, FolderKanban, Video, FileWarning, History, Loader2 } from 'lucide-react';
import { getProjects, createProject, updateProject, deleteProject, uploadProjectImage, deleteProjectImage, uploadProjectVideo, logAudit, getAuditLogs } from '../../src/db';

const CATEGORIES = ['Real Estate', 'Agriculture', 'Technology', 'Infrastructure', 'Manufacturing', 'Renewable Energy', 'Food & Beverage', 'General'];
const STATUSES = ['Running', 'Coming Soon', 'Planning'];

const STATUS_COLORS = {
  'Running':      { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' },
  'Coming Soon':  { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' },
  'Planning':     { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' },
};

const SECTIONS = [
  { key: '1', label: 'Project Introduction', mediaType: 'image', mediaLabel: 'Image (max 2MB)' },
  { key: '2', label: 'How We Operate', mediaType: 'video', mediaLabel: 'Video (max 15MB)' },
  { key: '3', label: 'Business Strategy', mediaType: 'image', mediaLabel: 'Image (max 2MB)' },
  { key: '4', label: 'Market Opportunity', mediaType: 'image', mediaLabel: 'Image (max 2MB)' },
  { key: '5', label: 'Investment Opportunity', mediaType: 'image', mediaLabel: 'Image (max 2MB)' },
];

const emptyForm = {
  name: '', category: 'General', tagline: '', location: '', status: 'Planning', images: [],
  section1_desc: '', section1_image: '',
  section2_desc: '', section2_video: '',
  section3_desc: '', section3_image: '',
  section4_desc: '', section4_image: '',
  section5_desc: '', section5_image: '',
};

export default function ProjectsPage() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fileRef = useRef();
  const sectionFileRefs = useRef({});

  const load = async () => {
    setLoading(true);
    try { setProjects(await getProjects()); } catch (e) { alert(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category, tagline: p.tagline || '', location: p.location || '', status: p.status, images: p.images || [],
      section1_desc: p.section1_desc || '', section1_image: p.section1_image || '',
      section2_desc: p.section2_desc || '', section2_video: p.section2_video || '',
      section3_desc: p.section3_desc || '', section3_image: p.section3_image || '',
      section4_desc: p.section4_desc || '', section4_image: p.section4_image || '',
      section5_desc: p.section5_desc || '', section5_image: p.section5_image || '',
    });
    setEditingId(p.id);
    setShowModal(true);
  };
  const closeModal = () => { if (!saving && !uploading && !uploadingSection) setShowModal(false); };

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    if (form.images.length + arr.length > 5) { alert('Maximum 5 cover images.'); return; }
    for (const f of arr) { if (f.size > 2 * 1024 * 1024) { alert(`"${f.name}" exceeds 2MB limit.`); return; } }
    setUploading(true);
    try {
      const urls = await Promise.all(arr.map(f => uploadProjectImage(f)));
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (e) { alert('Upload failed: ' + e.message); }
    setUploading(false);
  };

  const removeImage = async (url) => {
    await deleteProjectImage(url);
    setForm(prev => ({ ...prev, images: prev.images.filter(u => u !== url) }));
  };

  const handleSectionMedia = async (sectionKey, file, mediaType) => {
    if (mediaType === 'image' && file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
    if (mediaType === 'video' && file.size > 15 * 1024 * 1024) { alert('Video must be under 15MB.'); return; }

    setUploadingSection(sectionKey);
    try {
      const mediaField = mediaType === 'video' ? `section${sectionKey}_video` : `section${sectionKey}_image`;
      const oldUrl = form[mediaField];
      if (oldUrl) await deleteProjectImage(oldUrl).catch(() => {});

      const url = mediaType === 'video' ? await uploadProjectVideo(file) : await uploadProjectImage(file);
      setForm(prev => ({ ...prev, [mediaField]: url }));
    } catch (e) { alert('Upload failed: ' + e.message); }
    setUploadingSection(null);
  };

  const removeSectionMedia = async (sectionKey, mediaType) => {
    const mediaField = mediaType === 'video' ? `section${sectionKey}_video` : `section${sectionKey}_image`;
    const url = form[mediaField];
    if (url) await deleteProjectImage(url).catch(() => {});
    setForm(prev => ({ ...prev, [mediaField]: '' }));
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const logs = await getAuditLogs('projects');
      setHistoryLogs(logs);
    } catch (e) { console.error('Failed to load history', e); }
    setHistoryLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Project name is required.'); return; }
    if (!form.category) { alert('Please select a category.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), category: form.category, tagline: form.tagline.trim(),
        description: '', location: form.location.trim(), status: form.status, images: form.images,
        section1_desc: form.section1_desc, section1_image: form.section1_image,
        section2_desc: form.section2_desc, section2_video: form.section2_video,
        section3_desc: form.section3_desc, section3_image: form.section3_image,
        section4_desc: form.section4_desc, section4_image: form.section4_image,
        section5_desc: form.section5_desc, section5_image: form.section5_image,
      };
      if (editingId) {
        await updateProject(editingId, payload);
        await logAudit({ category: 'projects', action: 'update', section: form.name.trim() });
      } else {
        await createProject(payload);
        await logAudit({ category: 'projects', action: 'create', section: form.name.trim() });
      }
      await load();
      setShowModal(false);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, images, projectName) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await Promise.all((images || []).map(url => deleteProjectImage(url)));
      await deleteProject(id);
      await logAudit({ category: 'projects', action: 'delete', section: projectName || id });
      await load();
    } catch (e) { alert(e.message); }
    setDeleting(null);
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' };
  const sectionHeaderStyle = { fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-white)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={22} color="var(--color-primary)" /> Projects
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
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
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', borderRadius: '12px' }}>
          <FolderKanban size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0 }}>No projects yet. Click "Create Project" to add one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {projects.map(p => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS['Planning'];
            return (
              <div key={p.id} className="card" style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', backgroundColor: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={36} color="var(--color-text-muted)" style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...sc }}>{p.status}</span>
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-white)', margin: 0 }}>{p.name}</h3>
                  {p.tagline && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>{p.tagline}</p>}
                  {p.location && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>📍 {p.location}</p>}
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(p.id, p.images, p.name)} disabled={deleting === p.id} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    {deleting === p.id ? '...' : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setShowHistory(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '14px', padding: '24px', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA' }}>
                <History size={18} /> Project History
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
                {historyLogs.map(log => {
                  const actionColors = {
                    create: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
                    update: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
                    delete: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
                  };
                  const ac = actionColors[log.action] || actionColors.update;
                  return (
                    <div key={log.id} style={{
                      padding: '14px 16px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                            {log.section || 'Unknown'}
                          </span>
                          <span style={{
                            marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                            background: ac.bg, color: ac.color,
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '28px', border: '1px solid var(--color-border)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-white)' }}>
                {editingId ? 'Edit Project' : 'Create Project'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. WOORA Heights" style={{ width: '100%' }} />
              </div>

              {/* Category + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status *</label>
                  <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Tagline + Location */}
              <div>
                <label style={labelStyle}>Short Tagline</label>
                <input className="input-field" value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="One-line summary shown on project card" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Banani, Dhaka" style={{ width: '100%' }} />
              </div>

              {/* Cover Images */}
              <div>
                <label style={labelStyle}>Cover Photos ({form.images.length}/5, max 2MB each)</label>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                {form.images.length < 5 && (
                  <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} style={{ width: '100%', padding: '12px', border: '2px dashed var(--color-border)', borderRadius: '10px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', marginBottom: '10px' }}>
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Click to upload cover photos'}
                  </button>
                )}
                {form.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(url)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                          <X size={12} />
                        </button>
                        {i === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />

              {/* 5 Content Sections */}
              {SECTIONS.map(sec => {
                const descField = `section${sec.key}_desc`;
                const mediaField = sec.mediaType === 'video' ? `section${sec.key}_video` : `section${sec.key}_image`;
                const mediaUrl = form[mediaField];
                const refKey = `section_${sec.key}`;

                return (
                  <div key={sec.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={sectionHeaderStyle}>
                      {sec.key}. {sec.label}
                    </h4>

                    {/* Description */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        className="input-field"
                        value={form[descField]}
                        onChange={e => setForm(p => ({ ...p, [descField]: e.target.value }))}
                        placeholder={`Write about ${sec.label.toLowerCase()}...`}
                        rows={4}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label style={labelStyle}>{sec.mediaLabel}</label>
                      <input
                        ref={el => sectionFileRefs.current[refKey] = el}
                        type="file"
                        accept={sec.mediaType === 'video' ? 'video/*' : 'image/*'}
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (e.target.files[0]) handleSectionMedia(sec.key, e.target.files[0], sec.mediaType);
                          e.target.value = '';
                        }}
                      />

                      {!mediaUrl ? (
                        <button
                          type="button"
                          onClick={() => sectionFileRefs.current[refKey]?.click()}
                          disabled={uploadingSection === sec.key}
                          style={{ width: '100%', padding: '10px', border: '2px dashed var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}
                        >
                          {uploadingSection === sec.key ? 'Uploading...' : (
                            <>{sec.mediaType === 'video' ? <Video size={14} /> : <Upload size={14} />} Upload {sec.mediaType}</>
                          )}
                        </button>
                      ) : (
                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                          {sec.mediaType === 'video' ? (
                            <video src={mediaUrl} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '8px', background: '#000' }} />
                          ) : (
                            <img src={mediaUrl} alt="" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button onClick={() => sectionFileRefs.current[refKey]?.click()} disabled={uploadingSection === sec.key} style={{ flex: 1, padding: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                              {uploadingSection === sec.key ? 'Uploading...' : 'Replace'}
                            </button>
                            <button onClick={() => removeSectionMedia(sec.key, sec.mediaType)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#EF4444', cursor: 'pointer' }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>Cancel</button>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }} disabled={saving || uploading || !!uploadingSection}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
