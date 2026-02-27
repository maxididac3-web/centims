'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { adminAPI, rankingsAPI, achievementsAPI, prizesAPI, emailsAPI } from '@/lib/api';

// API calls especifics per admin
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const adminFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('centims_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
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
  const [tokenForm, setTokenForm] = useState({ name: '', emoji: '', ticker: '', description: '', p0: '', k: '', isTemporary: false });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');

  // Modal afegir saldo
  const [balanceModal, setBalanceModal] = useState(null); // null | {user}
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Classificació (admin)
  const [adminRankings, setAdminRankings] = useState([]);
  const [adminRankingMonth, setAdminRankingMonth] = useState('current');
  const [adminAvailableMonths, setAdminAvailableMonths] = useState([]);
  const [adminPrizes, setAdminPrizes] = useState([]);
  const [adminAchievements, setAdminAchievements] = useState([]);
  const [adminRankingLoading, setAdminRankingLoading] = useState(false);

  // Premis (admin)
  const [prizesMonth, setPrizesMonth] = useState('');
  const [prizesData, setPrizesData] = useState(Array.from({ length: 10 }, (_, i) => ({ position: i + 1, prizeName: '', sponsorName: '', sponsorLink: '' })));
  const [editingPrize, setEditingPrize] = useState(null);
  const [prizeEditForm, setPrizeEditForm] = useState({ prizeName: '', sponsorName: '', sponsorLink: '' });
  const [prizesLoading, setPrizesLoading] = useState(false);

  // Comunicacions (admin)
  const [emailHistory, setEmailHistory] = useState([]);
  const [emailHistoryPage, setEmailHistoryPage] = useState(1);
  const [emailViewModal, setEmailViewModal] = useState(null);
  const [winnersMonth, setWinnersMonth] = useState('');
  const [customRecipients, setCustomRecipients] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [emailSending, setEmailSending] = useState('');
  const [emailMsg, setEmailMsg] = useState({});

  // Historial (admin)
  const [adminTransactions, setAdminTransactions] = useState([]);

  // Boost modal (Tokens tab)
  const [boostModal, setBoostModal] = useState(null);
  const [boostTemporalActive, setBoostTemporalActive] = useState(false);
  const [boostTemporalDies, setBoostTemporalDies] = useState('');
  const [boostTemporalMult, setBoostTemporalMult] = useState('');
  const [boostTemporalNotes, setBoostTemporalNotes] = useState('');
  const [boostSeasonalActive, setBoostSeasonalActive] = useState(false);
  const [boostSeasonalMult, setBoostSeasonalMult] = useState('');
  const [boostSeasonalNotes, setBoostSeasonalNotes] = useState('');
  const [boostLoading, setBoostLoading] = useState(false);

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
    setTokenForm({ name: '', emoji: '', ticker: '', description: '', p0: '', k: '', isTemporary: false });
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
      isTemporary: token.isTemporary || false,
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

  const fetchAdminTransactions = async (page = 1) => {
    try {
      const data = await adminAPI.getTransactions(page);
      setAdminTransactions(data.transactions || []);
      setAdminTxTotal(data.total || 0);
      setAdminTxPage(page);
    } catch (err) {
      console.error('Error carregant transaccions admin:', err);
    }
  };

  const fetchAdminRanking = async (month) => {
    setAdminRankingLoading(true);
    try {
      const [monthsData, rankData] = await Promise.all([
        rankingsAPI.getAvailableMonths().catch(() => ({ months: [] })),
        month === 'current'
          ? rankingsAPI.getCurrent().catch(() => ({ rankings: [] }))
          : rankingsAPI.getForMonth(month).catch(() => ({ rankings: [] })),
      ]);
      setAdminAvailableMonths(monthsData.months || []);
      setAdminRankings(rankData.rankings || []);
      const targetMonth = month === 'current' ? (monthsData.months?.[0] || '') : month;
      if (targetMonth) {
        const [pData, aData] = await Promise.all([
          prizesAPI.getForMonth(targetMonth).catch(() => ({ prizes: [] })),
          achievementsAPI.getForMonth(targetMonth).catch(() => ({ achievements: [] })),
        ]);
        setAdminPrizes(pData.prizes || []);
        setAdminAchievements((aData.achievements || []).slice(0, 4));
      }
    } catch (err) {
      console.error('Error carregant classificació admin:', err);
    } finally {
      setAdminRankingLoading(false);
    }
  };

  const fetchEmailHistory = async (page = 1) => {
    try {
      const data = await emailsAPI.getHistory(page);
      setEmailHistory(data.emails || []);
      setEmailHistoryPage(page);
    } catch (err) {
      console.error('Error carregant historial emails:', err);
    }
  };

  const loadPrizesForMonth = async (month) => {
    if (!month) return;
    setPrizesLoading(true);
    try {
      const data = await prizesAPI.getForMonth(month);
      const filled = Array.from({ length: 10 }, (_, i) => {
        const found = (data.prizes || []).find(p => p.position === i + 1);
        return found || { position: i + 1, prizeName: '', sponsorName: '', sponsorLink: '' };
      });
      setPrizesData(filled);
    } catch {
      setPrizesData(Array.from({ length: 10 }, (_, i) => ({ position: i + 1, prizeName: '', sponsorName: '', sponsorLink: '' })));
    } finally {
      setPrizesLoading(false);
    }
  };

  // Carregar dades quan canvia el tab actiu
  useEffect(() => {
    if (activeTab === 'classificacio') fetchAdminRanking(adminRankingMonth);
    if (activeTab === 'comunicacions') fetchEmailHistory(1);
    if (activeTab === 'historial') fetchAdminTransactions(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'classificacio') fetchAdminRanking(adminRankingMonth);
  }, [adminRankingMonth]);

  const handleApplyBoost = async (tokenId, isActive) => {
    setBoostLoading(true);
    try {
      if (!isActive) {
        await adminAPI.setBoost(tokenId, { active: false });
      } else {
        const dies = parseFloat(boostTemporalDies);
        const mult = parseFloat(boostTemporalMult);
        if (!dies || dies <= 0) { alert('Els dies han de ser un número positiu (ex: 7)'); setBoostLoading(false); return; }
        if (!mult || mult <= 0) { alert('El multiplicador ha de ser un número positiu (ex: 1.5 o 0.85)'); setBoostLoading(false); return; }
        await adminAPI.setBoost(tokenId, {
          active: true,
          boostHours: dies * 24,
          boostValue: mult,
          boostDescription: boostTemporalNotes,
        });
      }
      await fetchAll();
      setBoostModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setBoostLoading(false);
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
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'tokens', label: '🪙 Tokens' },
            { id: 'usuaris', label: '👥 Usuaris' },
            { id: 'historial', label: '📋 Historial' },
            { id: 'classificacio', label: '🏆 Classificació' },
            { id: 'premis', label: '🎁 Premis' },
            { id: 'comunicacions', label: '📧 Comunicacions' },
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
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.75fr 0.75fr 200px',
                gap: '1rem', padding: '0 1.5rem',
              }}>
                {['Token', 'Preu', 'Supply', 'P0 / k', 'Buffer', 'Holders', 'Tipus', 'Boost', 'Accions'].map((col, i) => (
                  <span key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600',
                    color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: i === 0 ? 'left' : i === 8 ? 'left' : 'center',
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
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.75fr 0.75fr 200px', gap: '1rem', alignItems: 'center' }}>

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

                    {/* Tipus */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#6B6B60', background: '#F5F5F0', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                        {token.isTemporary ? 'Temporal' : 'Permanent'}
                      </span>
                    </div>

                    {/* Boost */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                      {token.boostActive ? (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: '600', color: '#2D6A4F', background: 'rgba(45,106,79,0.1)', padding: '0.1rem 0.4rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>⚡ Temp.</span>
                      ) : (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#9B9B90', background: '#F5F5F0', padding: '0.1rem 0.4rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>⚡ —</span>
                      )}
                      {(token.seasonalMultiplier || 1) !== 1.0 ? (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: '600', color: (token.seasonalMultiplier || 1) > 1 ? '#7B4F9E' : '#C1121F', background: (token.seasonalMultiplier || 1) > 1 ? 'rgba(123,79,158,0.1)' : 'rgba(193,18,31,0.1)', padding: '0.1rem 0.4rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>📅 x{parseFloat(token.seasonalMultiplier).toFixed(2)}</span>
                      ) : (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#9B9B90', background: '#F5F5F0', padding: '0.1rem 0.4rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>📅 —</span>
                      )}
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
                      <button onClick={() => {
                        setBoostModal(token);
                        setBoostTemporalActive(token.boostActive || false);
                        setBoostTemporalDies('');
                        setBoostTemporalMult(token.boostValue ? String(token.boostValue) : '');
                        setBoostTemporalNotes('');
                        setBoostSeasonalActive((token.seasonalMultiplier || 1) !== 1.0);
                        setBoostSeasonalMult(token.seasonalMultiplier ? String(token.seasonalMultiplier) : '');
                        setBoostSeasonalNotes('');
                      }} style={{
                        background: token.boostActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                        color: '#C9A84C',
                        padding: '0.35rem 0.75rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '500',
                        border: '1.5px solid #C9A84C', borderRadius: '50px', cursor: 'pointer',
                      }}>
                        ⚡ Boost
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Propostes de tokens */}
            <div style={{ marginTop: '2.5rem', borderTop: '1px solid #E8E8E0', paddingTop: '2rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem' }}>
                Propostes de tokens
              </h3>

              {/* Propostes PENDENTS */}
              {proposals.pending.length > 0 && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '2px solid #C9A84C', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(201, 168, 76, 0.1)', padding: '1rem 1.5rem', borderBottom: '1px solid #C9A84C' }}>
                    <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600', color: '#C9A84C', margin: 0 }}>
                      ⏳ Pendents de revisió ({proposals.pending.length})
                    </h4>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {proposals.pending.map(prop => (
                      <div key={prop.id} style={{ border: '1px solid #E8E8E0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                          <span style={{ fontSize: '3rem' }}>{prop.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem' }}>
                              {prop.name} <span style={{ color: '#C9A84C' }}>({prop.ticker})</span>
                            </div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#6B6B60', marginBottom: '1rem', lineHeight: 1.6 }}>
                              {prop.description}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                              <div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', marginBottom: '0.25rem' }}>Proposat per</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>{prop.proposer?.name}</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#9B9B90' }}>{prop.proposer?.email}</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', marginBottom: '0.25rem' }}>Data proposta</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>{new Date(prop.createdAt).toLocaleDateString('ca-ES')}</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', marginBottom: '0.25rem' }}>ID Proposta</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>#{prop.id}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button
                                onClick={() => { setAcceptModal(prop); setAcceptForm({ p0: '', k: '' }); setAcceptError(''); }}
                                style={{ background: '#2D6A4F', color: '#FAFAF8', padding: '0.75rem 1.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', border: '2px solid #2D6A4F', borderRadius: '50px', cursor: 'pointer' }}
                              >
                                ✅ Acceptar i crear token
                              </button>
                              <button
                                onClick={async () => { if (confirm(`Segur que vols refusar "${prop.name}"?`)) { try { await adminAPI.rejectProposal(prop.id); await fetchProposals(); } catch (err) { alert(err.message); } } }}
                                style={{ background: 'transparent', color: '#C1121F', padding: '0.75rem 1.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', border: '2px solid #C1121F', borderRadius: '50px', cursor: 'pointer' }}
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
                <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
                  <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600', color: '#6B6B60', marginBottom: '1rem' }}>
                    Historial de propostes
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {proposals.accepted.map(prop => (
                      <div key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #E8E8E0', borderRadius: '8px', background: 'rgba(45, 106, 79, 0.05)' }}>
                        <span style={{ fontSize: '2rem' }}>{prop.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600', color: '#0A0A0A' }}>{prop.name} ({prop.ticker})</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60' }}>
                            Per {prop.proposer?.name || prop.proposer?.email || '—'} · Revisat per {prop.reviewer?.name || '—'}{prop.reviewedAt ? ` el ${new Date(prop.reviewedAt).toLocaleDateString('ca-ES')}` : ''}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(45, 106, 79, 0.1)', color: '#2D6A4F', padding: '0.4rem 1rem', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600' }}>✅ Acceptada</div>
                      </div>
                    ))}
                    {proposals.rejected.map(prop => (
                      <div key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #E8E8E0', borderRadius: '8px', background: '#F5F5F0', opacity: 0.7 }}>
                        <span style={{ fontSize: '2rem', filter: 'grayscale(1)' }}>{prop.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600', color: '#6B6B60' }}>{prop.name} ({prop.ticker})</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#9B9B90' }}>
                            Per {prop.proposer?.name || prop.proposer?.email || '—'} · Refusada per {prop.reviewer?.name || '—'}{prop.reviewedAt ? ` el ${new Date(prop.reviewedAt).toLocaleDateString('ca-ES')}` : ''}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(193, 18, 31, 0.1)', color: '#C1121F', padding: '0.4rem 1rem', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600' }}>❌ Refusada</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proposals.pending.length === 0 && proposals.accepted.length === 0 && proposals.rejected.length === 0 && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#9B9B90' }}>No hi ha propostes encara</div>
                </div>
              )}
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

        {/* TAB: HISTORIAL */}
        {activeTab === 'historial' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #F5F5F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>Historial de transaccions</h2>
            </div>
            {adminTransactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>Sense transaccions</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr 1fr', padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0' }}>
                  {['Data', 'Usuari', 'Token', 'Tipus', 'Import'].map((col, i) => (
                    <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col}</span>
                  ))}
                </div>
                {adminTransactions.map((tx, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr 1fr', padding: '0.875rem 1.5rem', borderBottom: i < adminTransactions.length - 1 ? '1px solid #F5F5F0' : 'none', alignItems: 'center' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#9B9B90' }}>{new Date(tx.createdAt).toLocaleDateString('ca-ES')}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A' }}>{tx.user?.name || tx.user?.email || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{tx.product?.emoji}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A' }}>{tx.product?.name}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '600', color: tx.type === 'BUY' ? '#2D6A4F' : '#C1121F', background: tx.type === 'BUY' ? 'rgba(45,106,79,0.08)' : 'rgba(193,18,31,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                        {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#0A0A0A' }}>
                      {tx.type === 'BUY' ? `${parseFloat(tx.amountEUR || 0).toFixed(2)}€` : `+${parseFloat(tx.eurRecovered || 0).toFixed(2)}€`}
                    </div>
                  </div>
                ))}
                {adminTxTotal > 20 && (
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #F5F5F0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => fetchAdminTransactions(adminTxPage - 1)} disabled={adminTxPage === 1} style={{ padding: '0.4rem 0.8rem', background: adminTxPage === 1 ? '#F5F5F0' : '#FFFFFF', color: adminTxPage === 1 ? '#9B9B90' : '#0A0A0A', border: '1.5px solid #E8E8E0', borderRadius: '8px', cursor: adminTxPage === 1 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>Anterior</button>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>Pàgina {adminTxPage} de {Math.ceil(adminTxTotal / 20)}</span>
                    <button onClick={() => fetchAdminTransactions(adminTxPage + 1)} disabled={adminTxPage >= Math.ceil(adminTxTotal / 20)} style={{ padding: '0.4rem 0.8rem', background: adminTxPage >= Math.ceil(adminTxTotal / 20) ? '#F5F5F0' : '#FFFFFF', color: adminTxPage >= Math.ceil(adminTxTotal / 20) ? '#9B9B90' : '#0A0A0A', border: '1.5px solid #E8E8E0', borderRadius: '8px', cursor: adminTxPage >= Math.ceil(adminTxTotal / 20) ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>Següent</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: CLASSIFICACIÓ (admin) */}
        {activeTab === 'classificacio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminRankingMonth('current')} style={{ background: adminRankingMonth === 'current' ? '#0A0A0A' : '#FFFFFF', color: adminRankingMonth === 'current' ? '#FAFAF8' : '#6B6B60', padding: '0.5rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: '500', border: '1.5px solid', borderColor: adminRankingMonth === 'current' ? '#0A0A0A' : '#E8E8E0', borderRadius: '50px', cursor: 'pointer' }}>Mes actual</button>
              {adminAvailableMonths.map(m => (
                <button key={m} onClick={() => setAdminRankingMonth(m)} style={{ background: adminRankingMonth === m ? '#0A0A0A' : '#FFFFFF', color: adminRankingMonth === m ? '#FAFAF8' : '#6B6B60', padding: '0.5rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: '500', border: '1.5px solid', borderColor: adminRankingMonth === m ? '#0A0A0A' : '#E8E8E0', borderRadius: '50px', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {new Date(m + '-01').toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}
                </button>
              ))}
            </div>
            {adminRankingLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>Carregant...</div>
            ) : (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1fr 1fr 1fr 1fr', padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0', minWidth: '600px' }}>
                  {['#', 'Jugador', 'Tokens', 'Invertit', 'Valor', 'Guany%'].map((col, i) => (
                    <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i > 1 ? 'right' : 'left', display: 'block' }}>{col}</span>
                  ))}
                </div>
                {adminRankings.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>Sense dades</div>
                ) : adminRankings.map((entry, i) => (
                  <div key={entry.userId} style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1fr 1fr 1fr 1fr', padding: '0.875rem 1.5rem', borderBottom: i < adminRankings.length - 1 ? '1px solid #F5F5F0' : 'none', alignItems: 'center', minWidth: '600px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: entry.position <= 3 ? '#C9A84C' : '#6B6B60' }}>{entry.position <= 3 ? ['🥇','🥈','🥉'][entry.position-1] : `#${entry.position}`}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>{entry.username}</div>
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>{(entry.tokensOwned || []).slice(0, 4).map((t, j) => <span key={j} style={{ fontSize: '0.9rem' }}>{t.split(' ')[0]}</span>)}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A', textAlign: 'right' }}>{parseFloat(entry.investedValue || 0).toFixed(2)}€</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#0A0A0A', textAlign: 'right' }}>{parseFloat(entry.totalValue || 0).toFixed(2)}€</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: (entry.gainPercent || 0) >= 0 ? '#2D6A4F' : '#C1121F', textAlign: 'right' }}>{(entry.gainPercent || 0) >= 0 ? '+' : ''}{parseFloat(entry.gainPercent || 0).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PREMIS */}
        {activeTab === 'premis' && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Mes (AAAA-MM)</label>
                <input type="month" value={prizesMonth} onChange={e => setPrizesMonth(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
              </div>
              <button onClick={() => loadPrizesForMonth(prizesMonth)} disabled={!prizesMonth || prizesLoading} style={{ padding: '0.6rem 1.5rem', background: prizesMonth ? '#C9A84C' : '#E8E8E0', color: prizesMonth ? '#0A0A0A' : '#9B9B90', border: 'none', borderRadius: '8px', cursor: prizesMonth ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '0.9rem' }}>
                {prizesLoading ? 'Carregant...' : 'Carregar'}
              </button>
              <button
                disabled={!prizesMonth || prizesLoading}
                onClick={async () => {
                  if (!prizesMonth) return;
                  setPrizesLoading(true);
                  try {
                    const emptyPrizes = Array.from({ length: 10 }, (_, i) => ({ position: i + 1, prizeName: '', sponsorName: '', sponsorLink: '' }));
                    await prizesAPI.setForMonth(prizesMonth, emptyPrizes);
                    setPrizesData(emptyPrizes);
                    setEditingPrize(null);
                  } catch (err) { alert(err.message); }
                  finally { setPrizesLoading(false); }
                }}
                style={{ padding: '0.6rem 1.5rem', background: prizesMonth ? '#0A0A0A' : '#E8E8E0', color: prizesMonth ? '#FAFAF8' : '#9B9B90', border: 'none', borderRadius: '8px', cursor: prizesMonth ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '0.9rem' }}
              >
                + Crear mes nou
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {prizesData.map((prize, idx) => (
                <div key={prize.position} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '900', color: prize.position <= 3 ? '#C9A84C' : '#9B9B90' }}>#{prize.position}</span>
                    {editingPrize !== idx ? (
                      <button onClick={() => { setEditingPrize(idx); setPrizeEditForm({ prizeName: prize.prizeName || '', sponsorName: prize.sponsorName || '', sponsorLink: prize.sponsorLink || '' }); }} style={{ background: 'transparent', border: '1px solid #E8E8E0', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60' }}>
                        Editar
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={async () => {
                          try {
                            await prizesAPI.update(prizesMonth, prize.position, prizeEditForm);
                            const updated = [...prizesData];
                            updated[idx] = { ...prize, ...prizeEditForm };
                            setPrizesData(updated);
                            setEditingPrize(null);
                          } catch (err) { alert(err.message); }
                        }} style={{ background: '#2D6A4F', color: '#FAFAF8', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem' }}>Guardar</button>
                        <button onClick={() => setEditingPrize(null)} style={{ background: 'transparent', border: '1px solid #E8E8E0', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60' }}>Cancel·lar</button>
                      </div>
                    )}
                  </div>
                  {editingPrize === idx ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input value={prizeEditForm.prizeName} onChange={e => setPrizeEditForm({ ...prizeEditForm, prizeName: e.target.value })} placeholder="Nom del premi" style={inputStyle} />
                      <input value={prizeEditForm.sponsorName} onChange={e => setPrizeEditForm({ ...prizeEditForm, sponsorName: e.target.value })} placeholder="Nom del patrocinador" style={inputStyle} />
                      <input value={prizeEditForm.sponsorLink} onChange={e => setPrizeEditForm({ ...prizeEditForm, sponsorLink: e.target.value })} placeholder="https://..." style={inputStyle} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: prize.prizeName ? '#0A0A0A' : '#D0D0C8' }}>{prize.prizeName || '— Sense premi —'}</div>
                      {prize.sponsorName && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#C9A84C' }}>{prize.sponsorName}</div>}
                      {prize.sponsorLink && <a href={prize.sponsorLink} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#9B9B90', textDecoration: 'none' }}>{prize.sponsorLink}</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: COMUNICACIONS */}
        {activeTab === 'comunicacions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>Comunicacions</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Card: Guanyadors */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.75rem' }}>🏆 Emails guanyadors</h4>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Mes (AAAA-MM)</label>
                  <input type="month" value={winnersMonth} onChange={e => setWinnersMonth(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <button disabled={!winnersMonth || emailSending === 'winners'} onClick={async () => {
                  setEmailSending('winners'); setEmailMsg({});
                  try { const r = await emailsAPI.sendWinners(winnersMonth); setEmailMsg({ winners: `✅ ${r.count || 0} emails enviats` }); fetchEmailHistory(1); }
                  catch (err) { setEmailMsg({ winners: `❌ ${err.message}` }); }
                  finally { setEmailSending(''); }
                }} style={{ width: '100%', background: winnersMonth ? '#C9A84C' : '#E8E8E0', color: winnersMonth ? '#0A0A0A' : '#9B9B90', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: winnersMonth ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: '600' }}>
                  {emailSending === 'winners' ? 'Enviant...' : 'Enviar emails guanyadors'}
                </button>
                {emailMsg.winners && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', marginTop: '0.5rem', color: emailMsg.winners.startsWith('✅') ? '#2D6A4F' : '#C1121F' }}>{emailMsg.winners}</p>}
              </div>

              {/* Card: Setmanal */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.75rem' }}>📊 Email setmanal</h4>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60', marginBottom: '0.75rem', lineHeight: 1.5 }}>Envia l&apos;email de resum setmanal a tots els usuaris actius.</p>
                <button disabled={emailSending === 'weekly'} onClick={async () => {
                  setEmailSending('weekly'); setEmailMsg({});
                  try { const r = await emailsAPI.sendWeekly(); setEmailMsg({ weekly: `✅ ${r.count || 0} emails enviats` }); fetchEmailHistory(1); }
                  catch (err) { setEmailMsg({ weekly: `❌ ${err.message}` }); }
                  finally { setEmailSending(''); }
                }} style={{ width: '100%', background: '#C9A84C', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: '600' }}>
                  {emailSending === 'weekly' ? 'Enviant...' : 'Enviar email setmanal'}
                </button>
                {emailMsg.weekly && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', marginTop: '0.5rem', color: emailMsg.weekly.startsWith('✅') ? '#2D6A4F' : '#C1121F' }}>{emailMsg.weekly}</p>}
              </div>

              {/* Card: Personalitzat */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.75rem' }}>✉️ Email personalitzat</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <textarea value={customRecipients} onChange={e => setCustomRecipients(e.target.value)} placeholder="un@email.com&#10;altre@email.com" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Assumpte" style={inputStyle} />
                  <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} placeholder="Cos del missatge..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <button disabled={!customRecipients || !customSubject || !customBody || emailSending === 'custom'} onClick={async () => {
                  const recipients = customRecipients.split('\n').map(s => s.trim()).filter(Boolean);
                  setEmailSending('custom'); setEmailMsg({});
                  try { const r = await emailsAPI.sendCustom(recipients, customSubject, customBody); setEmailMsg({ custom: `✅ ${r.count || 0} emails enviats` }); fetchEmailHistory(1); }
                  catch (err) { setEmailMsg({ custom: `❌ ${err.message}` }); }
                  finally { setEmailSending(''); }
                }} style={{ width: '100%', background: customRecipients && customSubject && customBody ? '#C9A84C' : '#E8E8E0', color: customRecipients && customSubject && customBody ? '#0A0A0A' : '#9B9B90', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: customRecipients && customSubject && customBody ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: '600' }}>
                  {emailSending === 'custom' ? 'Enviant...' : 'Enviar'}
                </button>
                {emailMsg.custom && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', marginTop: '0.5rem', color: emailMsg.custom.startsWith('✅') ? '#2D6A4F' : '#C1121F' }}>{emailMsg.custom}</p>}
              </div>
            </div>

            {/* Historial enviaments */}
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', marginBottom: '1rem' }}>Historial d&apos;enviaments</h3>
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
                {emailHistory.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9B9B90', fontFamily: "'DM Sans', sans-serif" }}>Sense enviaments</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 2fr 100px', padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0' }}>
                      {['Data', 'Tipus', '#', 'Assumpte', ''].map((col, i) => (
                        <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col}</span>
                      ))}
                    </div>
                    {emailHistory.map((email, i) => (
                      <div key={email.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 2fr 100px', padding: '0.875rem 1.5rem', borderBottom: i < emailHistory.length - 1 ? '1px solid #F5F5F0' : 'none', alignItems: 'center' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#9B9B90' }}>{new Date(email.sentAt).toLocaleDateString('ca-ES')}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A' }}>{email.emailType}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>{email.recipientsCount}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.subject}</div>
                        <div>
                          <button onClick={() => setEmailViewModal(email)} style={{ background: 'transparent', border: '1px solid #E8E8E0', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B6B60' }}>Veure</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
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

              {/* Tipus de token */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F8F4', borderRadius: '10px', padding: '0.875rem 1rem', border: '1px solid #E8E8E0' }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#0A0A0A' }}>
                    {tokenForm.isTemporary ? '⏳ Token Temporal' : '♾️ Token Permanent'}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90', marginTop: '0.15rem' }}>
                    {tokenForm.isTemporary
                      ? 'Té data de caducitat — es pot retirar del mercat'
                      : 'Sempre disponible al mercat sense data de fi'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTokenForm({ ...tokenForm, isTemporary: !tokenForm.isTemporary })}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
                    background: tokenForm.isTemporary ? '#C9A84C' : '#D0D0C8',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: tokenForm.isTemporary ? '24px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#FFFFFF', transition: 'left 0.2s', display: 'block',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
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

      {/* MODAL: Veure email */}
      {emailViewModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setEmailViewModal(null); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '600px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                Detall de l&apos;enviament
              </h3>
              <button onClick={() => setEmailViewModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B6B60', padding: '0.25rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem 1rem', alignItems: 'start' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '0.1rem' }}>Data</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>{new Date(emailViewModal.sentAt).toLocaleString('ca-ES')}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '0.1rem' }}>Tipus</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>{emailViewModal.emailType}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '0.1rem' }}>Destinataris</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>{emailViewModal.recipientsCount} usuaris</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '0.1rem' }}>Assumpte</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>{emailViewModal.subject}</span>
              </div>
              {emailViewModal.body && (
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600', color: '#9B9B90', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Cos del missatge</div>
                  <div style={{ background: '#F8F8F4', borderRadius: '8px', border: '1px solid #E8E8E0', padding: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#3A3A32', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {emailViewModal.body}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Control de Boosts */}
      {boostModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setBoostModal(null); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                {boostModal.emoji} {boostModal.name} — Boosts
              </h3>
              <button onClick={() => setBoostModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B6B60', padding: '0.25rem' }}>✕</button>
            </div>

            {/* Boost Temporal */}
            <div style={{ background: '#F8F8F4', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: '1px solid #E8E8E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>⚡ Boost Temporal</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60' }}>{boostTemporalActive ? 'Actiu' : 'Inactiu'}</span>
                  <button onClick={() => setBoostTemporalActive(!boostTemporalActive)} style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: boostTemporalActive ? '#C9A84C' : '#D0D0C8',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', top: '3px', left: boostTemporalActive ? '22px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#FFFFFF', transition: 'left 0.2s', display: 'block',
                    }} />
                  </button>
                </div>
              </div>
              {boostModal.boostExpiresAt && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#C9A84C', margin: '0 0 0.75rem' }}>
                  Expira: {new Date(boostModal.boostExpiresAt).toLocaleDateString('ca-ES')}
                </p>
              )}
              {boostTemporalActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={labelStyle}>Dies</label>
                      <input type="number" min="0.1" step="0.5" value={boostTemporalDies} onChange={e => setBoostTemporalDies(e.target.value)} placeholder="7" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Multiplicador</label>
                      <input type="number" min="0.01" step="0.05" value={boostTemporalMult} onChange={e => setBoostTemporalMult(e.target.value)} placeholder="1.5" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Notes (opcional)</label>
                    <input value={boostTemporalNotes} onChange={e => setBoostTemporalNotes(e.target.value)} placeholder="Motiu del boost..." style={inputStyle} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {boostTemporalActive && (
                  <button
                    onClick={() => handleApplyBoost(boostModal.id, true)}
                    disabled={boostLoading || !boostTemporalDies || !boostTemporalMult}
                    style={{
                      flex: 1, background: boostLoading || !boostTemporalDies || !boostTemporalMult ? '#E8E8E0' : '#C9A84C',
                      color: boostLoading || !boostTemporalDies || !boostTemporalMult ? '#9B9B90' : '#0A0A0A',
                      border: 'none', borderRadius: '8px', padding: '0.6rem 1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: '600',
                      cursor: boostLoading || !boostTemporalDies || !boostTemporalMult ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {boostLoading ? 'Aplicant...' : 'Aplicar boost'}
                  </button>
                )}
                {boostModal.boostActive && (
                  <button
                    onClick={() => handleApplyBoost(boostModal.id, false)}
                    disabled={boostLoading}
                    style={{
                      flex: 1, background: 'rgba(193,18,31,0.08)', color: '#C1121F',
                      border: '1.5px solid #C1121F', borderRadius: '8px', padding: '0.6rem 1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: '600',
                      cursor: boostLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>

            {/* Boost Estacional */}
            <div style={{ background: '#F8F8F4', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E8E8E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>📅 Boost Estacional</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B6B60' }}>{boostSeasonalActive ? 'Actiu' : 'Inactiu'}</span>
                  <button onClick={() => setBoostSeasonalActive(!boostSeasonalActive)} style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: boostSeasonalActive ? '#C9A84C' : '#D0D0C8',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', top: '3px', left: boostSeasonalActive ? '22px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#FFFFFF', transition: 'left 0.2s', display: 'block',
                    }} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Multiplicador</label>
                  <input type="number" min="0.01" step="0.05" value={boostSeasonalMult} onChange={e => setBoostSeasonalMult(e.target.value)} placeholder="1.5" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Notes (opcional)</label>
                  <input value={boostSeasonalNotes} onChange={e => setBoostSeasonalNotes(e.target.value)} placeholder="Temporada de Nadal..." style={inputStyle} />
                </div>
              </div>
              <button onClick={async () => {
                const mult = boostSeasonalActive ? parseFloat(boostSeasonalMult) : 1.0;
                if (boostSeasonalActive && (!mult || mult <= 0)) { alert('El multiplicador ha de ser un número positiu (ex: 1.5 o 0.85)'); return; }
                setBoostLoading(true);
                try {
                  await adminAPI.setSeasonalBoost(boostModal.id, mult, boostSeasonalNotes);
                  await fetchAll();
                  setBoostModal(null);
                } catch (err) { alert(err.message); }
                finally { setBoostLoading(false); }
              }} disabled={boostLoading} style={{
                width: '100%', background: boostLoading ? '#E8E8E0' : '#0A0A0A',
                color: boostLoading ? '#9B9B90' : '#FAFAF8',
                border: 'none', borderRadius: '8px', padding: '0.6rem 1rem',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: '600',
                cursor: boostLoading ? 'not-allowed' : 'pointer',
              }}>
                {boostLoading ? 'Guardant...' : 'Guardar boost estacional'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
