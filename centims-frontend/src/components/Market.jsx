'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { productsAPI } from '@/lib/api';

const Sparkline = ({ history, up }) => {
  if (!history || history.length < 2) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.001;
  const w = 80;
  const h = 36;
  const points = prices.map((v, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const color = up ? '#2D6A4F' : '#C1121F';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Dades mock per si el backend no esta connectat
const MOCK_TOKENS = [
  { id: 1, name: 'Renfe Executive Delay', emoji: '🚄', ticker: 'RED', currentPrice: 0.142, changePercent24h: 4.2, priceHistory: [] },
  { id: 2, name: 'Calcot 4K', emoji: '🧅', ticker: 'C4K', currentPrice: 0.087, changePercent24h: -1.8, priceHistory: [] },
  { id: 3, name: "Omilies d'Organya", emoji: '⛪', ticker: 'OMI', currentPrice: 0.203, changePercent24h: 2.9, priceHistory: [] },
  { id: 4, name: 'Yamin Lamal', emoji: '⚽', ticker: 'YAM', currentPrice: 0.312, changePercent24h: 8.4, priceHistory: [] },
  { id: 5, name: 'Moreneta Sable', emoji: '🗿', ticker: 'MOR', currentPrice: 0.178, changePercent24h: -0.5, priceHistory: [] },
  { id: 6, name: 'Seny & Rauxa', emoji: '🧠', ticker: 'SNR', currentPrice: 0.251, changePercent24h: 1.2, priceHistory: [] },
  { id: 7, name: 'Caganer', emoji: '💩', ticker: 'CGN', currentPrice: 0.064, changePercent24h: -3.2, priceHistory: [] },
  { id: 8, name: 'Sardana Loop', emoji: '💃', ticker: 'SDL', currentPrice: 0.198, changePercent24h: 0.9, priceHistory: [] },
  { id: 9, name: 'Peatges 3.0', emoji: '💶', ticker: 'PEA', currentPrice: 0.305, changePercent24h: 3.1, priceHistory: [] },
  { id: 10, name: 'Queta', emoji: '🏔️', ticker: 'QTA', currentPrice: 0.502, changePercent24h: 5.6, priceHistory: [] },
];

export default function Market() {
  const router = useRouter();
  const { user } = useAuth();
  const [tokens, setTokens] = useState(MOCK_TOKENS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const data = await productsAPI.getAll();
        if (data.products && data.products.length > 0) {
          setTokens(data.products);
        }
      } catch (error) {
        // Si el backend no esta disponible, usem mock data
        console.log('Usant dades mock');
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  return (
    <>
      <style jsx>{`
        .market-grid-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 100px 1fr;
        }
        
        .market-grid-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 100px 1fr;
        }
        
        .market-sparkline {
          display: flex;
        }
        
        .market-btn-detalls {
          display: inline-block;
        }
        
        @media (max-width: 768px) {
          .market-grid-header {
            grid-template-columns: 2fr 1fr 1fr 1fr;
          }
          
          .market-grid-row {
            grid-template-columns: 2fr 1fr 1fr 1fr;
          }
          
          .market-sparkline {
            display: none !important;
          }
          
          .market-btn-detalls {
            display: none !important;
          }
        }
      `}</style>

    <section id="mercat" style={{
      padding: '5rem 0',
      background: '#FAFAF8',
      borderTop: '1px solid #F0F0E8',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Titol */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', marginBottom: '1rem' }} />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#0A0A0A',
            letterSpacing: '-0.02em', marginBottom: '1rem',
          }}>
            El Mercat
          </h2>

          {/* Avis legal */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem', color: '#9B9B90',
            lineHeight: 1.6, maxWidth: '800px',
            padding: '0.75rem 1rem',
            borderLeft: '3px solid #C9A84C',
            background: 'rgba(201, 168, 76, 0.05)',
          }}>
            La inversio en tokens digitals comporta un risc elevat i no es adequada per a tots els perfils. Centims no garanteix rendiments ni assumeix responsabilitat per possibles perdues. Utilitza la plataforma amb finalitats ludiques i formatives.
          </p>
        </div>

        {/* Taula */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>

          {/* Header */}
          <div className="market-grid-header" style={{
            padding: '0.875rem 1.5rem',
            background: '#F8F8F4',
            borderBottom: '1px solid #E8E8E0',
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: '600',
              color: '#9B9B90', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'left',
            }}>Token</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: '600',
              color: '#9B9B90', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'left',
            }}>Preu</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: '600',
              color: '#9B9B90', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>Variació 24h</span>
            <span className="market-sparkline" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: '600',
              color: '#9B9B90', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>Gràf. setmanal</span>
            <span className="market-btn-detalls" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: '600',
              color: '#9B9B90', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>&nbsp;</span>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>
              Carregant tokens...
            </div>
          )}

          {/* Files */}
          {!loading && tokens.map((token, i) => {
            const up = token.changePercent24h >= 0;
            return (
              <div
                key={token.id || i}
                className="market-grid-row" style={{
                  padding: '1rem 1.0rem',
                  borderBottom: i < tokens.length - 1 ? '1px solid #F5F5F0' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Nom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{token.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
                      {token.name}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', letterSpacing: '0.05em' }}>
                      {token.ticker || token.name.substring(0, 3).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Preu */}
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: '600', color: '#0A0A0A' }}>
                  {typeof token.currentPrice === 'number' ? token.currentPrice.toFixed(3) : token.currentPrice}€
                </div>

                {/* Variacio */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.85rem', fontWeight: '600',
                    color: up ? '#2D6A4F' : '#C1121F',
                    background: up ? 'rgba(45, 106, 79, 0.08)' : 'rgba(193, 18, 31, 0.08)',
                    padding: '0.2rem 0.6rem', borderRadius: '20px',
                  }}>
                    {up ? '+' : ''}{typeof token.changePercent24h === 'number' ? token.changePercent24h.toFixed(1) : token.changePercent24h}%
                  </span>
                </div>

                {/* Sparkline */}
                <div className="market-sparkline" style={{ justifyContent: 'center' }}>
                  <Sparkline history={token.priceHistory} up={up} />
                </div>

                {/* Accions */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button className="market-btn-detalls" onClick={() => router.push(`/token/${token.id}`)} style={{
                    background: 'transparent', color: '#0A0A0A',
                    padding: '0.4rem 0.875rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '500',
                    border: '1.5px solid #0A0A0A', borderRadius: '50px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0A0A0A'; }}
                  >
                    Detalls
                  </button>
                  <button onClick={() => user ? router.push(`/token/${token.id}`) : router.push('/register')} style={{
                    background: '#0A0A0A', color: '#FAFAF8',
                    padding: '0.4rem 0.875rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '500',
                    border: '1.5px solid #0A0A0A', borderRadius: '50px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; }}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
