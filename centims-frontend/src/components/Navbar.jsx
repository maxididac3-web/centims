'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    if (pathname !== '/') {
      // Navegar a la home amb l'àncora — el navegador s'encarregarà del scroll
      router.push('/' + href);
      return;
    }
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Mercat', href: '#mercat' },
    { label: 'Classificació', href: '#ranking' },
    { label: 'Patrocinadors', href: '#patrocinadors' },
    { label: 'Apren', href: '/apren' },
    { label: 'Qui som', href: '#qui-som' },
    { label: 'Legal', href: '#legal' },
  ];

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

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href="/" style={{
              fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: '900',
              color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              Centims
            </Link>
            <span style={{ fontSize: '0.65rem', color: '#C9A84C', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em', marginTop: '2px' }}>
              Tokens catalans. Sense drames.
            </span>
          </div>

          {/* Nav Links Desktop */}
          <div className="desktop-nav" style={{ gap: '2.5rem', alignItems: 'center' }}>
            {navLinks.map(link => (
              link.href.startsWith('/') ? (
                <Link key={link.label} href={link.href}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '400', color: '#0A0A0A', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#0A0A0A'; }}
                >
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href}
                  onClick={e => handleNavClick(e, link.href)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '400', color: '#0A0A0A', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#0A0A0A'; }}
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Right Desktop */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>
                  {user.username || user.name}
                </span>
                <Link href="/dashboard" style={{
                  background: '#C9A84C', color: '#0A0A0A', padding: '0.55rem 1.35rem',
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
                  background: 'transparent', color: '#9B9B90', padding: '0.5rem 1rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '400', fontSize: '0.85rem',
                  border: '1px solid #E8E8E0', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.25s ease',
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
                  Inicia sessió
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
                  Registra&apos;t
                </a>
              </>
            )}
          </div>

          {/* Hamburger Mobile */}
          <button
            className="mobile-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '24px' }}>
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '100%', height: '2px', background: '#0A0A0A', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
            </div>
          </button>
        </div>

        {/* Menu Mobile */}
        {menuOpen && (
          <div style={{
            background: 'rgba(250, 250, 248, 0.98)',
            borderTop: '1px solid rgba(201, 168, 76, 0.2)',
            padding: '1.5rem 2rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            {navLinks.map(link => (
              link.href.startsWith('/') ? (
                <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem',
                    color: '#0A0A0A', textDecoration: 'none', padding: '0.5rem 0',
                    borderBottom: '1px solid #F0F0E8', display: 'block',
                  }}
                >
                  {link.label}
                </Link>
              ) : (
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
              )
            ))}

            {user ? (
              <>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#6B6B60', padding: '0.5rem 0' }}>
                  Hola, {user.username || user.name}
                </div>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                  background: '#C9A84C', color: '#0A0A0A', padding: '0.75rem', textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '1rem',
                  border: '2px solid #C9A84C', borderRadius: '50px', textDecoration: 'none', display: 'block',
                }}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                  background: 'transparent', color: '#C1121F', padding: '0.75rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.95rem',
                  border: '2px solid #C1121F', borderRadius: '50px', cursor: 'pointer',
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
                  Inicia sessió
                </a>
                <a href="/register" onClick={() => setMenuOpen(false)} style={{
                  textAlign: 'center', padding: '0.75rem',
                  background: '#0A0A0A', border: '2px solid #0A0A0A', borderRadius: '50px',
                  color: '#FAFAF8', textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                }}>
                  Registra&apos;t
                </a>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
