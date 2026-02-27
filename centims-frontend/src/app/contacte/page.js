'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const inputStyle = {
  width: '100%', padding: '0.875rem 1rem',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
  color: '#0A0A0A', background: '#FAFAF8',
  border: '1.5px solid #E8E8E0', borderRadius: '10px',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
  color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
};

export default function ContactePage() {
  const [form, setForm] = useState({ nom: '', email: '', assumpte: '', missatge: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.missatge) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/emails/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en enviar el missatge');
      setSent(true);
    } catch (err) {
      setError(err.message || 'No s\'ha pogut enviar el missatge. Prova-ho de nou.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Capçalera */}
      <section style={{
        padding: '5rem 0 3rem',
        background: '#0A0A0A',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 2rem' }}>
          <Link href="/" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            color: 'rgba(250,250,248,0.45)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '2rem',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,250,248,0.45)'; }}
          >
            ← Tornar a l&apos;inici
          </Link>
          <div style={{ width: '40px', height: '3px', background: '#C9A84C', marginBottom: '1rem' }} />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#FAFAF8',
            letterSpacing: '-0.03em', marginBottom: '0.75rem',
          }}>
            Contacte
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1rem', color: 'rgba(250,250,248,0.55)',
            lineHeight: 1.6,
          }}>
            Tens algun dubte, suggeriment o vols col·laborar amb Centims? Escriu-nos.
          </p>
        </div>
      </section>

      {/* Contingut */}
      <section style={{ padding: '4rem 0', background: '#FAFAF8' }}>
        <div style={{
          maxWidth: '820px', margin: '0 auto', padding: '0 2rem',
          display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '4rem',
          alignItems: 'start',
        }}>

          {/* Columna esquerra: info */}
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.5rem', fontWeight: '800', color: '#0A0A0A',
              letterSpacing: '-0.02em', marginBottom: '1.5rem',
            }}>
              Com podem ajudar-te?
            </h2>

            {[
              { icon: '💬', title: 'Suport general', desc: 'Dubtes sobre el funcionament, tokens o el rànquing.' },
              { icon: '🤝', title: 'Col·laboració', desc: 'Vols ser patrocinador d\'un premi mensual o proposar una col·laboració.' },
              { icon: '🐛', title: 'Errors tècnics', desc: 'Has trobat un error o problema a la plataforma.' },
              { icon: '🔒', title: 'Privacitat', desc: 'Sol·licituds relacionades amb les teves dades personals.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                    fontWeight: '600', color: '#0A0A0A', marginBottom: '0.2rem',
                  }}>{item.title}</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                    color: '#6B6B60', lineHeight: 1.5,
                  }}>{item.desc}</div>
                </div>
              </div>
            ))}

            {/* Email directe */}
            <div style={{
              marginTop: '2rem', padding: '1.25rem 1.5rem',
              background: '#FFFFFF', border: '1.5px solid #E8E8E0',
              borderRadius: '12px',
            }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                color: '#9B9B90', fontWeight: '600', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: '0.5rem',
              }}>
                Correu electrònic
              </div>
              <a href="mailto:info@centims.cat" style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                color: '#C9A84C', textDecoration: 'none', fontWeight: '600',
              }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                info@centims.cat
              </a>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                color: '#9B9B90', marginTop: '0.4rem',
              }}>
                Resposta habitual en 1–2 dies laborables
              </div>
            </div>
          </div>

          {/* Columna dreta: formulari */}
          <div>
            {sent ? (
              <div style={{
                padding: '2rem', background: 'rgba(45,106,79,0.08)',
                border: '1.5px solid rgba(45,106,79,0.25)', borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                  fontWeight: '700', color: '#2D6A4F', marginBottom: '0.75rem',
                }}>
                  Missatge enviat!
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                  color: '#3A3A32', lineHeight: 1.6,
                }}>
                  Hem rebut el teu missatge i et respondrem a <strong>{form.email}</strong> en breu.
                  Gràcies per contactar amb Centims!
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ nom: '', email: '', assumpte: '', missatge: '' }); }}
                  style={{
                    marginTop: '1.25rem', padding: '0.6rem 1.5rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                    background: 'transparent', border: '1.5px solid #2D6A4F',
                    borderRadius: '8px', color: '#2D6A4F', cursor: 'pointer',
                  }}
                >
                  Enviar un altre missatge
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                background: '#FFFFFF', border: '1.5px solid #E8E8E0',
                borderRadius: '16px', padding: '2rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Nom *</label>
                    <input
                      type="text" name="nom" required
                      placeholder="El teu nom"
                      value={form.nom} onChange={handleChange}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      type="email" name="email" required
                      placeholder="correu@exemple.cat"
                      value={form.email} onChange={handleChange}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0'; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Assumpte</label>
                  <input
                    type="text" name="assumpte"
                    placeholder="De què es tracta?"
                    value={form.assumpte} onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0'; }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Missatge *</label>
                  <textarea
                    name="missatge" required rows={5}
                    placeholder="Explica'ns en què et podem ajudar..."
                    value={form.missatge} onChange={handleChange}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0'; }}
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '0.75rem 1rem', background: 'rgba(193,18,31,0.08)',
                    border: '1px solid rgba(193,18,31,0.2)', borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#C1121F',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '0.875rem 2rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                    fontWeight: '600', color: '#0A0A0A',
                    background: sending ? '#E8E8E0' : '#C9A84C', border: 'none',
                    borderRadius: '10px', cursor: sending ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#B8943C'; }}
                  onMouseLeave={e => { if (!sending) e.currentTarget.style.background = '#C9A84C'; }}
                >
                  {sending ? 'Enviant...' : 'Enviar missatge →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer bàsic */}
      <footer style={{
        background: '#0A0A0A', padding: '2rem',
        textAlign: 'center', borderTop: '1px solid rgba(201,168,76,0.1)',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
          color: 'rgba(250,250,248,0.25)',
        }}>
          © 2025 Centims · Simulador lúdic i educatiu · Saldo 100% virtual
        </p>
      </footer>
    </>
  );
}
