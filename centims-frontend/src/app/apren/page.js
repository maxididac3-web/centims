'use client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const Section = ({ children, bg = '#FAFAF8' }) => (
  <section style={{ padding: '4rem 0', background: bg }}>
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>
      {children}
    </div>
  </section>
);

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: '800', color: '#0A0A0A',
    letterSpacing: '-0.02em', marginBottom: '1.25rem',
  }}>{children}</h2>
);

const Body = ({ children }) => (
  <p style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '1rem', color: '#3A3A32',
    lineHeight: 1.8, marginBottom: '1rem',
  }}>{children}</p>
);

const Callout = ({ children }) => (
  <div style={{
    background: 'rgba(201,168,76,0.1)',
    borderLeft: '4px solid #C9A84C',
    borderRadius: '0 10px 10px 0',
    padding: '1.25rem 1.5rem',
    margin: '1.5rem 0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', color: '#3A3A32',
    lineHeight: 1.7,
  }}>{children}</div>
);

// Gràfic SVG de la corba de bonding
function BondingCurveChart() {
  const width = 340;
  const height = 180;
  const p0 = 0.15;
  const k = 0.00015;
  const maxSupply = 5000;

  const points = [];
  for (let s = 0; s <= maxSupply; s += 100) {
    const price = p0 * (1 + k * s);
    const x = (s / maxSupply) * (width - 40) + 20;
    const maxPrice = p0 * (1 + k * maxSupply);
    const y = height - 20 - ((price - p0) / (maxPrice - p0)) * (height - 40);
    points.push(`${x},${y}`);
  }
  const pathD = `M ${points.join(' L ')}`;

  return (
    <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ background: '#F8F8F4', borderRadius: '12px', border: '1px solid #E8E8E0' }}>
        {/* Eixos */}
        <line x1="20" y1={height - 20} x2={width - 10} y2={height - 20} stroke="#D0D0C8" strokeWidth="1" />
        <line x1="20" y1="10" x2="20" y2={height - 20} stroke="#D0D0C8" strokeWidth="1" />
        {/* Corba */}
        <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2.5" />
        {/* Etiquetes */}
        <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="#9B9B90" fontFamily="DM Sans, sans-serif">Supply (fraccions)</text>
        <text x="14" y={height / 2} textAnchor="middle" fontSize="10" fill="#9B9B90" fontFamily="DM Sans, sans-serif" transform={`rotate(-90, 14, ${height / 2})`}>Preu (€)</text>
        <text x="22" y={height - 23} textAnchor="start" fontSize="9" fill="#C9A84C" fontFamily="DM Sans, sans-serif">P0</text>
      </svg>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#9B9B90', marginTop: '0.5rem' }}>
        P(S) = P₀ × (1 + k × S) — a més demanda, preu més alt
      </p>
    </div>
  );
}

