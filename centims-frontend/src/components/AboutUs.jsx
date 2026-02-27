'use client';

export default function AboutUs() {
  const pilars = [
    { icon: '🎮', titol: 'Un joc, no una inversió', text: 'Tot el saldo és virtual. Compres, valores i aprens sense arriscar ni un cèntim real.' },
    { icon: '📈', titol: 'Aprèn com funcionen els mercats', text: 'Experimenta de primera mà la bonding curve, la volatilitat i l\'efecte de l\'oferta i la demanda.' },
    { icon: '🏴', titol: 'Arrelat a la cultura catalana', text: 'Cada token representa un projecte, un lloc o una expressió de la cultura digital del país.' },
    { icon: '🏆', titol: 'Competeix i guanya premis reals', text: 'Els millors classificats cada mes opten a premis patrocinats per empreses i projectes catalans.' },
  ];

  return (
    <section id="qui-som" style={{
      padding: '3rem 0',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a18 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoració */}
      <div style={{
        position: 'absolute', top: '-150px', right: '-150px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>

        <div style={{ width: '50px', height: '3px', background: '#C9A84C', marginBottom: '1.5rem' }} />

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: '900', color: '#FAFAF8',
          letterSpacing: '-0.02em', marginBottom: '1.25rem',
          lineHeight: 1.2,
        }}>
          El simulador de mercat<br />
          <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>més català que existeix</span>
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.05rem', color: 'rgba(250, 250, 248, 0.7)',
          lineHeight: 1.8, marginBottom: '3rem', maxWidth: '640px',
        }}>
          Centims és una plataforma de simulació on pots comprar i vendre tokens inspirats en la cultura catalana, competir amb altres jugadors i aprendre com funcionen els mercats financers, tot sense arriscar ni un euro real.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {pilars.map((pilar, i) => (
            <div key={i} style={{
              padding: '1.5rem',
              background: 'rgba(250, 250, 248, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(201, 168, 76, 0.15)',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{pilar.icon}</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem', fontWeight: '600',
                color: '#FAFAF8', marginBottom: '0.4rem',
              }}>
                {pilar.titol}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem', color: 'rgba(250, 250, 248, 0.6)',
                lineHeight: 1.6,
              }}>
                {pilar.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
