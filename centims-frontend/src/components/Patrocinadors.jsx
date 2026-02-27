'use client';
// PATROCINADORS — dades estàtiques. Edita PATROCINADORS per afegir/modificar sponsors.
// Camp `imatge`: ruta a /public (ex: '/patrocinadors/calpere.jpg') o null per placeholder.

const PATROCINADORS = [
  {
    imatge: null,
    nom: 'Formatgeria Cal Pere',
    descripcio: "Formatgeria artesanal del Berguedà amb més de 40 anys elaborant formatges d'ovella i cabra amb llet de ramat propi.",
    web: 'https://formatgeriacalpere.cat',
  },
  {
    imatge: null,
    nom: 'BCN Tours',
    descripcio: 'Experiències culturals i turístiques a Barcelona, amb guies locals especialitzats en arquitectura modernista i cultura catalana.',
    web: 'https://bcntours.cat',
  },
  {
    imatge: null,
    nom: 'Lleures Actius',
    descripcio: 'Empresa de lleure i activitats en natura al Pirineu català. Senderisme, BTT i experiències per a totes les edats.',
    web: null,
  },
];

export default function Patrocinadors() {
  if (PATROCINADORS.length === 0) return null;

  return (
    <section id="patrocinadors" style={{ padding: '3rem 0', background: '#F5F5F0' }}>
      <style>{`
        /* Desktop: grid 3 columnes */
        .pat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        /* Mòbil: carrusel horitzontal amb snap */
        @media (max-width: 768px) {
          .pat-grid {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            /* Negatiu per escapar el padding del contenidor i anar de vora a vora */
            margin-left: -1.5rem;
            margin-right: -1.5rem;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            padding-bottom: 1rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .pat-grid::-webkit-scrollbar {
            display: none;
          }
          .pat-card {
            /* Mostra 1 targeta sencera + un tros de la següent */
            min-width: calc(85vw - 1.5rem) !important;
            max-width: calc(85vw - 1.5rem) !important;
            flex-shrink: 0 !important;
            scroll-snap-align: start;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Títol */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', margin: '0 auto 1rem' }} />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: '900', color: '#0A0A0A', letterSpacing: '-0.02em',
          }}>
            Patrocinadors
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#6B6B60', marginTop: '0.5rem' }}>
            Empreses i projectes que fan possible els premis mensuals de Centims
          </p>
        </div>

        {/* Grid / Carrusel */}
        <div className="pat-grid">
          {PATROCINADORS.map((p, i) => (
            <div key={i} className="pat-card" style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E8E8E0', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Imatge / Placeholder */}
              <div style={{
                width: '100%', aspectRatio: '16/9', overflow: 'hidden',
                background: p.imatge ? 'transparent' : 'linear-gradient(135deg, #F0EFE8 0%, #E4E3DA 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {p.imatge ? (
                  <img src={p.imatge} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{
                    fontFamily: "'Playfair Display', serif", fontSize: '3rem',
                    fontWeight: '900', color: '#C9A84C', opacity: 0.4,
                    letterSpacing: '-0.02em', userSelect: 'none',
                  }}>
                    {p.nom.charAt(0)}
                  </span>
                )}
              </div>

              {/* Contingut */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.15rem',
                  fontWeight: '700', color: '#0A0A0A', margin: 0, lineHeight: 1.3,
                }}>
                  {p.nom}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
                  color: '#6B6B60', lineHeight: 1.65, margin: 0, flex: 1,
                }}>
                  {p.descripcio}
                </p>
                {p.web && (
                  <a href={p.web} target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                    color: '#C9A84C', textDecoration: 'none', fontWeight: '500',
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    marginTop: '0.5rem',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    Visita el patrocinador →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
