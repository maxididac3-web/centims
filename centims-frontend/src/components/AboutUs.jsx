'use client';

export default function AboutUs() {
  const valors = [
    { icon: '🔍', text: 'Transparencia en dades' },
    { icon: '🎓', text: 'Finalitat educativa i ludica' },
    { icon: '🏴', text: 'Cultura digital catalana com a fil conductor' },
  ];

  return (
    <section id="qui-som" style={{
      padding: '6rem 0',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a18 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoracio */}
      <div style={{
        position: 'absolute', top: '-150px', right: '-150px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>

        <div style={{ maxWidth: '780px' }}>

          {/* Linia daurada */}
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', marginBottom: '1.5rem' }} />

          {/* Titol */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#FAFAF8',
            letterSpacing: '-0.02em', marginBottom: '2rem',
            lineHeight: 1.2,
          }}>
            Qui som i per que hem creat Centims
          </h2>

          {/* Text */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.1rem', color: 'rgba(250, 250, 248, 0.75)',
            lineHeight: 1.8, marginBottom: '3rem',
          }}>
            Centims neix per fer facil el primer pas al mon cripto... sense promeses ridicules. Aqui vens a aprendre: com es mou un mercat, que implica el risc, i com interpretar dades basiques. Ho fem amb tokens inspirats en cultura catalana i una experiencia pensada perque t&apos;hi sentis comode, no manipulat.
          </p>

          {/* Valors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {valors.map((valor, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.5rem',
                background: 'rgba(250, 250, 248, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(201, 168, 76, 0.15)',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{valor.icon}</span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1rem', fontWeight: '500',
                  color: 'rgba(250, 250, 248, 0.9)',
                }}>
                  {valor.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
