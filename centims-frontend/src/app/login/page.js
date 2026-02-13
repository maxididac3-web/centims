'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      const userData = JSON.parse(localStorage.getItem('centims_user'));
      router.push(userData?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Error en iniciar sessio');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem',
    color: '#0A0A0A',
    background: '#FAFAF8',
    border: '1.5px solid #E8E8E0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decoracio fons */}
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '2.5rem',
        border: '1px solid #E8E8E0',
        boxShadow: '0 20px 60px rgba(0,0,0,0.07)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem', fontWeight: '900',
            color: '#0A0A0A', textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}>
            Centims
          </Link>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem', color: '#C9A84C',
            marginTop: '0.25rem',
          }}>
            Tokens catalans. Sense drames.
          </p>
        </div>

        {/* Titol */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.75rem', fontWeight: '700',
          color: '#0A0A0A', marginBottom: '0.5rem',
          letterSpacing: '-0.01em',
        }}>
          Benvingut de nou
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem', color: '#6B6B60',
          marginBottom: '2rem',
        }}>
          Inicia sessio per accedir a la teva cartera
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(193, 18, 31, 0.06)',
            border: '1px solid rgba(193, 18, 31, 0.2)',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
            color: '#C1121F',
          }}>
            {error}
          </div>
        )}

        {/* Formulari */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', fontWeight: '500',
              color: '#0A0A0A', marginBottom: '0.5rem',
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="tu@exemple.cat"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', fontWeight: '500',
              color: '#0A0A0A', marginBottom: '0.5rem',
            }}>
              Contrasenya
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9B9B90' : '#0A0A0A',
              color: '#FAFAF8',
              padding: '0.9rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '500', fontSize: '0.95rem',
              border: '2px solid transparent',
              borderRadius: '50px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              width: '100%',
              marginTop: '0.5rem',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; } }}
          >
            {loading ? 'Iniciant sessio...' : 'Inicia sessio'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          margin: '1.75rem 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E8E8E0' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#9B9B90' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: '#E8E8E0' }} />
        </div>

        {/* Link registre */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem', color: '#6B6B60',
        }}>
          No tens compte?{' '}
          <Link href="/register" style={{
            color: '#C9A84C', fontWeight: '500',
            textDecoration: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            Registra&apos;t ara
          </Link>
        </p>

        {/* Tornar */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem', color: '#9B9B90',
            textDecoration: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9B9B90'; }}
          >
            ← Tornar a l&apos;inici
          </Link>
        </div>
      </div>
    </div>
  );
}