export default function AprenPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        paddingTop: '110px', paddingBottom: '4rem',
        background: '#0A0A0A', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ width: '50px', height: '3px', background: '#C9A84C', margin: '0 auto 1.5rem' }} />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: '900', color: '#FAFAF8',
            letterSpacing: '-0.02em', lineHeight: 1.2,
            marginBottom: '1.25rem',
          }}>
            Aprèn com funciona Centims
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.1rem', color: 'rgba(250,250,248,0.75)',
            lineHeight: 1.7,
          }}>
            Trading de tokens culturals catalans. Sense drames, amb bonding curves i molt de seny.
          </p>
        </div>
      </div>

      {/* 1. Què és Centims */}
      <Section>
        <SectionTitle>Què és Centims?</SectionTitle>
        <Body>
          Centims és una plataforma de trading lúdic de tokens inspirats en la cultura catalana. Cada token representa un element cultural — des del caganer fins a la renfe amb retard — i té un preu que puja o baixa en funció de quanta gent el compra.
        </Body>
        <Body>
          No és una inversió real. És un joc d'aprenentatge on pots practicar conceptes financers com la volatilitat, la liquidació o el P&amp;L, sense posar-hi diners de veritat.
        </Body>
        <Callout>
          💡 Tots els usuaris comencen amb saldo virtual. Compres, valores, aprens. Sense risc real.
        </Callout>
      </Section>

      {/* 2. Bonding Curve */}
      <Section bg="#F5F5F0">
        <SectionTitle>Com funciona el preu?</SectionTitle>
        <Body>
          Cada token utilitza una <strong>bonding curve</strong>: una fórmula matemàtica que determina el preu en funció de quantes fraccions hi ha en circulació (el <em>supply</em>).
        </Body>
        <Callout>
          <strong>P(S) = P₀ × (1 + k × S)</strong>
          <br />
          On P₀ és el preu base, k és la pendent de la corba, i S és el supply actual.
        </Callout>
        <BondingCurveChart />
        <Body>
          Quan compres fraccions, el supply augmenta i el preu puja. Quan algú ven, el supply baixa i el preu baixa. Cada compra i cada venda afecten el preu per a tothom — és un mercat on les teves accions importen.
        </Body>
        <Body>
          <strong>Exemple pràctic:</strong> Si un token té P₀ = 0.15€ i k = 0.00015, i hi ha 1.000 fraccions en circulació, el preu és: 0.15 × (1 + 0.00015 × 1000) = 0.15 × 1.15 = <strong>0.1725€</strong>.
        </Body>
      </Section>

      {/* 3. Spread */}
      <Section>
        <SectionTitle>El spread i les comissions</SectionTitle>
        <Body>
          Quan vens, s'aplica un <strong>spread del 1.5%</strong> sobre el valor de liquidació. Aquesta diferència entre el preu de compra i el de venda simula les condicions reals d'un mercat.
        </Body>
        <Body>
          A més, en cada compra, un 1% de les fraccions va al <em>buffer d'administració</em>. Aquest buffer garanteix la liquiditat del mercat i es consolida periòdicament.
        </Body>
        <Callout>
          📊 El teu <strong>valor de liquidació</strong> és el que rebries si venessis tots els teus tokens ara, comptant el spread i l'efecte de baixada de preu per cada fracció venuda.
        </Callout>
      </Section>

      {/* 4. Multiplicadors */}
      <Section bg="#F5F5F0">
        <SectionTitle>Multiplicadors de preu</SectionTitle>
        <Body>
          Alguns tokens poden tenir <strong>multiplicadors</strong> que inflen temporalment el seu preu. Hi ha dos tipus:
        </Body>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', margin: '1.5rem 0' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📅</div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem' }}>Boost Estacional</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60', lineHeight: 1.6 }}>
              Actiu durant una temporada sencera (Nadal, Setmana Santa, etc.). No caduca fins que l'administrador no el desactiva.
            </p>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E8E0', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚡</div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.5rem' }}>Boost Temporal</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60', lineHeight: 1.6 }}>
              Actiu durant un nombre fix de dies. Quan caduca, el preu torna al valor normal de la corba.
            </p>
          </div>
        </div>
        <Body>
          Si un token té boost actiu, el seu preu es mostra multiplicat. Tingues-ho en compte: quan el boost caduqui, el preu pot caure significativament.
        </Body>
      </Section>

      {/* 5. Crear un token */}
      <Section>
        <SectionTitle>Com es crea un token?</SectionTitle>
        <Body>
          Qualsevol usuari registrat pot proposar un nou token cultural. El procés és senzill:
        </Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
          {[
            { num: '01', title: 'Proposa', desc: "Omple el formulari: emoji, ticker (màx 5 caràcters), nom i descripció. Pensa en alguna cosa genuïnament catalana i interessant." },
            { num: '02', title: "L'equip revisa", desc: "El teu token entra en revisió. L'equip de Centims valorarà si encaixa amb l'esperit de la plataforma." },
            { num: '03', title: 'Llançament', desc: "Si s'aprova, el token s'activa amb uns paràmetres inicials (P₀ i k) fixats per l'equip." },
            { num: '04', title: '10 fraccions per al creador', desc: "Com a creador, reps automàticament 10 fraccions del token. Ets el primer holder!" },
          ].map(step => (
            <div key={step.num} style={{
              display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              background: '#F8F8F4', borderRadius: '12px', padding: '1.25rem',
            }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                fontWeight: '900', color: '#C9A84C', minWidth: '2.5rem',
              }}>{step.num}</span>
              <div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: '700', color: '#0A0A0A', marginBottom: '0.25rem' }}>{step.title}</h4>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B6B60', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Avaluació setmanal */}
      <Section bg="#F5F5F0">
        <SectionTitle>L'avaluació setmanal</SectionTitle>
        <Body>
          Cada setmana, l'equip consolida el buffer d'administració. Això vol dir que les fraccions acumulades en el buffer es converteixen en EUR per garantir la liquiditat del sistema.
        </Body>
        <Callout>
          🔄 La consolidació és el mecanisme que permet que el mercat funcioni de manera sostenible. Sense ella, el sistema no podria suportar vendes massives.
        </Callout>
        <Body>
          Durant la consolidació, l'equip revisa també els boosts actius i pot fer ajustaments de paràmetres si detecta comportaments anòmals.
        </Body>
      </Section>

      {/* 7. Classificació i premis */}
      <Section>
        <SectionTitle>Classificació i premis mensuals</SectionTitle>
        <Body>
          Cada mes hi ha una classificació basada en el valor total de la cartera de cada usuari (saldo lliure + valor dels tokens). Al final del mes, els millors jugadors guanyen premis aportats pels patrocinadors de Centims.
        </Body>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', margin: '1.5rem 0' }}>
          {[
            { pos: '🥇', text: '1r lloc — Premi principal del mes' },
            { pos: '🥈', text: '2n lloc — Segon premi' },
            { pos: '🥉', text: '3r lloc — Tercer premi' },
          ].map((p, i) => (
            <div key={i} style={{
              background: '#F8F8F4', borderRadius: '10px',
              padding: '1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{p.pos}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#6B6B60', margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </div>
        <Body>
          A banda de la classificació general, hi ha <strong>assoliments especials</strong>: premis per ser el primer inversor d'un token, per tenir la cartera més diversificada, o per la millor rendibilitat del mes.
        </Body>
      </Section>

      {/* CTA final */}
      <Section bg="#0A0A0A">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '900', color: '#FAFAF8',
            letterSpacing: '-0.02em', marginBottom: '1rem',
          }}>
            Llest per començar?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '1rem',
            color: 'rgba(250,250,248,0.75)', marginBottom: '2rem',
            lineHeight: 1.7,
          }}>
            Crea el teu compte, rep saldo virtual i comença a invertir en tokens catalans.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{
              background: '#C9A84C', color: '#0A0A0A',
              padding: '0.875rem 2.5rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: '600', fontSize: '1rem',
              border: '2px solid #C9A84C', borderRadius: '50px',
              textDecoration: 'none', display: 'inline-block',
            }}>
              Comença a invertir
            </a>
            <Link href="/" style={{
              background: 'transparent', color: '#FAFAF8',
              padding: '0.875rem 2.5rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: '500', fontSize: '1rem',
              border: '2px solid rgba(250,250,248,0.3)', borderRadius: '50px',
              textDecoration: 'none', display: 'inline-block',
            }}>
              Tornar a l'inici
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
