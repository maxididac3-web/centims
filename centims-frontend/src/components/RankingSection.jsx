'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { rankingsAPI, achievementsAPI, prizesAPI } from '@/lib/api';

function getPreviousMonth() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  return `${year}-${String(month).padStart(2, '0')}`;
}

const ACHIEVEMENT_ICONS = {
  first_investment: '🌱',
  top10: '🏆',
  top3: '🥇',
  most_trades: '⚡',
  biggest_gain: '📈',
  creator: '🎨',
  hodler: '💎',
  default: '⭐',
};

export default function RankingSection() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month] = useState(getPreviousMonth());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [rankData, achData, prizesData] = await Promise.all([
          rankingsAPI.getForMonth(month).catch(() => ({ rankings: [] })),
          achievementsAPI.getForMonth(month).catch(() => ({ achievements: [] })),
          prizesAPI.getForMonth(month).catch(() => ({ prizes: [] })),
        ]);
        setRankings((rankData.rankings || []).slice(0, 10));
        setAchievements((achData.achievements || []).slice(0, 4));
        setPrizes(prizesData.prizes || []);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, month]);

  const monthLabel = (() => {
    const [y, m] = month.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  })();

  return (
    <section id="ranking" style={{ padding: '3rem 0', background: '#FAFAF8' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Títol */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', margin: '0 auto 1rem' }} />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#0A0A0A',
            letterSpacing: '-0.02em', marginBottom: '0.5rem',
          }}>
            Classificació
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
            color: '#6B6B60', textTransform: 'capitalize',
          }}>
            {monthLabel}
          </p>
        </div>

        {!user ? (
          /* Estat no logat */
          <div style={{
            background: '#0A0A0A', borderRadius: '20px',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '1.75rem',
              fontWeight: '700', color: '#FAFAF8', marginBottom: '1rem',
            }}>
              Ets el proper #1?
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
              color: 'rgba(250,250,248,0.7)', marginBottom: '2rem',
            }}>
              Registra't i entra a la classificació mensual. Els millors guanyen premis de patrocinadors.
            </p>
            <a href="/register" style={{
              background: '#C9A84C', color: '#0A0A0A',
              padding: '0.875rem 2.5rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '1rem',
              border: '2px solid #C9A84C', borderRadius: '50px',
              textDecoration: 'none', display: 'inline-block',
            }}>
              Registra't ara
            </a>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>
            Carregant classificació...
          </div>
        ) : rankings.length === 0 ? (
          <div style={{
            background: '#F5F5F0', borderRadius: '16px',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗓️</div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
              color: '#6B6B60',
            }}>
              La primera classificació es publicarà aviat
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

            {/* Taula top 10 */}
            <div style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E8E8E0', overflow: 'auto',
            }}>
              {/* Capçalera */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '50px 1.5fr 1fr 1.5fr 1.5fr',
                padding: '0.875rem 1.5rem',
                background: '#F8F8F4', borderBottom: '1px solid #E8E8E0',
                minWidth: '560px',
              }}>
                {['#', 'Jugador', 'Valor total', 'Premi', 'Patrocinador'].map((col, i) => (
                  <span key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem',
                    fontWeight: '600', color: '#9B9B90',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: i === 2 ? 'right' : 'left',
                    display: 'block',
                  }}>{col}</span>
                ))}
              </div>

              {rankings.map((entry, i) => {
                const prize = prizes.find(p => p.position === entry.position);
                return (
                  <div key={entry.userId} style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1.5fr 1fr 1.5fr 1.5fr',
                    padding: '1rem 1.5rem',
                    borderBottom: i < rankings.length - 1 ? '1px solid #F5F5F0' : 'none',
                    alignItems: 'center',
                    background: entry.position <= 3 ? `rgba(201,168,76,${0.06 - entry.position * 0.01})` : 'transparent',
                    minWidth: '560px',
                  }}>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: entry.position <= 3 ? '1.1rem' : '0.95rem',
                      fontWeight: '700',
                      color: entry.position === 1 ? '#C9A84C' : entry.position === 2 ? '#9B9B90' : entry.position === 3 ? '#CD7F32' : '#6B6B60',
                    }}>
                      {entry.position <= 3 ? ['🥇', '🥈', '🥉'][entry.position - 1] : `#${entry.position}`}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                      fontWeight: '500', color: '#0A0A0A',
                    }}>
                      {entry.username}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
                      color: '#0A0A0A', textAlign: 'right',
                    }}>
                      {parseFloat(entry.totalValue || 0).toFixed(0)}€
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                      color: prize?.prizeName ? '#0A0A0A' : '#D0D0C8',
                    }}>
                      {prize?.prizeName || '—'}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                      {prize?.sponsorName ? (
                        prize.sponsorLink ? (
                          <a href={prize.sponsorLink} target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: '500' }}>
                            {prize.sponsorName} →
                          </a>
                        ) : (
                          <span style={{ color: '#C9A84C' }}>{prize.sponsorName}</span>
                        )
                      ) : (
                        <span style={{ color: '#D0D0C8' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assoliments (fins a 4) */}
            {achievements.length > 0 && (
              <div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.25rem',
                  fontWeight: '700', color: '#0A0A0A', marginBottom: '1rem',
                }}>
                  Assoliments del mes
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}>
                  {achievements.map(ach => (
                    <div key={ach.id} style={{
                      background: '#FFFFFF', borderRadius: '12px',
                      border: '1px solid #E8E8E0', padding: '1.25rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                      <span style={{ fontSize: '1.75rem' }}>
                        {ACHIEVEMENT_ICONS[ach.achievementType] || ACHIEVEMENT_ICONS.default}
                      </span>
                      <div>
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                          fontWeight: '600', color: '#C9A84C', textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {ach.achievementType?.replace(/_/g, ' ')}
                        </div>
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                          color: '#0A0A0A',
                        }}>
                          {ach.description || ach.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
              <Link href="/dashboard" style={{
                background: '#0A0A0A', color: '#FAFAF8',
                padding: '0.875rem 2.5rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.95rem',
                border: '2px solid #0A0A0A', borderRadius: '50px',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Veure classificació completa
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
