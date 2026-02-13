'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState('CA');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const navLinks = {
    CA: [
      { label: 'Mercat', href: '#mercat' },
      { label: 'Apren', href: '#apren' },
      { label: 'Qui som', href: '#qui-som' },
      { label: 'Legal', href: '#legal' },
    ],
    ES: [
      { label: 'Mercado', href: '#mercat' },
      { label: 'Aprende', href: '#apren' },
      { label: 'Quienes somos', href: '#qui-som' },
      { label: 'Legal', href: '#legal' },
    ]
  };

  const texts = {
    CA: { login: 'Inicia sessio', register: "Registra't", tagline: 'Tokens catalans. Sense drames.' },
    ES: { login: 'Iniciar sesion', register: 'Registrate', tagline: 'Tokens catalanes. Sin dramas.' }
  };

  const t = texts[lang];
  const links = navLinks[lang];

  return (
    <>
      <style jsx>{`
        .desktop-nav { display: flex; }
        .mobile-hamburger { display: none; }
        
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: flex; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(250, 250, 248, 0.95)' : 'rgba(250, 250, 248, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(201, 168, 76, 0.3)' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px',
        }}>

          {/* Logo (sempre visible) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href="/" style={{
              fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: '900',
              color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              Centims
            </Link>
            <span style={{ fontSize: '0.65rem', color: '#C9A84C', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em', marginTop: '2px' }}>
              {t.tagline}
            </span>
          </div>

          {/* Nav Links Desktop */}
          <div className="desktop-nav" style={{ gap: '2.5rem', alignItems: 'center' }}>
            {links.map(link => (
              <a key={link.label} href={link.href}
                onClick={e => handleNavClick(e, link.href)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '400', color: '#0A0A0A', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#0A0A0A'; }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Desktop */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: '0.75rem' }}>
            {/* Idioma */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {['CA', 'ES'].map((l, i) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <span style={{ color: '#D0D0C8', margin: '0 2px' }}>|</span>}
                  <button onClick={() => setLang(l)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.4rem',
                    color: lang === l ? '#C9A84C' : '#6B6B60',
                    fontWeight: lang === l ? '600' : '400',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                  }}>{l}</button>
                </span>
              ))}
            </div>

            {user ? (
              <>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', color: '#6B6B60',
                }}>
                  {user.name}
                </span>

                <Link href="/dashboard" style={{
                  background: '#C9A84C', color: '#0A0A0A',
                  padding: '0.55rem 1.35rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.85rem',
                  border: '2px solid #C9A84C', borderRadius: '50px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  textDecoration: 'none', display: 'inline-block',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                >
                  Dashboard
                </Link>

                <button onClick={logout} style={{
                  background: 'transparent', color: '#9B9B90',
                  padding: '0.5rem 1rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '400', fontSize: '0.85rem',
                  border: '1px solid #E8E8E0', borderRadius: '50px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E0'; e.currentTarget.style.color = '#9B9B90'; }}
                >
                  Sortir
                </button>
              </>
            ) : (
              <>
                <a href="/login" style={{
                  background: 'transparent', color: '#C9A84C', padding: '0.5rem 1.25rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.85rem',
                  border: '2px solid #C9A84C', borderRadius: '50px', cursor: 'pointer',
                  transition: 'all 0.25s ease', textDecoration: 'none', display: 'inline-block',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#FAFAF8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A84C'; }}
                >
                  {t.login}
                </a>

                <a href="/register" style={{
                  background: '#0A0A0A', color: '#FAFAF8', padding: '0.55rem 1.35rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.85rem',
                  border: '2px solid #0A0A0A', borderRadius: '50px', cursor: 'pointer',
                  transition: 'all 0.25s ease', textDecoration: 'none', display: 'inline-block',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; }}
                >
                  {t.register}
                </a>
              </>
            )}
          </div>

          {/* Hamburger Mobile */}
          <button 
            className="mobile-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.5rem', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '24px' }}>
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
            </div>
          </button>
        </div>

        {/* Menu Mobile Desplegable */}
        {menuOpen && (
          <div style={{
            background: 'rgba(250, 250, 248, 0.98)',
            borderTop: '1px solid rgba(201, 168, 76, 0.2)',
            padding: '1.5rem 2rem', 
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            {/* Links navegació */}
            {links.map(link => (
              <a key={link.label} href={link.href}
                onClick={e => handleNavClick(e, link.href)}
                style={{ 
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem', 
                  color: '#0A0A0A', textDecoration: 'none', padding: '0.5rem 0',
                  borderBottom: '1px solid #F0F0E8',
                }}
              >
                {link.label}
              </a>
            ))}

            {/* Idioma mobile */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
              {['CA', 'ES'].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? '#C9A84C' : 'transparent',
                  color: lang === l ? '#FAFAF8' : '#6B6B60',
                  border: '2px solid #C9A84C',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
                }}>
                  {l}
                </button>
              ))}
            </div>

            {/* User menu mobile */}
            {user ? (
              <>
                <div style={{ 
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', 
                  color: '#6B6B60', padding: '0.5rem 0',
                }}>
                  Hola, {user.name}
                </div>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                  background: '#C9A84C', color: '#0A0A0A',
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '1rem',
                  border: '2px solid #C9A84C', borderRadius: '50px',
                  textDecoration: 'none', display: 'block',
                }}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                  background: 'transparent', color: '#C1121F',
                  padding: '0.75rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.95rem',
                  border: '2px solid #C1121F', borderRadius: '50px',
                  cursor: 'pointer',
                }}>
                  Sortir
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <a href="/login" onClick={() => setMenuOpen(false)} style={{
                  textAlign: 'center', padding: '0.75rem',
                  border: '2px solid #C9A84C', borderRadius: '50px',
                  color: '#C9A84C', textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '500',
                }}>
                  {t.login}
                </a>
                <a href="/register" onClick={() => setMenuOpen(false)} style={{
                  textAlign: 'center', padding: '0.75rem',
                  background: '#0A0A0A', border: '2px solid #0A0A0A', borderRadius: '50px',
                  color: '#FAFAF8', textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                }}>
                  {t.register}
                </a>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
