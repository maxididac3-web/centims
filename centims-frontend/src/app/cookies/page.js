'use client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const Section = ({ children, bg = '#FAFAF8' }) => (
  <section style={{ padding: '3.5rem 0', background: bg }}>
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 2rem' }}>
      {children}
    </div>
  </section>
);

const H2 = ({ children }) => (
  <h2 style={{
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
    fontWeight: '800', color: '#0A0A0A',
    letterSpacing: '-0.02em', marginBottom: '1rem', marginTop: '2.5rem',
  }}>{children}</h2>
);

const P = ({ children }) => (
  <p style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', color: '#3A3A32',
    lineHeight: 1.85, marginBottom: '0.85rem',
  }}>{children}</p>
);

const Li = ({ children }) => (
  <li style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', color: '#3A3A32',
    lineHeight: 1.85, marginBottom: '0.4rem',
  }}>{children}</li>
);

const Table = ({ rows }) => (
  <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
      <thead>
        <tr style={{ background: '#F5F5F0' }}>
          {['Cookie', 'Tipus', 'Finalitat', 'Durada'].map(h => (
            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#0A0A0A', fontWeight: '600', borderBottom: '2px solid #E8E8E0' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #E8E8E0', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAF8' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '0.7rem 1rem', color: '#3A3A32', verticalAlign: 'top' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CookiesPage() {
  return (
    <>
      <Navbar />

      {/* Capçalera */}
      <section style={{
        padding: '5rem 0 3rem',
        background: '#0A0A0A',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 2rem' }}>
          <Link href="/" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            color: 'rgba(250,250,248,0.45)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '2rem',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,250,248,0.45)'; }}
          >
            ← Tornar a l&apos;inici
          </Link>
          <div style={{ width: '40px', height: '3px', background: '#C9A84C', marginBottom: '1rem' }} />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900', color: '#FAFAF8',
            letterSpacing: '-0.03em', marginBottom: '0.75rem',
          }}>
            Política de Cookies
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.9rem', color: 'rgba(250,250,248,0.4)',
          }}>
            Darrera actualització: febrer 2025
          </p>
        </div>
      </section>

      {/* Contingut */}
      <Section>
        <P>
          Centims utilitza <strong>cookies i tecnologies similars</strong> per garantir el funcionament correcte
          de la plataforma i millorar la teva experiència com a usuari. Aquesta pàgina t&apos;explica
          quines cookies fem servir, per a quin fi i com pots gestionar-les.
        </P>

        <H2>1. Què és una cookie?</H2>
        <P>
          Una cookie és un petit fitxer de text que el teu navegador emmagatzema al dispositiu quan
          visites un lloc web. Les cookies permeten que la pàgina &quot;recordi&quot; les teves preferències
          i la teva sessió entre visites successives.
        </P>

        <H2>2. Cookies que fem servir</H2>
        <P>Centims únicament utilitza les cookies estrictament necessàries per al funcionament del servei:</P>

        <Table rows={[
          ['auth-token', 'Sessió / Funcional', 'Manté la sessió iniciada i autentica l\'usuari a totes les pàgines protegides.', 'Fins que tanques sessió o 7 dies'],
          ['preferencies', 'Funcional', 'Desa preferències locals (pestanya activa, última vista…).', 'Sessió del navegador'],
        ]} />

        <P>
          <strong>No fem servir cookies publicitàries, de seguiment ni de tercers.</strong> No integrem
          Google Analytics, Meta Pixel ni cap altra eina de seguiment extern.
        </P>

        <H2>3. Cookies de tercers</H2>
        <P>
          Centims no carrega cap script de tercers que pugui establir cookies en el teu dispositiu.
          Les úniques connexions externes que es poden produir són les pròpies del teu navegador
          (per exemple, fonts de Google Fonts, si aplica).
        </P>

        <H2>4. Com gestionar les cookies</H2>
        <P>
          Pots controlar i eliminar les cookies des de la configuració del teu navegador. A continuació
          trobaràs els enllaços a les instruccions dels navegadors més comuns:
        </P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <Li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', textDecoration: 'none' }}>Google Chrome</a>
          </Li>
          <Li>
            <a href="https://support.mozilla.org/ca/kb/activa-i-desactiva-les-cookies" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', textDecoration: 'none' }}>Mozilla Firefox</a>
          </Li>
          <Li>
            <a href="https://support.apple.com/ca-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', textDecoration: 'none' }}>Apple Safari</a>
          </Li>
          <Li>
            <a href="https://support.microsoft.com/ca-es/microsoft-edge/eliminar-les-cookies-a-microsoft-edge" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', textDecoration: 'none' }}>Microsoft Edge</a>
          </Li>
        </ul>
        <P>
          Tingues en compte que desactivar les cookies de sessió pot impedir que iniciïs sessió a la plataforma.
        </P>

        <H2>5. Actualitzacions d&apos;aquesta política</H2>
        <P>
          Podem actualitzar aquesta política si afegim noves funcionalitats que requereixin l&apos;ús de
          cookies addicionals. T&apos;ho comunicarem amb un avís a la plataforma.
        </P>

        <P>
          Qualsevol dubte, escriu-nos a{' '}
          <a href="mailto:info@centims.cat" style={{ color: '#C9A84C', textDecoration: 'none' }}>info@centims.cat</a>.
        </P>
      </Section>

      {/* Footer bàsic */}
      <footer style={{
        background: '#0A0A0A', padding: '2rem',
        textAlign: 'center', borderTop: '1px solid rgba(201,168,76,0.1)',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
          color: 'rgba(250,250,248,0.25)',
        }}>
          © 2025 Centims · Simulador lúdic i educatiu · Saldo 100% virtual
        </p>
      </footer>
    </>
  );
}
