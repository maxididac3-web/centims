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

const Callout = ({ children }) => (
  <div style={{
    background: 'rgba(201,168,76,0.08)',
    borderLeft: '4px solid #C9A84C',
    borderRadius: '0 10px 10px 0',
    padding: '1.25rem 1.5rem',
    margin: '1.5rem 0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', color: '#3A3A32',
    lineHeight: 1.7,
  }}>{children}</div>
);

export default function TermesPage() {
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
            Termes i Condicions
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
        <Callout>
          🎮 <strong>Recorda:</strong> Centims és un simulador lúdic i educatiu. Tot el saldo, les compres i les vendes de tokens són 100% virtuals. Cap operació implica diners reals ni constitueix una inversió financera.
        </Callout>

        <H2>1. Objecte i àmbit d&apos;aplicació</H2>
        <P>
          Aquests Termes i Condicions regulen l&apos;accés i ús de la plataforma <strong>Centims</strong>,
          un simulador de mercat de tokens de temàtica cultural catalana amb finalitat lúdica i educativa.
          En registrar-te i utilitzar la plataforma, acceptes íntegrament els presents termes.
        </P>

        <H2>2. Registre i compte d&apos;usuari</H2>
        <P>
          Per accedir a totes les funcionalitats de Centims cal crear un compte amb un nom d&apos;usuari
          i una adreça electrònica vàlida. Ets responsable de mantenir la confidencialitat de les teves
          credencials i de tota l&apos;activitat que es realitzi des del teu compte.
        </P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li>Has de tenir almenys 14 anys per registrar-te.</Li>
          <Li>Cada persona només pot tenir un compte actiu.</Li>
          <Li>Està prohibit compartir comptes o cedir les credencials a tercers.</Li>
          <Li>Les dades de registre han de ser veritables i actualitzades.</Li>
        </ul>

        <H2>3. Naturalesa virtual de la plataforma</H2>
        <P>
          El saldo inicial de <strong>1.000 Centims</strong> que reps en registrar-te és fictici i no té
          cap valor econòmic real. Les operacions de compra i venda de tokens es realitzen amb aquest
          saldo virtual i no generen cap moviment de diners reals.
        </P>
        <P>
          Centims <strong>no és una plataforma d&apos;inversió</strong>, no està regulada per cap autoritat
          financera i no garanteix cap tipus de rendiment econòmic als seus usuaris.
        </P>

        <H2>4. Premis mensuals</H2>
        <P>
          Centims organitza una competició mensual entre els seus usuaris. Els millors classificats
          al rànquing mensual poden rebre premis físics o digitals cedits per patrocinadors.
        </P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li>Els premis són atorgats per patrocinadors externs i queden subjectes a la seva disponibilitat.</Li>
          <Li>Centims es reserva el dret de modificar o cancel·lar un premi si el patrocinador no el pot facilitar.</Li>
          <Li>Per recollir un premi, el guanyador ha de proporcionar les dades necessàries en un termini de 15 dies.</Li>
          <Li>Els premis no són canviables per diners en cap cas.</Li>
        </ul>

        <H2>5. Tokens i propostes</H2>
        <P>
          Els tokens disponibles a la plataforma representen elements de la cultura catalana: personatges,
          llocs, gastronomia, esports, etc. El seu preu varia en funció de la demanda mitjançant una
          corba de bonding matemàtica.
        </P>
        <P>
          Els usuaris poden proposar nous tokens. Centims es reserva el dret d&apos;acceptar o refusar
          qualsevol proposta sense necessitat de justificació. Les propostes acceptades no generen cap
          dret econòmic per a l&apos;usuari proposant, més enllà de la recompensa virtual establerta.
        </P>

        <H2>6. Conducta dels usuaris</H2>
        <P>Queda expressament prohibit:</P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li>Manipular el mercat amb bots, scripts automàtics o qualsevol mecanisme artificial.</Li>
          <Li>Crear múltiples comptes per obtenir avantatges competitius (multi-accounting).</Li>
          <Li>Intentar accedir a àrees restringides o vulnerar la seguretat de la plataforma.</Li>
          <Li>Publicar contingut ofensiu, discriminatori o que violi drets de tercers.</Li>
          <Li>Qualsevol ús de la plataforma contrari a les lleis vigents.</Li>
        </ul>
        <P>
          L&apos;incompliment d&apos;aquestes normes pot comportar la suspensió o eliminació permanent del compte,
          sense dret a cap compensació.
        </P>

        <H2>7. Propietat intel·lectual</H2>
        <P>
          Tots els continguts de Centims (disseny, textos, codi, logotips) són propietat de Centims
          o dels seus llicenciataris. Queda prohibida la seva reproducció, distribució o modificació
          sense autorització expressa per escrit.
        </P>

        <H2>8. Limitació de responsabilitat</H2>
        <P>
          Centims ofereix la plataforma &quot;tal com és&quot; i no garanteix la disponibilitat ininterrompuda
          del servei. No som responsables de pèrdues de dades degudes a fallades tècniques ni de
          decisions preses basant-se en les simulacions de la plataforma.
        </P>

        <H2>9. Modificació dels termes</H2>
        <P>
          Ens reservem el dret de modificar aquests termes en qualsevol moment. Els canvis significatius
          es comunicaran per correu electrònic amb almenys 15 dies d&apos;antelació. L&apos;ús continuat de la
          plataforma implica l&apos;acceptació dels nous termes.
        </P>

        <H2>10. Llei aplicable i jurisdicció</H2>
        <P>
          Aquests termes es regeixen per la legislació espanyola i catalana vigent. Per a qualsevol
          controvèrsia, les parts se sotmeten als jutjats i tribunals de Catalunya, amb renúncia
          expressa a qualsevol altre fur que pogués correspondre&apos;ls.
        </P>

        <P>
          Per a consultes sobre els termes, contacta amb nosaltres a{' '}
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
