"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, FolderKanban } from 'lucide-react';
import { getProjects, createProject, updateProject, deleteProject, uploadProjectImage, deleteProjectImage } from '../../src/db';

const CATEGORIES = ['Real Estate', 'Agriculture', 'Technology', 'Infrastructure', 'Manufacturing', 'Renewable Energy', 'Food & Beverage', 'General'];
const STATUSES = ['Running', 'Coming Soon', 'Planning'];

const STATUS_COLORS = {
  'Running':      { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' },
  'Coming Soon':  { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' },
  'Planning':     { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' },
};

const emptyForm = { name: '', category: 'General', tagline: '', description: '', location: '', status: 'Planning', images: [] };

export default function ProjectsPage() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try { setProjects(await getProjects()); } catch (e) { alert(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit   = (p)  => { setForm({ name: p.name, category: p.category, tagline: p.tagline || '', description: p.description || '', location: p.location || '', status: p.status, images: p.images || [] }); setEditingId(p.id); setShowModal(true); };
  const closeModal = ()   => { if (!saving && !uploading) setShowModal(false); };

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    if (form.images.length + arr.length > 5) { alert('Maximum 5 images per project.'); return; }
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

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Project name is required.'); return; }
    if (!form.category)    { alert('Please select a category.'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), category: form.category, tagline: form.tagline.trim(), description: form.description.trim(), location: form.location.trim(), status: form.status, images: form.images };
      if (editingId) {
        await updateProject(editingId, payload);
      } else {
        await createProject(payload);
      }
      await load();
      setShowModal(false);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, images) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await Promise.all((images || []).map(url => deleteProjectImage(url)));
      await deleteProject(id);
      await load();
    } catch (e) { alert(e.message); }
    setDeleting(null);
  };

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
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Plus size={16} /> Create Project
        </button>
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
                {/* Image */}
                <div style={{ height: '160px', backgroundColor: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={36} color="var(--color-text-muted)" style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...sc }}>{p.status}</span>
                  {p.images && p.images.length > 1 && (
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px' }}>+{p.images.length - 1} more</span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-white)', margin: 0 }}>{p.name}</h3>
                  {p.tagline && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>{p.tagline}</p>}
                  {p.location && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>📍 {p.location}</p>}
                </div>

                {/* Actions */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} className="btn btn-secondary" style={{ flex: 1, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(p.id, p.images)} disabled={deleting === p.id} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    {deleting === p.id ? '...' : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '28px', border: '1px solid var(--color-border)' }}>

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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Project Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. WOORA Heights" style={{ width: '100%' }} />
              </div>

              {/* Category + Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Category *</label>
                  <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Status *</label>
                  <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Short Tagline</label>
                <input className="input-field" value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="One-line summary shown on project card" style={{ width: '100%' }} />
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Banani, Dhaka" style={{ width: '100%' }} />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Full Description</label>
                <textarea className="input-field" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed project description, goals, timeline..." rows={5} style={{ width: '100%', resize: 'vertical' }} />
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Photos ({form.images.length}/5)
                </label>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                {form.images.length < 5 && (
                  <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} style={{ width: '100%', padding: '14px', border: '2px dashed var(--color-border)', borderRadius: '10px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', marginBottom: '10px' }}>
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Click to upload photos'}
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

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>Cancel</button>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }} disabled={saving || uploading}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
