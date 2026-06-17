"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../src/db';
import { Shield } from 'lucide-react';
import { sendOtpEmail } from '../../src/email';

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const [actualOtp, setActualOtp] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await loginUser(email, password);
    if (user) {
      localStorage.setItem('woora_user_temp', JSON.stringify(user));
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setActualOtp(generatedOtp);
      setStep(2); // Move to 2FA
      setError('');
      
      // Send real email via helper
      sendOtpEmail(user.email, user.name, generatedOtp)
        .then(() => {
          console.log('OTP sent successfully');
        })
        .catch((err) => {
          console.error('Failed to send OTP email:', err);
          const errorMsg = err?.text || err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          setError(`Failed to send verification code to your email (Error: ${errorMsg}).`);
          alert(`[System Fallback] Email service failed. Error: ${errorMsg}\n\nYour OTP code is: ${generatedOtp}`);
        });
    } else {
      setError('Invalid email or password');
    }
  };

  const handle2FA = (e) => {
    e.preventDefault();
    if (code === actualOtp) { 
      localStorage.setItem('woora_logged_in', 'true');
      const tempUser = localStorage.getItem('woora_user_temp');
      if (tempUser) {
        localStorage.setItem('woora_user', tempUser);
        localStorage.removeItem('woora_user_temp');
      }
      router.push('/');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Shield size={48} color="var(--color-primary)" style={{ margin: '0 auto' }} />
          <h2 style={{ marginTop: '16px', color: 'var(--color-text-white)' }}>Woora Secure Login</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>{step === 1 ? 'Enter your credentials' : 'Enter 6-digit 2FA Code'}</p>
        </div>

        {error && <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>Continue</button>
          </form>
        ) : (
          <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Verification Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} className="input-field" placeholder="000000" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>Verify & Login</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
