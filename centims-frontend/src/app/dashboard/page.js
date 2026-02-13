'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { productsAPI, portfolioAPI, transactionsAPI, proposalsAPI } from '@/lib/api';

const SELL_SPREAD = 0.015;

// Component tooltip
function Tooltip({ text, children }) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const ref = React.useRef(null);
  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
  };
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'fixed',
          top: `${pos.top}px`, left: `${pos.left}px`,
          transform: 'translate(-50%, -100%)',
          background: '#1A1A1A', color: '#FAFAF8',
          padding: '0.5rem 0.75rem', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '400',
          zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          lineHeight: '1.5', maxWidth: '220px', whiteSpace: 'normal', textAlign: 'center',
          pointerEvents: 'none',
        }}>
          {text}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #1A1A1A',
          }} />
        </span>
      )}
    </span>
  );
}


// Component sparkline (mini gràfica)
function Sparkline({ history, up }) {
  if (!history || history.length < 2) return <div style={{ width: '80px', height: '36px' }} />;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.001;
  const w = 130;
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
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refreshUser } = useAuth();

  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cartera');
  
  // Propostes
  const [proposals, setProposals] = useState([]);
  const [proposalForm, setProposalForm] = useState({ name: '', emoji: '🎯', ticker: '', description: '' });
  const [proposalError, setProposalError] = useState('');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  const [modal, setModal] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');

  useEffect(() => {
    // Esperar que l'AuthContext acabi de llegir el localStorage
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioData, productsData, txData, balanceData] = await Promise.all([
        portfolioAPI.get(),
        productsAPI.getAll(),
        transactionsAPI.getHistory(1, 20),
        portfolioAPI.getBalance(),
      ]);
      
      // Carregar propostes (no bloqueja)
      fetchProposals();
      setPortfolio(portfolioData.portfolio || []);
      setSummary(portfolioData.summary || {});
      setProducts(productsData.products || []);
      setTransactions(txData.transactions || []);
      setTxTotal(txData.total || 0);
      setBalance(balanceData.balanceEUR || 0);
    } catch (err) {
      console.error('Error carregant dades:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page) => {
    try {
      const txData = await transactionsAPI.getHistory(page, 20);
      setTransactions(txData.transactions || []);
      setTxPage(page);
      setTxTotal(txData.total || 0);
    } catch (err) {
      console.error('Error carregant transaccions:', err);
    }
  };

  const fetchProposals = async () => {
    try {
      const data = await proposalsAPI.getMine();
      setProposals(data.proposals || []);
    } catch (err) {
      console.error('Error carregant propostes:', err);
    }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  const handleBuy = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      setTradeError('Introdueix un import valid');
      return;
    }
    setTradeLoading(true);
    setTradeError('');
    setTradeSuccess('');
    try {
      const result = await transactionsAPI.buy(modal.product.id, parseFloat(tradeAmount));
      const fraccionesObtingudes = result?.transaction?.userFractions;
      setTradeSuccess(`Compra realitzada! Has obtingut ${parseFloat(fraccionesObtingudes || 0).toFixed(2)} fraccions`);
      await fetchData();
      await refreshUser();
      setTimeout(() => { setModal(null); setTradeAmount(''); setDisplayAmount(''); setTradeSuccess(''); }, 1000);
    } catch (err) {
      setTradeError(err.message || 'Error en la compra');
    } finally {
      setTradeLoading(false);
    }
  };

  const handleSell = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      setTradeError('Introdueix un nombre de fraccions valid');
      return;
    }
    setTradeLoading(true);
    setTradeError('');
    setTradeSuccess('');
    try {
      const result = await transactionsAPI.sell(modal.product.id, parseFloat(tradeAmount));
      setTradeSuccess(`Venda realitzada! Has recuperat ${parseFloat(result.transaction.eurRecovered).toFixed(2)}€`);
      await fetchData();
      await refreshUser();
      setTimeout(() => { setModal(null); setTradeAmount(''); setDisplayAmount(''); setTradeSuccess(''); }, 1000);
    } catch (err) {
      setTradeError(err.message || 'Error en la venda');
    } finally {
      setTradeLoading(false);
    }
  };

  const openModal = (type, product, position = null) => {
    setModal({ type, product, position });
    setTradeAmount('');
    setTradeError('');
    setTradeSuccess('');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6B60' }}>Carregant...</div>
      </div>
    );
  }

  const totalInvested = summary?.totalInvested || 0;
  const totalValue = summary?.totalLiquidationValue || 0;
  const totalPnL = summary?.totalProfit || 0;
  const totalPnLPct = summary?.totalProfitPercent || 0;

  // Botons rapids compra
  const quickBuyAmounts = [5, 10, 25, 50];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0' }}>

      {/* NAVBAR */}
      <nav style={{
        background: '#FFFFFF', borderBottom: '1px solid #E8E8E0',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <Link href="/" style={{
          fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: '900',
          color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em',
        }}>Centims</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: '#F5F5F0', borderRadius: '50px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem' }}>💶</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
              {parseFloat(balance).toFixed(2)}€
            </span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>{user?.name}</div>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" style={{
              background: '#C9A84C', color: '#0A0A0A', padding: '0.4rem 0.875rem',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '600',
              border: '1.5px solid #C9A84C', borderRadius: '50px', textDecoration: 'none',
            }}>Panell Admin</Link>
          )}
          <button onClick={handleLogout} style={{
            background: 'transparent', color: '#9B9B90', padding: '0.4rem 0.875rem',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
            border: '1px solid #E8E8E0', borderRadius: '50px', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#0A0A0A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E0'; e.currentTarget.style.color = '#9B9B90'; }}
          >Sortir</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        {/* RESUM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Saldo disponible', value: `${parseFloat(balance).toFixed(2)}€`, icon: '💶', color: '#0A0A0A', tooltip: null },
            { label: 'Valor spot', value: `${parseFloat(totalValue).toFixed(2)}€`, icon: '📊', color: '#0A0A0A', tooltip: 'Fraccions × preu actual. Estimació si el mercat no mogués.' },
            { label: 'Valor liquidació', value: `${(parseFloat(totalValue) * (1 - SELL_SPREAD)).toFixed(2)}€`, icon: '💵', color: '#0A0A0A', tooltip: 'El que rebries si venessis ara, comptant que el preu baixa amb cada fracció venuda i descomptant el spread (1.5%).' },
            { label: 'Invertit', value: `${parseFloat(totalInvested).toFixed(2)}€`, icon: '💰', color: '#0A0A0A', tooltip: null },
            {
              label: 'Guany / Pèrdua',
              value: `${totalPnL >= 0 ? '+' : ''}${parseFloat(totalPnL).toFixed(2)}€ (${parseFloat(totalPnLPct).toFixed(1)}%)`,
              icon: totalPnL >= 0 ? '📈' : '📉',
              color: totalPnL >= 0 ? '#2D6A4F' : '#C1121F',
              tooltip: null,
            },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #E8E8E0' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#9B9B90', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {stat.label}
                {stat.tooltip && (
                  <Tooltip text={stat.tooltip}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#E8E8E0', color: '#6B6B60', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', fontFamily: 'serif', fontWeight: '700' }}>i</span>
                  </Tooltip>
                )}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'cartera', label: 'La meva cartera' }, 
            { id: 'mercat', label: 'Mercat' }, 
            { id: 'crea', label: 'Crea el teu token' },
            { id: 'historial', label: 'Historial' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? '#0A0A0A' : 'transparent',
              color: activeTab === tab.id ? '#FAFAF8' : '#6B6B60',
              padding: '0.6rem 1.5rem',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '500',
              border: '1.5px solid', borderColor: activeTab === tab.id ? '#0A0A0A' : '#E8E8E0',
              borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* TAB: CARTERA */}
        {activeTab === 'cartera' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'visible' }}>
            {!portfolio || portfolio.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪙</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6B60', marginBottom: '1.5rem' }}>Encara no tens cap token. Compra el teu primer!</p>
                <button onClick={() => setActiveTab('mercat')} style={{ background: '#C9A84C', color: '#0A0A0A', padding: '0.75rem 2rem', fontFamily: "'DM Sans', sans-serif", fontWeight: '500', border: 'none', borderRadius: '50px', cursor: 'pointer' }}>
                  Anar al mercat
                </button>
              </div>
            ) : (
              <>
                {/* Capçalera */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.9fr 0.9fr 1.2fr',
                  padding: '0.875rem 1.5rem',
                  background: '#F8F8F4', borderBottom: '1px solid #E8E8E0',
                  minWidth: '900px',
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left' }}>Token</span>
                  {['Fraccions', 'Preu origen', 'Preu actual'].map((col, i) => (
                    <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', display: 'block' }}>{col}</span>
                  ))}
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}>
                    Valor spot
                    <Tooltip text="Fraccions × preu actual. Estimació si el mercat no mogués.">
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#E8E8E0', color: '#6B6B60', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', fontStyle: 'normal', fontFamily: 'serif', fontWeight: '700' }}>i</span>
                    </Tooltip>
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}>
                    Valor liquidació
                    <Tooltip text="El que rebries si venessis ara, comptant que el preu baixa amb cada fracció venuda i descomptant el spread (1.5%).">
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#E8E8E0', color: '#6B6B60', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', fontStyle: 'normal', fontFamily: 'serif', fontWeight: '700' }}>i</span>
                    </Tooltip>
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', display: 'block' }}>Accions</span>
                </div>

                {portfolio.filter(pos => parseFloat(pos.fractions) > 0).map((pos, i) => {
                  const liquidationNet = parseFloat(pos.liquidationValue) * (1 - SELL_SPREAD);
                  const pnlNet = liquidationNet - parseFloat(pos.investedEUR);
                  const pnlNetPct = parseFloat(pos.investedEUR) > 0 ? (pnlNet / parseFloat(pos.investedEUR)) * 100 : 0;

                  return (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.9fr 0.9fr 1.2fr',
                      padding: '1rem 1.5rem',
                      borderBottom: i < portfolio.length - 1 ? '1px solid #F5F5F0' : 'none',
                      alignItems: 'center',
                      minWidth: '900px',
                    }}>
                      {/* Token */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{pos.productEmoji}</span>
                        <div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>{pos.productName}</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: pnlNet >= 0 ? '#2D6A4F' : '#C1121F', fontWeight: '600' }}>
                            {pnlNet >= 0 ? '+' : ''}{pnlNet.toFixed(2)}€ ({pnlNetPct.toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      {/* Fraccions */}
                      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>
                        {parseFloat(pos.fractions).toFixed(2)}
                      </div>

                      {/* Preu origen */}
                      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60' }}>
                        {parseFloat(pos.avgPrice).toFixed(2)}€
                      </div>

                      {/* Preu actual */}
                      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>
                        {parseFloat(pos.currentPrice).toFixed(2)}€
                      </div>

                      {/* Valor spot */}
                      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#0A0A0A' }}>
                        {parseFloat(pos.spotValue || pos.liquidationValue).toFixed(2)}€
                      </div>

                      {/* Valor liquidació - sense text spread */}
                      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
                        {liquidationNet.toFixed(2)}€
                      </div>

                      {/* Accions */}
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button onClick={() => {
                          const product = products.find(p => p.id === pos.productId);
                          if (product) openModal('buy', product, pos);
                        }} style={{
                          background: '#C9A84C', color: '#0A0A0A',
                          padding: '0.3rem 0.75rem',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '600',
                          border: '1.5px solid #C9A84C', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                        >Comprar</button>
                        <button onClick={() => {
                          const product = products.find(p => p.id === pos.productId);
                          if (product) openModal('sell', product, pos);
                        }} style={{
                          background: 'transparent', color: '#C1121F',
                          padding: '0.3rem 0.75rem',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: '500',
                          border: '1.5px solid #C1121F', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#C1121F'; e.currentTarget.style.color = '#FAFAF8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C1121F'; }}
                        >Vendre</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* TAB: MERCAT */}
        {activeTab === 'mercat' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px 180px',
              padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0',
            }}>
              {['Token', 'Preu', 'Variació 24h', 'Gràf. 7 dies', 'Accions'].map((col, i) => (
                <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'center' }}>{col}</span>
              ))}
            </div>
            {products.map((product, i) => {
              const up = parseFloat(product.changePercent24h) >= 0;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px 180px',
                  padding: '1rem 1.5rem',
                  borderBottom: i < products.length - 1 ? '1px solid #F5F5F0' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{product.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>{product.name}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#9B9B90' }}>{product.ticker}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>
                    {parseFloat(product.currentPrice).toFixed(2)}€
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '600',
                      color: up ? '#2D6A4F' : '#C1121F',
                      background: up ? 'rgba(45,106,79,0.08)' : 'rgba(193,18,31,0.08)',
                      padding: '0.2rem 0.6rem', borderRadius: '20px',
                    }}>
                      {up ? '+' : ''}{parseFloat(product.changePercent24h).toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Sparkline */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Sparkline history={product.priceHistory || []} up={up} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                    <button onClick={() => router.push(`/token/${product.id}`)} style={{
                      background: 'transparent', color: '#0A0A0A',
                      padding: '0.4rem 0.75rem',
                      minWidth: '70px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '500',
                      border: '1.5px solid #0A0A0A', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0A0A0A'; }}
                    >Detalls</button>
                    <button onClick={() => {
                      const pos = portfolio.find(p => p.productId === product.id);
                      openModal('buy', product, pos);
                    }} style={{
                      background: '#C9A84C', color: '#0A0A0A', padding: '0.4rem 1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: '600',
                      border: '1.5px solid #C9A84C', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                    >Comprar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: CREA EL TEU TOKEN */}
        {activeTab === 'crea' && (
          <div>
            {/* Formulari crear proposta */}
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '2rem', marginBottom: '2rem',
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem',
              }}>
                Proposa el teu token
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                color: '#6B6B60', marginBottom: '2rem',
              }}>
                Omple el formulari per proposar un nou token. L'equip el revisarà i activarà si s'aprova. Rebràs 10 fraccions gratis!
              </p>

              {proposalError && (
                <div style={{
                  background: 'rgba(193, 18, 31, 0.1)', color: '#C1121F',
                  padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                }}>
                  {proposalError}
                </div>
              )}

              {proposalSuccess && (
                <div style={{
                  background: 'rgba(45, 106, 79, 0.1)', color: '#2D6A4F',
                  padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                }}>
                  {proposalSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Emoji picker */}
                <div>
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                    color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                  }}>
                    Emoji
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      type="button"
                      style={{
                        width: '100%', padding: '0.875rem 1rem',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '2rem',
                        color: '#0A0A0A', background: '#FAFAF8',
                        border: '1.5px solid #E8E8E0', borderRadius: '10px',
                        outline: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {proposalForm.emoji}
                    </button>
                    {showEmojiPicker && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, zIndex: 100,
                        background: '#FFFFFF', border: '1px solid #E8E8E0',
                        borderRadius: '10px', padding: '1rem', marginTop: '0.5rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem',
                        maxWidth: '400px',
                      }}>
                        {['🎯', '🍅', '⚽', '🏔️', '🧅', '⛪', '💩', '🚄', '💃', '💶', '🗿', '🧠', '🎨', '📚', '🎵', '🍷', '🏛️', '⚡', '🌊', '🔥', '🌟', '🎭', '🎪', '🎬'].map(e => (
                          <button
                            key={e}
                            onClick={() => { setProposalForm({ ...proposalForm, emoji: e }); setShowEmojiPicker(false); }}
                            type="button"
                            style={{
                              fontSize: '1.8rem', padding: '0.5rem',
                              background: 'transparent', border: 'none',
                              cursor: 'pointer', borderRadius: '6px',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticker */}
                <div>
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                    color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                  }}>
                    Ticker (màx 5 caràcters)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={proposalForm.ticker}
                    onChange={e => setProposalForm({ ...proposalForm, ticker: e.target.value.toUpperCase() })}
                    placeholder="PAT"
                    style={{
                      width: '100%', padding: '0.875rem 1rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                      color: '#0A0A0A', background: '#FAFAF8',
                      border: '1.5px solid #E8E8E0', borderRadius: '10px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Nom */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                  color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                }}>
                  Nom del token
                </label>
                <input
                  type="text"
                  value={proposalForm.name}
                  onChange={e => setProposalForm({ ...proposalForm, name: e.target.value })}
                  placeholder="Pa amb Tomàquet"
                  style={{
                    width: '100%', padding: '0.875rem 1rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                    color: '#0A0A0A', background: '#FAFAF8',
                    border: '1.5px solid #E8E8E0', borderRadius: '10px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Descripció */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                  color: '#6B6B60', marginBottom: '0.5rem', fontWeight: '500',
                }}>
                  Descripció (màx 800 caràcters)
                </label>
                <textarea
                  value={proposalForm.description}
                  onChange={e => setProposalForm({ ...proposalForm, description: e.target.value })}
                  maxLength={800}
                  placeholder="Explica què representa aquest token i per què hauria d'existir..."
                  style={{
                    width: '100%', padding: '0.875rem 1rem', minHeight: '120px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
                    color: '#0A0A0A', background: '#FAFAF8',
                    border: '1.5px solid #E8E8E0', borderRadius: '10px',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                  color: '#9B9B90', marginTop: '0.5rem', textAlign: 'right',
                }}>
                  {proposalForm.description.length}/800
                </div>
              </div>

              <button
                onClick={async () => {
                  setProposalError('');
                  setProposalSuccess('');
                  try {
                    await proposalsAPI.create(proposalForm);
                    setProposalSuccess('Proposta enviada! Estarà en revisió.');
                    setProposalForm({ name: '', emoji: '🎯', ticker: '', description: '' });
                    await fetchProposals();
                  } catch (err) {
                    setProposalError(err.message);
                  }
                }}
                style={{
                  background: '#C9A84C', color: '#0A0A0A',
                  padding: '0.875rem 2rem',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: '600',
                  border: '2px solid #C9A84C', borderRadius: '50px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#FAFAF8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
              >
                Enviar proposta
              </button>
            </div>

            {/* Llista propostes */}
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #E8E8E0', padding: '2rem',
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                fontWeight: '700', color: '#0A0A0A', marginBottom: '1.5rem',
              }}>
                Les teves propostes
              </h3>

              {proposals.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  fontFamily: "'DM Sans', sans-serif", color: '#9B9B90',
                }}>
                  Encara no has creat cap proposta
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {proposals.map(prop => {
                    const statusColors = {
                      PENDING: { bg: 'rgba(201, 168, 76, 0.1)', text: '#C9A84C', label: 'En revisió' },
                      ACCEPTED: { bg: 'rgba(45, 106, 79, 0.1)', text: '#2D6A4F', label: 'Acceptada' },
                      REJECTED: { bg: 'rgba(193, 18, 31, 0.1)', text: '#C1121F', label: 'Refusada' }
                    };
                    const status = statusColors[prop.status];

                    return (
                      <div key={prop.id} style={{
                        border: '1px solid #E8E8E0', borderRadius: '10px',
                        padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                      }}>
                        <span style={{ fontSize: '2.5rem' }}>{prop.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem',
                            fontWeight: '600', color: '#0A0A0A', marginBottom: '0.25rem',
                          }}>
                            {prop.name} ({prop.ticker})
                          </div>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                            color: '#6B6B60',
                          }}>
                            {prop.description.length > 100 ? prop.description.substring(0, 100) + '...' : prop.description}
                          </div>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                            color: '#9B9B90', marginTop: '0.5rem',
                          }}>
                            Creat: {new Date(prop.createdAt).toLocaleDateString('ca-ES')}
                          </div>
                        </div>
                        <div style={{
                          background: status.bg, color: status.text,
                          padding: '0.5rem 1rem', borderRadius: '20px',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '600',
                        }}>
                          {status.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB: HISTORIAL */}
        {activeTab === 'historial' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6B60' }}>Encara no hi ha transaccions</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '0.875rem 1.5rem', background: '#F8F8F4', borderBottom: '1px solid #E8E8E0' }}>
                  {['Data', 'Token', 'Tipus', 'Import', 'Fraccions'].map((col, i) => (
                    <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: '600', color: '#9B9B90', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col}</span>
                  ))}
                </div>
                {transactions.map((tx, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '1rem 1.5rem', borderBottom: i < transactions.length - 1 ? '1px solid #F5F5F0' : 'none', alignItems: 'center' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#9B9B90' }}>{new Date(tx.createdAt).toLocaleDateString('ca-ES')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{tx.product?.emoji}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#0A0A0A' }}>{tx.product?.name}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: '600', color: tx.type === 'BUY' ? '#2D6A4F' : '#C1121F', background: tx.type === 'BUY' ? 'rgba(45,106,79,0.08)' : 'rgba(193,18,31,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                        {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#0A0A0A' }}>
                      {tx.type === 'BUY' ? `${parseFloat(tx.amountEUR).toFixed(2)}€` : `+${parseFloat(tx.eurRecovered).toFixed(2)}€`}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#6B6B60' }}>
                      {parseFloat(tx.fractions).toFixed(2)}
                    </div>
                  </div>
                ))}
              </>
            )}
            {/* Paginació */}
            {transactions.length > 0 && txTotal > 20 && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #F5F5F0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => fetchTransactions(txPage - 1)} disabled={txPage === 1} style={{
                  background: txPage === 1 ? '#F5F5F0' : '#FFFFFF',
                  color: txPage === 1 ? '#9B9B90' : '#0A0A0A',
                  padding: '0.4rem 0.8rem',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '500',
                  border: '1.5px solid #E8E8E0', borderRadius: '8px',
                  cursor: txPage === 1 ? 'not-allowed' : 'pointer',
                }}>Anterior</button>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B6B60' }}>
                  Pàgina {txPage} de {Math.ceil(txTotal / 20)}
                </span>
                <button onClick={() => fetchTransactions(txPage + 1)} disabled={txPage >= Math.ceil(txTotal / 20)} style={{
                  background: txPage >= Math.ceil(txTotal / 20) ? '#F5F5F0' : '#FFFFFF',
                  color: txPage >= Math.ceil(txTotal / 20) ? '#9B9B90' : '#0A0A0A',
                  padding: '0.4rem 0.8rem',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '500',
                  border: '1.5px solid #E8E8E0', borderRadius: '8px',
                  cursor: txPage >= Math.ceil(txTotal / 20) ? 'not-allowed' : 'pointer',
                }}>Següent</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>

            {/* Capçalera modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{modal.product.emoji}</span>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                  {modal.type === 'buy' ? 'Comprar' : 'Vendre'} {modal.product.name}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#9B9B90', margin: 0 }}>
                  Preu actual: {parseFloat(modal.product.currentPrice).toFixed(2)}€
                </p>
              </div>
            </div>

            {tradeError && (
              <div style={{ background: 'rgba(193,18,31,0.06)', border: '1px solid rgba(193,18,31,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#C1121F' }}>
                {tradeError}
              </div>
            )}
            {tradeSuccess && (
              <div style={{ background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#2D6A4F' }}>
                {tradeSuccess}
              </div>
            )}

            {/* Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: '500', color: '#0A0A0A', marginBottom: '0.5rem' }}>
                {modal.type === 'buy' ? 'Import en EUR' : 'Nombre de fraccions'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" step="0.01"
                  placeholder={modal.type === 'buy' ? '10.00' : '0.00'}
                  value={modal.type === 'sell' ? (displayAmount || tradeAmount) : tradeAmount}
                  onChange={e => {
                    if (modal.type === 'sell') {
                      setDisplayAmount(e.target.value);
                      setTradeAmount(e.target.value);
                    } else {
                      setTradeAmount(e.target.value);
                    }
                  }}
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
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#9B9B90' }}>
                  {modal.type === 'buy' ? '€' : 'fx'}
                </span>
              </div>
            </div>

            {/* COMPRA: botons ràpids */}
            {modal.type === 'buy' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {quickBuyAmounts.map(amount => (
                    <button key={amount} onClick={() => setTradeAmount(amount.toString())} style={{
                      flex: 1,
                      background: tradeAmount === amount.toString() ? '#0A0A0A' : '#F5F5F0',
                      color: tradeAmount === amount.toString() ? '#FAFAF8' : '#6B6B60',
                      padding: '0.5rem 0',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '500',
                      border: '1.5px solid', borderColor: tradeAmount === amount.toString() ? '#0A0A0A' : '#E8E8E0',
                      borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {amount}€
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VENDA: botons ràpids fraccions */}
            {modal.type === 'sell' && modal.position && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Botó meitat */}
                  <button onClick={() => {
                      const half = modal.position.fractions / 2;
                      setTradeAmount(half.toString());
                      setDisplayAmount(half.toFixed(2));
                    }} style={{
                    flex: 1,
                    background: '#F5F5F0', color: '#6B6B60',
                    padding: '0.6rem 0.5rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '500',
                    border: '1.5px solid #E8E8E0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E0'; e.currentTarget.style.color = '#6B6B60'; }}
                  >
                    ½ · {(modal.position.fractions / 2).toFixed(2)} fx
                  </button>
                  {/* Botó tot */}
                  <button onClick={() => {
                      setTradeAmount(modal.position.fractions.toString());
                      setDisplayAmount(modal.position.fractions.toFixed(2));
                    }} style={{
                    flex: 1,
                    background: '#F5F5F0', color: '#6B6B60',
                    padding: '0.6rem 0.5rem',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: '500',
                    border: '1.5px solid #E8E8E0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C1121F'; e.currentTarget.style.color = '#C1121F'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E0'; e.currentTarget.style.color = '#6B6B60'; }}
                  >
                    Tot · {modal.position.fractions.toFixed(2)} fx
                  </button>
                </div>
              </div>
            )}

            {/* Preview spread venda */}
            {modal.type === 'sell' && tradeAmount && parseFloat(tradeAmount) > 0 && modal.position && (
              <div style={{ background: '#F8F8F4', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #E8E8E0' }}>
                {(() => {
                  const fracs = parseFloat(tradeAmount);
                  const totalFracs = parseFloat(modal.position.fractions);
                  const ratio = Math.min(fracs / totalFracs, 1);
                  const grossEUR = parseFloat(modal.position.liquidationValue) * ratio;
                  const spreadEUR = grossEUR * SELL_SPREAD;
                  const netEUR = grossEUR - spreadEUR;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#6B6B60' }}>Valor brut</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#0A0A0A' }}>{grossEUR.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#C1121F' }}>Spread (1.5%)</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#C1121F' }}>-{spreadEUR.toFixed(2)}€</span>
                      </div>
                      <div style={{ borderTop: '1px solid #E8E8E0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: '600', color: '#0A0A0A' }}>Rebràs</span>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: '700', color: '#2D6A4F' }}>{netEUR.toFixed(2)}€</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Botons confirm */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setModal(null)} style={{
                flex: 1, background: 'transparent', color: '#6B6B60', padding: '0.875rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '0.9rem',
                border: '1.5px solid #E8E8E0', borderRadius: '50px', cursor: 'pointer',
              }}>Cancel·lar</button>
              <button onClick={modal.type === 'buy' ? handleBuy : handleSell} disabled={tradeLoading} style={{
                flex: 1,
                background: tradeLoading ? '#9B9B90' : (modal.type === 'buy' ? '#C9A84C' : '#C1121F'),
                color: modal.type === 'buy' ? '#0A0A0A' : '#FAFAF8',
                padding: '0.875rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '0.9rem',
                border: 'none', borderRadius: '50px',
                cursor: tradeLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}>
                {tradeLoading ? 'Processant...' : (modal.type === 'buy' ? 'Confirmar compra' : 'Confirmar venda')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
