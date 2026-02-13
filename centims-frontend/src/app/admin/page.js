'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { adminAPI } from '@/lib/api';

// API calls especifics per admin
const adminFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('centims_token');
  const response = await fetch(`http://localhost:3001${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error del servidor');
  return data;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminTxPage, setAdminTxPage] = useState(1);
  
  // Propostes
  const [proposals, setProposals] = useState({ pending: [], accepted: [], rejected: [] });
  const [acceptModal, setAcceptModal] = useState(null);
  const [acceptForm, setAcceptForm] = useState({ p0: '', k: '' });
  const [acceptError, setAcceptError] = useState('');
  const [adminTxTotal, setAdminTxTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal crear/editar token
  const [tokenModal, setTokenModal] = useState(null); // null | 'create' | {token}
  const [tokenForm, setTokenForm] = useState({ name: '', emoji: '', ticker: '', description: '', p0: '', k: '' });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');

  // Modal afegir saldo
  const [balanceModal, setBalanceModal] = useState(null); // null | {user}
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchAll();
  }, [user, authLoading]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dash, tokensData, usersData] = await Promise.all([
        adminFetch('/admin/dashboard'),
        adminFetch('/products/all'),
        adminFetch('/admin/users?limit=50'),
      ]);
      setDashboard(dash);
      setTokens(tokensData.products || []);
      setUsers(usersData.users || []);
      
      // Carregar propostes
      await fetchProposals();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProposals = async () => {
    try {
      const data = await adminAPI.getProposals();
      setProposals(data);
    } catch (err) {
      console.error('Error carregant propostes:', err);
    }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  // TOKENS
  const openCreateToken = () => {
    setTokenForm({ name: '', emoji: '', ticker: '', description: '', p0: '', k: '' });
    setTokenError('');
    setTokenSuccess('');
    setTokenModal('create');
  };

  const openEditToken = (token) => {
    setTokenForm({
      name: token.name,
      emoji: token.emoji,
      ticker: token.ticker,
      description: token.description || '',
      p0: token.p0.toString(),
      k: token.k.toString(),
    });
    setTokenError('');
    setTokenSuccess('');
    setTokenModal(token);
  };

  const handleSaveToken = async () => {
    setTokenLoading(true);
    setTokenError('');
    setTokenSuccess('');
    try {
      if (tokenModal === 'create') {
        await adminFetch('/products', {
          method: 'POST',
          body: JSON.stringify(tokenForm),
        });
        setTokenSuccess('Token creat correctament!');
      } else {
        await adminFetch(`/products/${tokenModal.id}`, {
          method: 'PUT',
          body: JSON.stringify(tokenForm),
        });
        setTokenSuccess('Token actualitzat!');
      }
      await fetchAll();
      setTimeout(() => { setTokenModal(null); setTokenSuccess(''); }, 1500);
    } catch (err) {
      setTokenError(err.message);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleToggleActive = async (token) => {
    try {
      await adminFetch(`/products/${token.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !token.isActive }),
      });
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConsolidate = async (productId) => {
    if (!confirm('Segur que vols consolidar el buffer? Cremarem les fraccions i recuperarem els EUR.')) return;
    try {
      const result = await adminFetch(`/admin/consolidate/${productId}`, { method: 'POST' });
      alert(`Consolidat! Recuperats ${result.eurRecovered?.toFixed(2)}€`);
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (token) => {
    if (token.totalHolders && token.totalHolders > 0) {
      alert(`❌ No pots eliminar "${token.name}". Té ${token.totalHolders} holders actius.`);
      return;
    }
    
    if (parseFloat(token.bufferFractions || 0) > 0) {
      alert(`❌ El token "${token.name}" té ${parseFloat(token.bufferFractions).toFixed(2)} fraccions al buffer. Consolida primer.`);
      return;
    }
    
    const confirmed = confirm(
      `⚠️ ATENCIÓ: Estàs a punt d'eliminar permanentment el token "${token.name}" (${token.ticker}).\n\n` +
      `Això eliminarà:\n` +
      `- El token del mercat\n` +
      `- Tot l'historial de preus\n` +
      `- El buffer admin\n` +
      `- La proposta associada (si existeix)\n\n` +
      `Aquesta acció NO es pot desfer.\n\n` +
      `Estàs segur?`
    );
    
    if (!confirmed) return;
    
    try {
      await adminAPI.deleteProduct(token.id);
      alert(`✅ Token "${token.name}" eliminat correctament`);
      setTokenModal(null);
      await fetchAll();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // USUARIS
  const handleAddBalance = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) return;
    setBalanceLoading(true);
    try {
      await adminFetch(`/admin/users/${balanceModal.id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount: parseFloat(balanceAmount) }),
      });
      await fetchAll();
      setBalanceModal(null);
      setBalanceAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    if (!confirm(`Segur que vols ${isBanned ? 'desbannejar' : 'bannejar'} aquest usuari?`)) return;
    try {
      await adminFetch(`/admin/users/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ isBanned: !isBanned }),
      });
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6B60' }}>Carregant panell admin...</div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
    color: '#0A0A0A', background: '#FAFAF8',
    border: '1.5px solid #E8E8E0', borderRadius: '8px',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.8rem', fontWeight: '500', color: '#6B6B60',
    marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0' }}>

      {/* NAVBAR ADMIN */}
      <nav style={{
        background: '#0A0A0A', padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: '900',
            color: '#FAFAF8', textDecoration: 'none', letterSpacing: '-0.02em',
          }}>
            Centims
          </Link>
          <span style={{
            background: '#C9A84C', color: '#0A0A0A',
            padding: '0.2rem 0.6rem', borderRadius: '20px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '700',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'rgba(250,250,248,0.6)' }}>
            {user?.name}
          </span>
          <Link href="/dashboard" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
            color: 'rgba(250,250,248,0.6)', textDecoration: 'none',
          }}>
            Vista usuari
          </Link>
          <button onClick={handleLogout} style={{
            background: 'transparent', color: 'rgba(250,250,248,0.5)',
            padding: '0.4rem 0.875rem', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem', border: '1px solid rgba(250,250,248,0.15)',
            borderRadius: '50px', cursor: 'pointer',
          }}>
            Sortir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'tokens', label: '🪙 Tokens' },
            { id: 'usuaris', label: '👥 Usuaris' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? '#0A0A0A' : '#FFFFFF',
              color: activeTab === tab.id ? '#FAFAF8' : '#6B6B60',
              padding: '0.6rem 1.5rem',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
              border: '1.5px solid', borderColor: activeTab === tab.id ? '#0A0A0A' : '#E8E8E0',
              borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>


        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && dashboard && (
          <div>
            
            {/* ═══════════════════════════════════════════════ */}
            {/* SECCIÓ 1: LIQUIDITAT + CAPITALS (2 boxes grans) */}
            {/* ═══════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              
              {/* BOX HEALTH SCORE */}
              <div style={{
                background: dashboard.ratios?.healthScore >= 75 ? 'rgba(45,106,79,0.05)' :
                           dashboard.ratios?.healthScore >= 50 ? 'rgba(201,168,76,0.05)' :
                           'rgba(193,18,31,0.05)',
                border: `2px solid ${
                  dashboard.ratios?.healthScore >= 75 ? '#2D6A4F' :
                  dashboard.ratios?.healthScore >= 50 ? '#C9A84C' :
                  '#C1121F'
                }`,
                borderRadius: '12px',
                padding: '1.5rem',
              }}>
                {/* Health Score principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>
                    {dashboard.ratios?.healthScore >= 75 ? '🟢' :
                     dashboard.ratios?.healthScore >= 50 ? '🟡' : '🔴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                      color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: '0.35rem'
                    }}>
                      Health Score
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '2.5rem',
                      fontWeight: '700',
                      color: dashboard.ratios?.healthScore >= 75 ? '#2D6A4F' :
                             dashboard.ratios?.healthScore >= 50 ? '#C9A84C' :
                             '#C1121F'
                    }}>
                      {dashboard.ratios?.healthScore || 0}/100
                    </div>
                  </div>
                </div>

                {/* Barra de progrés */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: 'rgba(0,0,0,0.08)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: `${dashboard.ratios?.healthScore || 0}%`,
                    height: '100%',
                    background: dashboard.ratios?.healthScore >= 75 ? '#2D6A4F' :
                               dashboard.ratios?.healthScore >= 50 ? '#C9A84C' :
                               '#C1121F',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>

                {/* Missatge estat */}
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.6)', borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                  color: '#6B6B60', lineHeight: 1.5,
                  marginBottom: '1.5rem'
                }}>
                  {dashboard.ratios?.healthScore >= 75 && '🟢 Plataforma sana. Tots els indicadors positius.'}
                  {dashboard.ratios?.healthScore >= 50 && dashboard.ratios?.healthScore < 75 && '🟡 Plataforma estable. Vigilar alguns indicadors.'}
                  {dashboard.ratios?.healthScore < 50 && '🔴 Plataforma necessita atenció. Revisar mètriques clau.'}
                </div>

                {/* 3 Ratios secundaris */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(0,0,0,0.08)'
                }}>
                  {/* Cobertura liquiditat */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        fontWeight: '600', color: '#0A0A0A', marginBottom: '0.25rem'
                      }}>
                        💰 Cobertura liquiditat
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90'
                      }}>
                        {(dashboard.ratios?.adminCapitalTotal || 0).toFixed(2)}€ vs {(dashboard.ratios?.totalUserCash || 0).toFixed(2)}€
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                      fontWeight: '700',
                      color: (dashboard.ratios?.coberturaLiquiditat || 0) >= 150 ? '#2D6A4F' :
                             (dashboard.ratios?.coberturaLiquiditat || 0) >= 100 ? '#C9A84C' :
                             '#C1121F'
                    }}>
                      {(dashboard.ratios?.coberturaLiquiditat || 0).toFixed(0)}%
                    </div>
                  </div>

                  {/* ROI capital */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        fontWeight: '600', color: '#0A0A0A', marginBottom: '0.25rem'
                      }}>
                        📈 ROI capital
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90'
                      }}>
                        {(dashboard.ratios?.beneficiNet || 0).toFixed(2)}€ / {(dashboard.ratios?.adminCapitalInjected || 1000).toFixed(2)}€
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                      fontWeight: '700',
                      color: (dashboard.ratios?.ROI || 0) >= 20 ? '#2D6A4F' :
                             (dashboard.ratios?.ROI || 0) >= 5 ? '#C9A84C' :
                             (dashboard.ratios?.ROI || 0) >= 0 ? '#6B6B60' :
                             '#C1121F'
                    }}>
                      {(dashboard.ratios?.ROI || 0) >= 0 ? '+' : ''}{(dashboard.ratios?.ROI || 0).toFixed(1)}%
                    </div>
                  </div>

                  {/* Activitat mercat */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        fontWeight: '600', color: '#0A0A0A', marginBottom: '0.25rem'
                      }}>
                        🔥 Activitat 24h
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90'
                      }}>
                        {(dashboard.ratios?.volume24h || 0).toFixed(2)}€ / {(dashboard.ratios?.totalTVL || 0).toFixed(2)}€ TVL
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                      fontWeight: '700',
                      color: (dashboard.ratios?.activitatMercat || 0) >= 10 ? '#2D6A4F' :
                             (dashboard.ratios?.activitatMercat || 0) >= 3 ? '#C9A84C' :
                             '#6B6B60'
                    }}>
                      {(dashboard.ratios?.activitatMercat || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX RESUM CAPITALS */}
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #E8E8E0',
                borderRadius: '12px',
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                  fontWeight: '700', color: '#0A0A0A', margin: '0 0 1.25rem 0',
                }}>
                  💼 Resum Capitals
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Capital injectat */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90', marginBottom: '0.25rem'
                      }}>
                        💰 Capital injectat
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        color: '#6B6B60'
                      }}>
                        Inversió inicial
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                      fontWeight: '700', color: '#2D6A4F'
                    }}>
                      +{parseFloat(dashboard.adminCapitalInjected || 0).toFixed(2)}€
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#E8E8E0' }}></div>

                  {/* Capital retirat */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90', marginBottom: '0.25rem'
                      }}>
                        💸 Capital retirat
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        color: '#6B6B60'
                      }}>
                        Beneficis extrets
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                      fontWeight: '700', color: '#C1121F'
                    }}>
                      -{parseFloat(dashboard.adminCapitalWithdrawn || 0).toFixed(2)}€
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#E8E8E0' }}></div>

                  {/* Saldo disponible */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                        color: '#9B9B90', marginBottom: '0.25rem'
                      }}>
                        💵 Saldo disponible
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        color: '#6B6B60'
                      }}>
                        Liquiditat actual
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                      fontWeight: '700', color: '#C9A84C'
                    }}>
                      {parseFloat(dashboard.adminBalanceEUR || 0).toFixed(2)}€
                    </div>
                  </div>

                  {/* Botons Ingressar + Extreure */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    
                    {/* Botó Ingressar */}
                    <button
                      onClick={() => {
                        const amount = prompt('Quant capital vols ingressar a l\'empresa?');
                        if (amount && parseFloat(amount) > 0) {
                          // TODO: Implementar inject
                          alert('Funcionalitat en desenvolupament\n\nQuè farà:\n- Incrementar adminBalanceEUR\n- Incrementar adminCapitalInjected\n- Futur: Integració Stripe');
                        }
                      }}
                      style={{
                        background: '#2D6A4F',
                        color: '#FAFAF8',
                        padding: '0.75rem',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1F4A37'}
                      onMouseLeave={e => e.currentTarget.style.background = '#2D6A4F'}
                    >
                      💰 Ingressar
                    </button>

                    {/* Botó Extreure */}
                    <button
                      onClick={() => {
                        const amount = prompt('Quant vols extreure del saldo disponible?');
                        if (amount && parseFloat(amount) > 0) {
                          // TODO: Implementar withdraw
                          alert('Funcionalitat en desenvolupament\n\nQuè farà:\n- Decrementar adminBalanceEUR\n- Incrementar adminCapitalWithdrawn\n- Futur: Transfer a Stripe → Banc');
                        }
                      }}
                      style={{
                        background: 'transparent',
                        color: '#C1121F',
                        padding: '0.75rem',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: '2px solid #C1121F',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#C1121F';
                        e.currentTarget.style.color = '#FAFAF8';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#C1121F';
                      }}
                    >
                      💸 Extreure
                    </button>
                  </div>
                </div>
              </div>
              </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* SECCIÓ 2: MÈTRIQUES FINANCERES (4 boxes)        */}
            {/* ═══════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                {
                  label: 'Spread acumulat',
                  value: `${parseFloat(dashboard.adminSpreadEarned || 0).toFixed(2)}€`,
                  icon: '📊',
                  color: '#C9A84C',
                  description: 'Fees guanyats (històric)'
                },
                {
                  label: 'Buffer virtual acomulat',
                  value: `${parseFloat(dashboard.stats?.totalBufferValue || 0).toFixed(2)}€`,
                  icon: '🪙',
                  color: '#6B6B60',
                  description: 'Valor fraccions cremades'
                },
                {
                  label: 'Buffer consolidat',
                  value: `${parseFloat(dashboard.stats?.totalConsolidatedEUR || 0).toFixed(2)}€`,
                  icon: '💎',
                  color: '#2D6A4F',
                  description: 'EUR recuperats (històric)'
                },
                {
                  label: 'Capital en circulació (TVL)',
                  value: `${parseFloat(dashboard.stats?.totalTVL || 0).toFixed(2)}€`,
                  icon: '🏦',
                  color: '#0A0A0A',
                  description: 'Invertit per usuaris'
                },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E8E8E0'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    color: '#9B9B90',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.35rem'
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.6rem',
                    fontWeight: '700',
                    color: stat.color,
                    marginBottom: '0.35rem'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.72rem',
                    color: '#9B9B90'
                  }}>
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* SECCIÓ 3: ESTADÍSTIQUES GENERALS (4 boxes)      */}
            {/* ═══════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                {
                  label: 'Transaccions totals',
                  value: dashboard.stats?.totalTransactions || 0,
                  icon: '📋',
                  color: '#6B6B60'
                },
                {
                  label: 'Usuaris totals',
                  value: dashboard.stats?.totalUsers || 0,
                  icon: '👥',
                  color: '#6B6B60'
                },
                {
                  label: 'Compte personal',
                  value: `${parseFloat(dashboard.adminPersonalBalance || 0).toFixed(2)}€`,
                  icon: '👤',
                  color: '#C9A84C'
                },
                {
                  label: 'Tokens en circulació',
                  value: dashboard.stats?.totalProducts || 0,
                  icon: '🪙',
                  color: '#6B6B60'
                },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E8E8E0'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    color: '#9B9B90',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.35rem'
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.6rem',
                    fontWeight: '700',
                    color: stat.color
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* TRANSACCIONS RECENTS (mantenir igual)           */}
            {/* ═══════════════════════════════════════════════ */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E8E8E0' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                  Transaccions recents
                </h3>
              </div>
              {(dashboard.recentTransactions || []).map((tx, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                  padding: '0.875rem 1.5rem',
                  borderBottom: '1px solid #F5F5F0', alignItems: 'center',
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#9B9B90' }}>
                    {new Date(tx.createdAt).toLocaleDateString('ca-ES')}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A' }}>
                    {tx.user?.name || tx.user?.email}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>
                    {tx.product?.emoji} {tx.product?.name}
                  </div>
                  <div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '600',
                      color: tx.type === 'BUY' ? '#2D6A4F' : '#C1121F',
                      background: tx.type === 'BUY' ? 'rgba(45,106,79,0.08)' : 'rgba(193,18,31,0.08)',
                      padding: '0.2rem 0.5rem', borderRadius: '20px',
                    }}>
                      {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#0A0A0A' }}>
                    {parseFloat(tx.amountEUR || tx.eurRecovered || 0).toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TOKENS */}
        {activeTab === 'tokens' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                Gestio de tokens
              </h2>
              <button onClick={openCreateToken} style={{
                background: '#0A0A0A', color: '#FAFAF8',
                padding: '0.7rem 1.5rem',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
                border: 'none', borderRadius: '50px', cursor: 'pointer',
              }}>
                + Nou token
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Capçalera columnes tokens */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 200px',
                gap: '1rem', padding: '0 1.5rem',
              }}>
                {['Token', 'Preu', 'Supply', 'P0 / k', 'Buffer', 'Holders', 'Accions'].map((col, i) => (
                  <span key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600',
                    color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: i === 0 ? 'left' : i === 6 ? 'left' : 'center',
                  }}>{col}</span>
                ))}
              </div>
              {tokens.map((token) => (
                <div key={token.id} style={{
                  background: '#FFFFFF', borderRadius: '12px',
                  border: `1px solid ${token.isActive ? '#E8E8E0' : 'rgba(193,18,31,0.2)'}`,
                  padding: '1.25rem 1.5rem',
                  opacity: token.isActive ? 1 : 0.7,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 200px', gap: '1rem', alignItems: 'center' }}>

                    {/* Nom */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{token.emoji}</span>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: '600', color: '#0A0A0A' }}>
                          {token.name}
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90' }}>
                          {token.ticker}
                        </div>
                      </div>
                    </div>

                    {/* Preu */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
                        {token.currentPrice.toFixed(2)}€
                      </div>
                    </div>

                    {/* Supply */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>
                        {parseFloat(token.supply).toFixed(0)}
                      </div>
                    </div>

                    {/* P0 i k */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>
                        {token.p0} / {token.k}
                      </div>
                    </div>

                    {/* Buffer */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#C9A84C', fontWeight: '600' }}>
                        {parseFloat(token.bufferFractions).toFixed(2)}
                      </div>
                    </div>

                    {/* Holders */}
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holders</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>
                        {token.totalHolders || 0}
                      </div>
                    </div>

                    {/* Accions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditToken(token)} style={{
                        background: 'transparent', color: '#0A0A0A',
                        padding: '0.35rem 0.75rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                        border: '1.5px solid #0A0A0A', borderRadius: '50px', cursor: 'pointer',
                      }}>
                        Editar
                      </button>
                      <button onClick={() => handleToggleActive(token)} style={{
                        background: token.isActive ? 'rgba(193,18,31,0.08)' : 'rgba(45,106,79,0.08)',
                        color: token.isActive ? '#C1121F' : '#2D6A4F',
                        padding: '0.35rem 0.75rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                        border: `1.5px solid ${token.isActive ? '#C1121F' : '#2D6A4F'}`,
                        borderRadius: '50px', cursor: 'pointer',
                      }}>
                        {token.isActive ? 'Pausar' : 'Activar'}
                      </button>
                      {parseFloat(token.bufferFractions) > 0 && (
                        <button onClick={() => handleConsolidate(token.id)} style={{
                          background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                          padding: '0.35rem 0.75rem',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                          border: '1.5px solid #C9A84C', borderRadius: '50px', cursor: 'pointer',
                        }}>
                          Consolidar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: USUARIS */}
        {activeTab === 'usuaris' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem' }}>
              Gestio d&apos;usuaris
            </h2>
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 180px',
                padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0',
              }}>
                {['Nom', 'Email', 'Rol', 'Saldo', 'Estat', 'Accions'].map((col, i) => (
                  <span key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: i <= 1 ? 'left' : i === 5 ? 'center' : 'center',
                    display: 'block',
                  }}>
                    {col}
                  </span>
                ))}
              </div>
              {users.map((u, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 180px',
                  padding: '1rem 1.5rem', borderBottom: i < users.length - 1 ? '1px solid #F5F5F0' : 'none',
                  alignItems: 'center', opacity: u.isBanned ? 0.5 : 1,
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
                    {u.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>
                    {u.email}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600',
                      color: u.role === 'ADMIN' ? '#C9A84C' : '#6B6B60',
                      background: u.role === 'ADMIN' ? 'rgba(201,168,76,0.1)' : '#F5F5F0',
                      padding: '0.2rem 0.5rem', borderRadius: '20px',
                    }}>
                      {u.role}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A', textAlign: 'center' }}>
                    {parseFloat(u.balanceEUR).toFixed(2)}€
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600',
                      color: u.isBanned ? '#C1121F' : '#2D6A4F',
                      background: u.isBanned ? 'rgba(193,18,31,0.08)' : 'rgba(45,106,79,0.08)',
                      padding: '0.2rem 0.5rem', borderRadius: '20px',
                    }}>
                      {u.isBanned ? 'Bannejat' : 'Actiu'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <button onClick={() => { setBalanceModal(u); setBalanceAmount(''); }} style={{
                      background: 'transparent', color: '#2D6A4F',
                      padding: '0.35rem 0.75rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                      border: '1.5px solid #2D6A4F', borderRadius: '50px', cursor: 'pointer',
                    }}>
                      + Saldo
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button onClick={() => handleBanUser(u.id, u.isBanned)} style={{
                        background: u.isBanned ? 'rgba(45,106,79,0.08)' : 'rgba(193,18,31,0.08)',
                        color: u.isBanned ? '#2D6A4F' : '#C1121F',
                        padding: '0.35rem 0.75rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                        border: `1.5px solid ${u.isBanned ? '#2D6A4F' : '#C1121F'}`,
                        borderRadius: '50px', cursor: 'pointer',
                      }}>
                        {u.isBanned ? 'Desbannejar' : 'Bannejar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR TOKEN */}
      {tokenModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setTokenModal(null); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem' }}>
              {tokenModal === 'create' ? '🪙 Nou token' : `✏️ Editar ${tokenModal.name}`}
            </h3>

            {tokenError && (
              <div style={{ background: 'rgba(193,18,31,0.06)', border: '1px solid rgba(193,18,31,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#C1121F' }}>
                {tokenError}
              </div>
            )}
            {tokenSuccess && (
              <div style={{ background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#2D6A4F' }}>
                {tokenSuccess}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <input value={tokenForm.emoji} onChange={e => setTokenForm({ ...tokenForm, emoji: e.target.value })} placeholder="🪙" style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
                </div>
                <div>
                  <label style={labelStyle}>Ticker</label>
                  <input value={tokenForm.ticker} onChange={e => setTokenForm({ ...tokenForm, ticker: e.target.value.toUpperCase() })} placeholder="TKN" maxLength={5} style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nom del token</label>
                <input value={tokenForm.name} onChange={e => setTokenForm({ ...tokenForm, name: e.target.value })} placeholder="El meu token catala" style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
              </div>

              <div>
                <label style={labelStyle}>Descripcio (opcional)</label>
                <input value={tokenForm.description} onChange={e => setTokenForm({ ...tokenForm, description: e.target.value })} placeholder="Breu descripcio del token" style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>P0 (preu inicial €)</label>
                  <input type="number" step="0.001" min="0.001" value={tokenForm.p0} onChange={e => setTokenForm({ ...tokenForm, p0: e.target.value })} placeholder="0.10" style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#9B9B90', marginTop: '0.35rem' }}>Preu quan supply = 0</p>
                </div>
                <div>
                  <label style={labelStyle}>k (pendent de la corba)</label>
                  <input type="number" step="0.00001" min="0.00001" value={tokenForm.k} onChange={e => setTokenForm({ ...tokenForm, k: e.target.value })} placeholder="0.0001" style={inputStyle} onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = '#E8E8E0'} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#9B9B90', marginTop: '0.35rem' }}>Com de rapid puja el preu</p>
                </div>
              </div>

              {/* Preview preu */}
              {tokenForm.p0 && tokenForm.k && (
                <div style={{ background: '#F8F8F4', borderRadius: '8px', padding: '0.875rem 1rem', border: '1px solid #E8E8E0' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60', margin: '0 0 0.35rem' }}>
                    Preview corba de preus:
                  </p>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    {[0, 100, 500, 1000, 5000].map(supply => (
                      <div key={supply} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#9B9B90' }}>S={supply}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#0A0A0A' }}>
                          {(parseFloat(tokenForm.p0) * (1 + parseFloat(tokenForm.k) * supply)).toFixed(4)}€
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setTokenModal(null)} style={{
                flex: 1, background: 'transparent', color: '#6B6B60',
                padding: '0.875rem', fontFamily: "'DM Sans', sans-serif", fontWeight: '500',
                border: '1.5px solid #E8E8E0', borderRadius: '50px', cursor: 'pointer',
              }}>
                Cancel·lar
              </button>
              <button onClick={handleSaveToken} disabled={tokenLoading} style={{
                flex: 1, background: tokenLoading ? '#9B9B90' : '#0A0A0A', color: '#FAFAF8',
                padding: '0.875rem', fontFamily: "'DM Sans', sans-serif", fontWeight: '500',
                border: 'none', borderRadius: '50px', cursor: tokenLoading ? 'not-allowed' : 'pointer',
              }}>
                {tokenLoading ? 'Guardant...' : (tokenModal === 'create' ? 'Crear token' : 'Guardar canvis')}
              </button>
            </div>

            {tokenModal !== 'create' && (
              <div style={{ borderTop: '1px solid #E8E8E0', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#C1121F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    ⚠️ Zona perillosa
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60', marginBottom: '0.75rem', lineHeight: 1.5, margin: 0 }}>
                    Només es pot eliminar si <strong>no té holders</strong> i el <strong>buffer és 0</strong>.
                  </p>
                </div>
                <button onClick={() => handleDeleteProduct(tokenModal)} disabled={(tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0)} style={{ width: '100%', background: (tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0) ? '#E8E8E0' : 'rgba(193, 18, 31, 0.08)', color: (tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0) ? '#9B9B90' : '#C1121F', padding: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', border: `1.5px solid ${(tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0) ? '#E8E8E0' : '#C1121F'}`, borderRadius: '50px', cursor: (tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!(tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0)) { e.currentTarget.style.background = '#C1121F'; e.currentTarget.style.color = '#FAFAF8'; }}} onMouseLeave={e => { if (!(tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0)) { e.currentTarget.style.background = 'rgba(193, 18, 31, 0.08)'; e.currentTarget.style.color = '#C1121F'; }}}>
                  🗑️ Eliminar token permanentment
                  {(tokenModal.totalHolders > 0 || parseFloat(tokenModal.bufferFractions || 0) > 0) && ` (${tokenModal.totalHolders || 0} holders, ${parseFloat(tokenModal.bufferFractions || 0).toFixed(0)} buffer)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL AFEGIR SALDO */}
      {balanceModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setBalanceModal(null); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '380px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem' }}>
              Afegir saldo
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60', marginBottom: '1.5rem' }}>
              {balanceModal.name} · Saldo actual: {parseFloat(balanceModal.balanceEUR).toFixed(2)}€
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Import a afegir (€)</label>
              <input
                type="number" min="0" step="1"
                placeholder="100"
                value={balanceAmount}
                onChange={e => setBalanceAmount(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#E8E8E0'}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setBalanceModal(null)} style={{
                flex: 1, background: 'transparent', color: '#6B6B60',
                padding: '0.875rem', fontFamily: "'DM Sans', sans-serif",
                border: '1.5px solid #E8E8E0', borderRadius: '50px', cursor: 'pointer',
              }}>
                Cancel·lar
              </button>
              <button onClick={handleAddBalance} disabled={balanceLoading} style={{
                flex: 1, background: '#2D6A4F', color: '#FAFAF8',
                padding: '0.875rem', fontFamily: "'DM Sans', sans-serif", fontWeight: '500',
                border: 'none', borderRadius: '50px', cursor: 'pointer',
              }}>
                {balanceLoading ? 'Afegint...' : 'Afegir saldo'}
              </button>
            </div>
          </div>
        </div>
      )}
    

        {/* SECCIÓ: PROPOSTES TOKENS */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.8rem',
            fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem',
          }}>
            Propostes de tokens
          </h2>

          {/* Propostes PENDENTS */}
          {proposals.pending.length > 0 && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '2px solid #C9A84C', marginBottom: '2rem',
            }}>
              <div style={{
                background: 'rgba(201, 168, 76, 0.1)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #C9A84C',
              }}>
                <h3 style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem',
                  fontWeight: '600', color: '#C9A84C', margin: 0,
                }}>
                  ⏳ Pendents de revisió ({proposals.pending.length})
                </h3>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {proposals.pending.map(prop => (
                  <div key={prop.id} style={{
                    border: '1px solid #E8E8E0', borderRadius: '10px',
                    padding: '1.5rem', marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                      {/* Emoji */}
                      <span style={{ fontSize: '3rem' }}>{prop.emoji}</span>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                          fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem',
                        }}>
                          {prop.name} <span style={{ color: '#C9A84C' }}>({prop.ticker})</span>
                        </div>

                        <div style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                          color: '#6B6B60', marginBottom: '1rem', lineHeight: 1.6,
                        }}>
                          {prop.description}
                        </div>

                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                          marginBottom: '1rem',
                        }}>
                          <div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                              color: '#9B9B90', marginBottom: '0.25rem',
                            }}>
                              Proposat per
                            </div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                              fontWeight: '600', color: '#0A0A0A',
                            }}>
                              {prop.user.name}
                            </div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                              color: '#9B9B90',
                            }}>
                              {prop.user.email}
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                              color: '#9B9B90', marginBottom: '0.25rem',
                            }}>
                              Data proposta
                            </div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                              fontWeight: '600', color: '#0A0A0A',
                            }}>
                              {new Date(prop.createdAt).toLocaleDateString('ca-ES')}
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                              color: '#9B9B90', marginBottom: '0.25rem',
                            }}>
                              ID Proposta
                            </div>
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                              fontWeight: '600', color: '#0A0A0A',
                            }}>
                              #{prop.id}
                            </div>
                          </div>
                        </div>

                        {/* Accions */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            onClick={() => {
                              setAcceptModal(prop);
                              setAcceptForm({ p0: '', k: '' });
                              setAcceptError('');
                            }}
                            style={{
                              background: '#2D6A4F', color: '#FAFAF8',
                              padding: '0.75rem 1.5rem',
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600',
                              border: '2px solid #2D6A4F', borderRadius: '50px',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1F4A37'; e.currentTarget.style.borderColor = '#1F4A37'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.borderColor = '#2D6A4F'; }}
                          >
                            ✅ Acceptar i crear token
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Segur que vols refusar "${prop.name}"?`)) {
                                try {
                                  await adminAPI.rejectProposal(prop.id);
                                  await fetchProposals();
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                            style={{
                              background: 'transparent', color: '#C1121F',
                              padding: '0.75rem 1.5rem',
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600',
                              border: '2px solid #C1121F', borderRadius: '50px',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#C1121F'; e.currentTarget.style.color = '#FAFAF8'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C1121F'; }}
                          >
                            ❌ Refusar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Propostes ACCEPTADES i REFUSADES */}
          {(proposals.accepted.length > 0 || proposals.rejected.length > 0) && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '1.5rem',
            }}>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem',
                fontWeight: '600', color: '#6B6B60', marginBottom: '1rem',
              }}>
                Historial de propostes
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Acceptades */}
                {proposals.accepted.map(prop => (
                  <div key={prop.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', border: '1px solid #E8E8E0', borderRadius: '8px',
                    background: 'rgba(45, 106, 79, 0.05)',
                  }}>
                    <span style={{ fontSize: '2rem' }}>{prop.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                        fontWeight: '600', color: '#0A0A0A',
                      }}>
                        {prop.name} ({prop.ticker})
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        color: '#6B6B60',
                      }}>
                        Per {prop.user.name} · Revisat per {prop.reviewer?.name} el {new Date(prop.reviewedAt).toLocaleDateString('ca-ES')}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(45, 106, 79, 0.1)', color: '#2D6A4F',
                      padding: '0.4rem 1rem', borderRadius: '20px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600',
                    }}>
                      ✅ Acceptada
                    </div>
                  </div>
                ))}

                {/* Refusades (en gris) */}
                {proposals.rejected.map(prop => (
                  <div key={prop.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', border: '1px solid #E8E8E0', borderRadius: '8px',
                    background: '#F5F5F0', opacity: 0.7,
                  }}>
                    <span style={{ fontSize: '2rem', filter: 'grayscale(1)' }}>{prop.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                        fontWeight: '600', color: '#6B6B60',
                      }}>
                        {prop.name} ({prop.ticker})
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                        color: '#9B9B90',
                      }}>
                        Per {prop.user.name} · Refusada per {prop.reviewer?.name} el {new Date(prop.reviewedAt).toLocaleDateString('ca-ES')}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(193, 18, 31, 0.1)', color: '#C1121F',
                      padding: '0.4rem 1rem', borderRadius: '20px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600',
                    }}>
                      ❌ Refusada
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proposals.pending.length === 0 && proposals.accepted.length === 0 && proposals.rejected.length === 0 && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '3rem',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                color: '#9B9B90',
              }}>
                No hi ha propostes encara
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Acceptar proposta */}
        {acceptModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '2rem',
          }} onClick={() => setAcceptModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#FAFAF8', borderRadius: '16px', padding: '2rem',
              maxWidth: '500px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem' }}>{acceptModal.emoji}</span>
                <div>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                    fontWeight: '700', color: '#0A0A0A', margin: 0,
                  }}>
                    {acceptModal.name}
                  </h3>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                    color: '#C9A84C', fontWeight: '600',
                  }}>
                    {acceptModal.ticker}
                  </div>
                </div>
              </div>

              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                color: '#6B6B60', marginBottom: '1.5rem',
              }}>
                Defineix els paràmetres de la bonding curve per crear el token:
              </div>

              {acceptError && (
                <div style={{
                  background: 'rgba(193, 18, 31, 0.1)', color: '#C1121F',
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                  marginBottom: '1rem',
                }}>
                  {acceptError}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                }}>
                  P0 (Preu base inicial en €)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={acceptForm.p0}
                  onChange={e => setAcceptForm({ ...acceptForm, p0: e.target.value })}
                  placeholder="0.15"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                    border: '1.5px solid #E8E8E0', borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                }}>
                  k (Pendent de la corba)
                </label>
                <input
                  type="number"
                  step="0.00001"
                  min="0.00001"
                  value={acceptForm.k}
                  onChange={e => setAcceptForm({ ...acceptForm, k: e.target.value })}
                  placeholder="0.00015"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                    border: '1.5px solid #E8E8E0', borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setAcceptModal(null)}
                  style={{
                    flex: 1,
                    background: 'transparent', color: '#6B6B60',
                    padding: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
                    border: '1.5px solid #E8E8E0', borderRadius: '50px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel·lar
                </button>
                <button
                  onClick={async () => {
                    if (!acceptForm.p0 || !acceptForm.k) {
                      setAcceptError('Omple tots els camps');
                      return;
                    }
                    try {
                      await adminAPI.acceptProposal(acceptModal.id, acceptForm.p0, acceptForm.k);
                      setAcceptModal(null);
                      await fetchAll();
                    } catch (err) {
                      setAcceptError(err.message);
                    }
                  }}
                  style={{
                    flex: 1,
                    background: '#2D6A4F', color: '#FAFAF8',
                    padding: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600',
                    border: '2px solid #2D6A4F', borderRadius: '50px',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Crear token
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
