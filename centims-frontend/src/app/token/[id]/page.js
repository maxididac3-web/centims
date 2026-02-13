'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/AuthContext';
import { productsAPI, transactionsAPI } from '@/lib/api';

export default function TokenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const tokenId = params.id;

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('7d'); // 1d, 7d, 30d, 1y
  const [buyAmount, setBuyAmount] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState('');
  const [relatedTokens, setRelatedTokens] = useState([]);

  useEffect(() => {
    if (tokenId) fetchToken();
  }, [tokenId]);

  const fetchToken = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      const found = data.products.find(p => p.id === parseInt(tokenId));
      if (found) {
        setToken(found);
        // Tokens relacionats (3 aleatoris diferents del actual)
        const others = data.products.filter(p => p.id !== parseInt(tokenId) && p.isActive);
        const shuffled = others.sort(() => 0.5 - Math.random());
        setRelatedTokens(shuffled.slice(0, 3));
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Error carregant token:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      router.push('/register');
      return;
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      setBuyError('Introdueix un import vàlid');
      return;
    }
    setBuyLoading(true);
    setBuyError('');
    setBuySuccess('');
    try {
      await transactionsAPI.buy(token.id, parseFloat(buyAmount));
      setBuySuccess('Compra realitzada correctament!');
      setBuyAmount('');
      setTimeout(() => { setBuySuccess(''); fetchToken(); }, 2000);
    } catch (err) {
      setBuyError(err.message || 'Error en la compra');
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '70px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6B60' }}>Carregant...</div>
        </div>
      </>
    );
  }

  if (!token) return null;

  const up = parseFloat(token.changePercent24h) >= 0;
  const change7d = parseFloat(token.changePercent7d || 0);
  const up7d = change7d >= 0;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: '70px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button onClick={() => router.back()} style={{
              background: 'transparent', color: '#6B6B60',
              border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              ← Tornar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '3rem' }}>{token.emoji}</span>
              <div>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.5rem',
                  fontWeight: '900', color: '#0A0A0A', margin: 0, letterSpacing: '-0.02em',
                }}>
                  {token.name}
                </h1>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#9B9B90', margin: '0.25rem 0 0 0' }}>
                  {token.ticker}
                </p>
              </div>
            </div>

            </div>

          {/* Main content: Gràfica + Box compra */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

            {/* Gràfica */}
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '2rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                  fontWeight: '700', color: '#0A0A0A', margin: 0,
                }}>
                  Evolució del preu
                </h3>

                {/* Selector període */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: '1d', label: 'Dia' },
                    { id: '7d', label: 'Setmana' },
                    { id: '30d', label: 'Mes' },
                    { id: '1y', label: 'Any' },
                  ].map(period => (
                    <button key={period.id} onClick={() => setChartPeriod(period.id)} style={{
                      background: chartPeriod === period.id ? '#0A0A0A' : 'transparent',
                      color: chartPeriod === period.id ? '#FAFAF8' : '#6B6B60',
                      padding: '0.4rem 0.875rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '500',
                      border: '1.5px solid', borderColor: chartPeriod === period.id ? '#0A0A0A' : '#E8E8E0',
                      borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart placeholder */}
              <div style={{
                height: '400px', background: '#FAFAF8', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px dashed #E8E8E0',
              }}>
                {token.priceHistory && token.priceHistory.length > 1 ? (
                  <ChartComponent data={token.priceHistory} period={chartPeriod} up={up} />
                ) : (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#9B9B90' }}>
                    No hi ha prou dades històriques
                  </div>
                )}
              </div>
            </div>

            {/* Box compra */}
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '2px solid #C9A84C', padding: '2rem',
              height: 'fit-content',
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                fontWeight: '700', color: '#0A0A0A', margin: '0 0 1.5rem 0',
              }}>
                {user ? 'Comprar' : 'Registra\'t per comprar'}
              </h3>

              {!user ? (
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Crea un compte per començar a comprar tokens i gestionar la teva cartera.
                  </p>
                  <button onClick={() => router.push('/register')} style={{
                    width: '100%', background: '#C9A84C', color: '#0A0A0A',
                    padding: '0.875rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                    border: 'none', borderRadius: '50px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                  >
                    Registra't ara
                  </button>
                  <button onClick={() => router.push('/login')} style={{
                    width: '100%', background: 'transparent', color: '#0A0A0A',
                    padding: '0.875rem', marginTop: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
                    border: '1.5px solid #0A0A0A', borderRadius: '50px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0A0A0A'; }}
                  >
                    Ja tinc compte
                  </button>
                </div>
              ) : (
                <div>
                  {buyError && (
                    <div style={{
                      background: 'rgba(193,18,31,0.06)', border: '1px solid rgba(193,18,31,0.2)',
                      borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#C1121F',
                    }}>
                      {buyError}
                    </div>
                  )}
                  {buySuccess && (
                    <div style={{
                      background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.2)',
                      borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#2D6A4F',
                    }}>
                      {buySuccess}
                    </div>
                  )}

                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.85rem', fontWeight: '500', color: '#0A0A0A', marginBottom: '0.5rem',
                  }}>
                    Import en EUR
                  </label>
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="10.00"
                      value={buyAmount}
                      onChange={e => setBuyAmount(e.target.value)}
                      style={{
                        width: '100%', padding: '0.875rem 3rem 0.875rem 1rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                        color: '#0A0A0A', background: '#FAFAF8',
                        border: '1.5px solid #E8E8E0', borderRadius: '10px',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
                      onBlur={e => { e.target.style.borderColor = '#E8E8E0'; }}
                    />
                    <span style={{
                      position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#9B9B90',
                    }}>€</span>
                  </div>

                  {/* Botons ràpids */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[5, 10, 25, 50].map(amount => (
                      <button key={amount} onClick={() => setBuyAmount(amount.toString())} style={{
                        flex: 1,
                        background: buyAmount === amount.toString() ? '#0A0A0A' : '#F5F5F0',
                        color: buyAmount === amount.toString() ? '#FAFAF8' : '#6B6B60',
                        padding: '0.5rem 0',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '500',
                        border: '1.5px solid', borderColor: buyAmount === amount.toString() ? '#0A0A0A' : '#E8E8E0',
                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {amount}€
                      </button>
                    ))}
                  </div>

                  <button onClick={handleBuy} disabled={buyLoading} style={{
                    width: '100%',
                    background: buyLoading ? '#9B9B90' : '#C9A84C',
                    color: '#0A0A0A',
                    padding: '0.875rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                    border: 'none', borderRadius: '50px',
                    cursor: buyLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    {buyLoading ? 'Processant...' : 'Confirmar compra'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '2rem' }}>
            {[
              { label: 'Preu actual', value: `${parseFloat(token.currentPrice).toFixed(2)}€` },
              { label: 'Canvi 24h', value: `${up ? '+' : ''}${parseFloat(token.changePercent24h).toFixed(1)}%`, color: up ? '#2D6A4F' : '#C1121F' },
              { label: 'Canvi 7 dies', value: `${up7d ? '+' : ''}${change7d.toFixed(1)}%`, color: up7d ? '#2D6A4F' : '#C1121F' },
              { label: 'Supply actual', value: parseFloat(token.supply || 0).toFixed(0) },
              { label: 'Data creació', value: new Date(token.createdAt || Date.now()).toLocaleDateString('ca-ES') },
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#FFFFFF', borderRadius: '12px', padding: '1rem 1.25rem',
                border: '1px solid #E8E8E0',
              }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem',
                  color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                  fontWeight: '700', color: stat.color || '#0A0A0A',
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Descripció */}
          {token.description && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '2rem',
              marginTop: '2rem',
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                fontWeight: '700', color: '#0A0A0A', margin: '0 0 1rem 0',
              }}>
                Sobre {token.name}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                color: '#6B6B60', lineHeight: 1.7, margin: 0,
              }}>
                {token.description}
              </p>
            </div>
          )}


        </div>

        {/* Altres tokens */}
        <div style={{ marginTop: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.8rem',
            fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem',
          }}>
            Altres tokens que et poden interessar
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {relatedTokens.map((t, i) => {
              const tUp = parseFloat(t.changePercent24h) >= 0;
              return (
                <div key={i} style={{
                  background: '#FFFFFF', borderRadius: '12px',
                  border: '1px solid #E8E8E0', padding: '1.5rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem', fontWeight: '600', color: '#0A0A0A' }}>
                        {t.name}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#9B9B90' }}>
                        {t.ticker}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', marginBottom: '0.25rem' }}>
                      Preu actual
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: '700', color: '#0A0A0A' }}>
                      {parseFloat(t.currentPrice).toFixed(2)}€
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '600',
                      color: tUp ? '#2D6A4F' : '#C1121F',
                    }}>
                      {tUp ? '+' : ''}{parseFloat(t.changePercent24h).toFixed(1)}% 24h
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => router.push(`/token/${t.id}`)} style={{
                      flex: 1,
                      background: 'transparent', color: '#0A0A0A',
                      padding: '0.6rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '500',
                      border: '1.5px solid #0A0A0A', borderRadius: '50px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0A0A0A'; }}
                    >
                      Detalls
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/token/${t.id}`); }} style={{
                      flex: 1,
                      background: '#C9A84C', color: '#0A0A0A',
                      padding: '0.6rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600',
                      border: '1.5px solid #C9A84C', borderRadius: '50px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// Component gràfica (SVG simple)
function ChartComponent({ data, period, up }) {
  if (!data || data.length < 2) return null;

  // Filtrar segons període (simplificat - idealment caldria endpoint backend)
  const prices = data.slice(-30).map(h => h.price); // Últims 30 punts
  const timestamps = data.slice(-30).map(h => h.timestamp);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.001;

  const w = 800;
  const h = 400;
  const padding = 40;

  const points = prices.map((v, i) => {
    const x = padding + (i / (prices.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const color = up ? '#2D6A4F' : '#C1121F';
  const fillColor = up ? 'rgba(45,106,79,0.1)' : 'rgba(193,18,31,0.1)';

  // Polygon per l'area fill
  const areaPoints = `${padding},${h - padding} ` + points + ` ${w - padding},${h - padding}`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = h - padding - ratio * (h - padding * 2);
        return (
          <line key={i} x1={padding} y1={y} x2={w - padding} y2={y}
            stroke="#E8E8E0" strokeWidth="1" />
        );
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill={fillColor} />

      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {prices.map((v, i) => {
        const x = padding + (i / (prices.length - 1)) * (w - padding * 2);
        const y = h - padding - ((v - min) / range) * (h - padding * 2);
        return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
      })}

      {/* Axis labels */}
      <text x={padding} y={h - 10} fill="#9B9B90" fontSize="12" fontFamily="'DM Sans', sans-serif">
        {new Date(timestamps[0]).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
      </text>
      <text x={w - padding - 40} y={h - 10} fill="#9B9B90" fontSize="12" fontFamily="'DM Sans', sans-serif">
        {new Date(timestamps[timestamps.length - 1]).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
      </text>
    </svg>
  );
}
