// admin/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { API_ENDPOINTS } from '@/config/api';
import { TENANT_ID } from '@/config/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Dev mode bypass - allows login without backend
    const isDev = process.env.NODE_ENV === 'development';
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID,  

        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token in localStorage or context
        localStorage.setItem('token', data.token);
        // Redirect based on user role or to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      // In dev mode, allow bypass if backend is not running
      if (isDev) {
        console.warn('Backend not available - using dev mode bypass');
        localStorage.setItem('token', 'dev-token-' + Date.now());
        router.push('/dashboard');
        return;
      }
      setError('Unable to connect to server. Please ensure the backend is running.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>DA</div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>DeliveryAdmin</span>
            <span className={styles.logoSubtitle}>Operations dashboard</span>
          </div>
        </div>

        <h1 className={styles.heading}>Sign in to your account</h1>
        <p className={styles.subheading}>Use your admin credentials to access restaurant analytics and operations.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Work email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Signing you in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footerText}>
          Backend API under <strong>/backend</strong>. Make sure it is running for login to work.
        </p>
      </div>
    </div>
  );
}