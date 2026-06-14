import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../db';
import { UserPlus, Shield, User, Mail, Phone, Hash, Edit2, Trash2 } from 'lucide-react';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nid: '',
    password: '',
    role: 'Co-founder'
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await getUsers();
      setUsers(allUsers);
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateUser(editingId, { ...formData });
      const allUsers = await getUsers();
      setUsers(allUsers);
      alert(`Successfully updated user`);
    } else {
      const newUser = await addUser({ ...formData });
      const allUsers = await getUsers();
      setUsers(allUsers);
      alert(`Successfully created user ${newUser.name} with ID ${newUser.id}`);
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '', email: '', phone: '', nid: '', password: '', role: 'Co-founder'
    });
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      nid: user.nid,
      password: user.password,
      role: user.role
    });
    setEditingId(user.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
      const allUsers = await getUsers();
      setUsers(allUsers);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Team Management</h1>
        <button className="btn btn-primary" onClick={() => {
          setIsAdding(!isAdding);
          if (isAdding) {
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', nid: '', password: '', role: 'Co-founder' });
          }
        }}>
          <UserPlus size={18} style={{ marginRight: '8px' }} />
          {isAdding ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>
            {editingId ? 'Edit Member' : 'Create New Member'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required placeholder="e.g. John Doe" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" required placeholder="john@woora.com" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" required placeholder="01XXXXXXXXX" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>NID / Birth Certificate</label>
              <input type="text" name="nid" value={formData.nid} onChange={handleInputChange} className="input-field" required placeholder="NID Number" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Password</label>
              <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="input-field" required placeholder="Set user password" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="input-field" required>
                <option value="Co-founder">Co-founder</option>
                <option value="CEO">CEO</option>
                <option value="Founder">Founder</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                {editingId ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ color: 'var(--color-text-white)', marginBottom: '16px', fontSize: '18px' }}>Active Members</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--color-text-white)' }}>#{user.id}</td>
                  <td style={{ padding: '16px', color: 'var(--color-text-white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: user.role === 'Founder' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: user.role === 'Founder' ? 'var(--color-primary)' : 'var(--color-success)', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                      <Shield size={14} /> {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span><Mail size={12} style={{ marginRight: '4px' }}/> {user.email}</span>
                      <span><Phone size={12} style={{ marginRight: '4px' }}/> {user.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEdit(user)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px' }} title="Edit User">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '4px' }} title="Delete User">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Team;
