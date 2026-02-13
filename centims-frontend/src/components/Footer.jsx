'use client';

export default function Footer() {
  const legalItems = [
    { icon: '🔒', text: 'Connexio segura (HTTPS) i proteccio basica de les dades transmeses.' },
    { icon: '🛡️', text: 'Control intern de la plataforma per evitar usos indeguts o comportaments anomals.' },
    { icon: '⚙️', text: 'Bones practiques de desenvolupament, amb enfoc en estabilitat, claredat de dades i experiencia d\'usuari.' },
    { icon: '📋', text: 'Transparencia informativa, sense promeses de rendibilitat ni missatges enganyosos.' },
  ];

  const footerLinks = [
    { label: 'Mercat', href: '#mercat' },
    { label: 'Apren', href: '#apren' },
    { label: 'Qui som', href: '#qui-som' },
    { label: 'Legal', href: '#legal' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* SECCIO LEGAL */}
      <section id="legal" style={{
        padding: '5rem 0',
        background: '#F5F5F0',
        borderTop: '1px solid #E8E8E0',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

          <div style={{ width: '50px', height: '3px', background: '#C9A84C', marginBottom: '1rem' }} />

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: '900', color: '#0A0A0A',
            letterSpacing: '-0.02em', marginBottom: '1rem',
          }}>
            Compliment i seguretat
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1rem', color: '#6B6B60',
            lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '680px',
          }}>
            A Centims prioritzem una experiencia segura, transparent i responsable per a tots els usuaris.
            La plataforma aplica bones practiques de seguretat i control per garantir un entorn fiable d&apos;us.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {legalItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1.25rem 1.5rem',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E8E8E0',
              }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9rem', color: '#4A4A40',
                  lineHeight: 1.6, margin: 0,
                }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Links legals */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['Politica de Privacitat', 'Cookies', 'Termes i condicions', 'Contacte'].map((link, i) => (
              <a key={i} href="#" style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem', color: '#9B9B90',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9B9B90'; }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0A0A0A',
        padding: '3rem 0 1.5rem',
        borderTop: '1px solid rgba(201, 168, 76, 0.15)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

          {/* Grid principal */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr',
            gap: '3rem',
            marginBottom: '2.5rem',
          }}>

            {/* Esquerra: Logo */}
            <div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.5rem', fontWeight: '900',
                color: '#FAFAF8', letterSpacing: '-0.02em',
                marginBottom: '0.5rem',
              }}>
                Centims
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem', color: 'rgba(250, 250, 248, 0.45)',
                lineHeight: 1.6,
              }}>
                Tokens catalans. Apren jugant.
              </p>
            </div>

            {/* Centre: Links */}
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem', fontWeight: '600',
                color: 'rgba(250, 250, 248, 0.35)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                Navegacio
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {footerLinks.map(link => (
                  <a key={link.label} href={link.href}
                    onClick={e => handleNavClick(e, link.href)}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.9rem', color: 'rgba(250, 250, 248, 0.6)',
                      textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250, 250, 248, 0.6)'; }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Dreta: Idioma + Socials */}
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem', fontWeight: '600',
                color: 'rgba(250, 250, 248, 0.35)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                Segueix-nos
              </p>

              {/* Socials */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <a href="#" style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(250, 250, 248, 0.08)',
                  border: '1px solid rgba(250, 250, 248, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', transition: 'all 0.2s',
                  fontSize: '0.9rem', color: 'rgba(250, 250, 248, 0.7)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250, 250, 248, 0.08)'; e.currentTarget.style.borderColor = 'rgba(250, 250, 248, 0.12)'; e.currentTarget.style.color = 'rgba(250, 250, 248, 0.7)'; }}
                  title="X (Twitter)"
                >
                  𝕏
                </a>
                <a href="#" style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(250, 250, 248, 0.08)',
                  border: '1px solid rgba(250, 250, 248, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', transition: 'all 0.2s',
                  fontSize: '1rem', color: 'rgba(250, 250, 248, 0.7)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250, 250, 248, 0.08)'; e.currentTarget.style.borderColor = 'rgba(250, 250, 248, 0.12)'; e.currentTarget.style.color = 'rgba(250, 250, 248, 0.7)'; }}
                  title="Instagram"
                >
                  IG
                </a>
              </div>

              {/* Selector idioma */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {['CA', 'ES'].map((l, i) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && <span style={{ color: 'rgba(250,250,248,0.2)', margin: '0 2px' }}>|</span>}
                    <button style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.25rem 0.4rem',
                      color: i === 0 ? '#C9A84C' : 'rgba(250,250,248,0.4)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                      fontWeight: i === 0 ? '600' : '400',
                    }}>
                      {l}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Linia divisoria */}
          <div style={{ borderTop: '1px solid rgba(250, 250, 248, 0.08)', paddingTop: '1.5rem' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.78rem', color: 'rgba(250, 250, 248, 0.25)',
              textAlign: 'center',
            }}>
              © 2025 Centims. Tots els drets reservats. Plataforma ludica i educativa. No constitueix assessorament financer.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
