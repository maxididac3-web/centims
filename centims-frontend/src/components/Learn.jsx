'use client';

export default function Learn() {
  return (
    <section id="apren" style={{
      padding: '5rem 0',
      background: '#F5F5F0',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Titol seccio */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', margin: '0 auto 1rem' }} />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#0A0A0A',
            letterSpacing: '-0.02em',
          }}>
            Aprèn
          </h2>
        </div>

        {/* Grid de cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
        }}>

          {/* Card A: Apren a jugar */}
          <div style={{
            background: '#0A0A0A',
            borderRadius: '20px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decoracio */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '150px', height: '150px', borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.08)',
              pointerEvents: 'none',
            }} />

            <span style={{ fontSize: '2.5rem' }}>📈</span>

            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem', fontWeight: '700',
              color: '#FAFAF8', lineHeight: 1.2,
            }}>
              Apren a jugar
            </h3>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1rem', color: 'rgba(250, 250, 248, 0.7)',
              lineHeight: 1.7,
              flex: 1,
            }}>
              Descobreix que es un token, que vol dir volatilitat i com llegir un grafic sense inventar-ten el significat.
            </p>

            <a
              href="/apren"
              style={{
                background: 'transparent', color: '#C9A84C',
                padding: '0.8rem 1.75rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.9rem',
                border: '2px solid #C9A84C', borderRadius: '50px',
                cursor: 'pointer', transition: 'all 0.25s ease',
                textDecoration: 'none', display: 'inline-block',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A84C'; }}
            >
              Comenca la guia
            </a>
          </div>

          {/* Card B: Registrat */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '1px solid #E8E8E0',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decoracio */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '150px', height: '150px', borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.06)',
              pointerEvents: 'none',
            }} />

            <span style={{ fontSize: '2.5rem' }}>🪙</span>

            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem', fontWeight: '700',
              color: '#0A0A0A', lineHeight: 1.2,
            }}>
              Registrat i disfruta
            </h3>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1rem', color: '#6B6B60',
              lineHeight: 1.7,
              flex: 1,
            }}>
              Crea el teu compte, segueix els tokens i apren a ritme catala.
            </p>

            <a
              href="/register"
              style={{
                background: '#C9A84C', color: '#0A0A0A',
                padding: '0.8rem 1.75rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.9rem',
                border: '2px solid #C9A84C', borderRadius: '50px',
                cursor: 'pointer', transition: 'all 0.25s ease',
                textDecoration: 'none', display: 'inline-block',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
            >
              Crear compte
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
