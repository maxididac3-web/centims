'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({ email: '', name: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.username && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      setError('El nom d\'usuari només pot contenir lletres, números i guions baixos (3-20 caràcters)');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Les contrasenyes no coincideixen');
      return;
    }

    if (form.password.length < 6) {
      setError('La contrasenya ha de tenir minim 6 caracters');
      return;
    }

    setLoading(true);

    try {
      await register(form.email, form.name, form.password, form.username || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Error en crear el compte');
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
          Crea el teu compte
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem', color: '#6B6B60',
          marginBottom: '2rem',
        }}>
          Uneix-te a la comunitat de tokens catalans
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

          {/* Nom */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', fontWeight: '500',
              color: '#0A0A0A', marginBottom: '0.5rem',
            }}>
              Nom complet
            </label>
            <input
              type="text"
              placeholder="Joan Garcia"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
          </div>

          {/* Nom d'usuari */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', fontWeight: '500',
              color: '#0A0A0A', marginBottom: '0.5rem',
            }}>
              Nom d&apos;usuari
            </label>
            <input
              type="text"
              placeholder="joan_garcia"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              maxLength={20}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', color: '#9B9B90',
              marginTop: '0.35rem',
            }}>
              Lletres, números i guió baix. Mínim 3 caràcters. Es pot canviar més endavant.
            </p>
          </div>

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
              placeholder="Minim 6 caracters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
          </div>

          {/* Confirmar password */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', fontWeight: '500',
              color: '#0A0A0A', marginBottom: '0.5rem',
            }}>
              Confirma la contrasenya
            </label>
            <input
              type="password"
              placeholder="Repeteix la contrasenya"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
            />
          </div>

          {/* Avis legal */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.78rem', color: '#9B9B90',
            lineHeight: 1.5,
          }}>
            En registrar-te acceptes els nostres{' '}
            <Link href="/legal" style={{ color: '#C9A84C', textDecoration: 'none' }}>Termes i condicions</Link>
            {' '}i la{' '}
            <Link href="/legal" style={{ color: '#C9A84C', textDecoration: 'none' }}>Politica de privacitat</Link>.
            Centims es una plataforma ludica i educativa. No constitueix assessorament financer.
          </p>

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
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; } }}
          >
            {loading ? 'Creant compte...' : 'Crear compte'}
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

        {/* Link login */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem', color: '#6B6B60',
        }}>
          Ja tens compte?{' '}
          <Link href="/login" style={{ color: '#C9A84C', fontWeight: '500', textDecoration: 'none' }}>
            Inicia sessio
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
