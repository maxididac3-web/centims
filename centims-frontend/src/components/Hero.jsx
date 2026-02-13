'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const t = {
    h1a: 'La cultura digital',
    h1b: 'catalana,',
    h1c: 'token a token.',
    b1: 'Tokens digitals de km 0',
    b2: 'Plataforma ludica i educativa financera',
    b3: 'Noves criptos cada setmana',
    cta1: 'Comenca ara',
  };

  return (
    <>
      <style jsx>{`
        .hero-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: center;
        }
        
        .hero-left {
          order: 1;
        }
        
        .hero-right {
          order: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          min-height: 600px;
        }
        
        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 0;
            padding-top: 1rem !important;
          }
          
          .hero-left {
            order: 2;
            padding: 2rem 1.5rem;
            text-align: center;
          }
          
          .hero-right {
            order: 1;
            min-height: 400px;
            transform: rotate(-5deg);
            margin: 2rem 0;
          }
          
          .hero-h1 {
            font-size: 2rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .hero-bullets {
            align-items: center !important;
          }
          
          .hero-cta {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <section id="hero" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '70px',
        background: '#FAFAF8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="hero-container" style={{
          maxWidth: '1280px', margin: '0 auto', padding: '4rem 2rem',
          width: '100%',
        }}>

          {/* LEFT */}
          <div className="hero-left" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <div style={{ width: '50px', height: '3px', background: '#C9A84C', marginBottom: '1.5rem', margin: '0 auto 1.5rem auto' }} />

            <h1 className="hero-h1" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '900', color: '#0A0A0A',
              lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '2rem',
            }}>
              {t.h1a}<br />
              <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>{t.h1b}</span><br />
              {t.h1c}
            </h1>

            <div className="hero-bullets" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2.5rem' }}>
              {[t.b1, t.b2, t.b3].map((bullet, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#0A0A0A', lineHeight: 1.5 }}>
                    {bullet}
                  </span>
                </div>
              ))}
            </div>

            <a href="/register" className="hero-cta" style={{
              background: '#0A0A0A', color: '#FAFAF8',
              padding: '0.9rem 2.25rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.95rem',
              border: '2px solid #0A0A0A', borderRadius: '50px',
              cursor: 'pointer', transition: 'all 0.3s ease',
              textDecoration: 'none', display: 'inline-block',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
            >
              {t.cta1}
            </a>
          </div>

          {/* RIGHT: iPhone */}
          <div className="hero-right" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.2s',
          }}>
            <Image
              src="/iphone-chart.png"
              alt="Centims app"
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              priority
              sizes="(max-width: 768px) 90vw, 50vw"
            />
          </div>
        </div>
      </section>
    </>
  );
}
