"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Phone, Hash } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('woora_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return <div style={{ color: 'var(--color-text-white)', padding: '24px' }}>Loading profile...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: 'var(--color-text-white)', fontSize: '24px', marginBottom: '8px' }}>{user.name}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: user.role === 'Founder' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: user.role === 'Founder' ? 'var(--color-primary)' : 'var(--color-success)', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
              <Shield size={14} /> {user.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <User size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</p>
              <p style={{ color: 'var(--color-text-white)', fontSize: '16px', marginTop: '4px' }}>#{user.id}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <Mail size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
              <p style={{ color: 'var(--color-text-white)', fontSize: '16px', marginTop: '4px' }}>{user.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <Phone size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
              <p style={{ color: 'var(--color-text-white)', fontSize: '16px', marginTop: '4px' }}>{user.phone || 'Not Provided'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <Hash size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NID / Birth Certificate</p>
              <p style={{ color: 'var(--color-text-white)', fontSize: '16px', marginTop: '4px' }}>{user.nid || 'Not Provided'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</p>
              <p style={{ color: 'var(--color-text-white)', fontSize: '16px', marginTop: '4px' }}>May 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
