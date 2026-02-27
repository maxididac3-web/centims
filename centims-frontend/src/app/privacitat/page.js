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

export default function PrivacitatPage() {
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
            Política de Privacitat
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
          A <strong>Centims</strong> ens prenem molt seriosament la protecció de les teves dades personals.
          Aquesta política explica quines dades recollim, com les fem servir i quins drets tens com a usuari.
        </P>

        <H2>1. Responsable del tractament</H2>
        <P>
          El responsable del tractament de les dades és <strong>Centims</strong>.<br />
          Contacte: <a href="mailto:info@centims.cat" style={{ color: '#C9A84C', textDecoration: 'none' }}>info@centims.cat</a>
        </P>

        <H2>2. Dades que recollim</H2>
        <P>En registrar-te a Centims, recollim les dades mínimes necessàries per oferir el servei:</P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li><strong>Nom d&apos;usuari</strong>: per identificar-te a la plataforma i al rànquing.</Li>
          <Li><strong>Adreça electrònica</strong>: per a l&apos;accés al compte i comunicacions del servei.</Li>
          <Li><strong>Contrasenya xifrada</strong>: mai no s&apos;emmagatzema en text pla.</Li>
          <Li><strong>Activitat a la plataforma</strong>: compres, vendes i posicions de tokens virtuals.</Li>
          <Li><strong>Data de registre i darrer accés</strong>: per a la gestió del compte.</Li>
        </ul>
        <P>No recollim dades de pagament ni informació bancària de cap tipus, ja que Centims és un simulador amb saldo 100% virtual.</P>

        <H2>3. Finalitat del tractament</H2>
        <P>Fem servir les teves dades per a:</P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li>Gestionar el teu compte i permetre l&apos;accés a la plataforma.</Li>
          <Li>Mostrar el teu posicionament al rànquing mensual.</Li>
          <Li>Enviar comunicacions relacionades amb el servei (canvis importants, resultats mensuals).</Li>
          <Li>Millorar la plataforma analitzant l&apos;activitat de forma agregada i anònima.</Li>
        </ul>

        <H2>4. Base jurídica</H2>
        <P>
          El tractament es fonamenta en l&apos;execució del contracte acceptat en el moment del registre (article 6.1.b del RGPD)
          i, per a les comunicacions opcionals, en el consentiment exprés de l&apos;usuari.
        </P>

        <H2>5. Conservació de les dades</H2>
        <P>
          Les teves dades es conserven mentre el compte estigui actiu. En cas de sol·licitar la baixa,
          les dades s&apos;eliminaran en un termini màxim de 30 dies, excepte les que calgui conservar per
          obligació legal.
        </P>

        <H2>6. Cessions a tercers</H2>
        <P>
          No cedim les teves dades personals a tercers amb finalitats comercials. Únicament podem
          compartir dades agregades i anònimes (estadístiques de la plataforma) amb patrocinadors dels premis mensuals.
        </P>

        <H2>7. Seguretat</H2>
        <P>
          Totes les connexions a Centims estan protegides amb xifratge HTTPS. Les contrasenyes
          s&apos;emmagatzemen amb algoritmes de hash segurs. Apliquem mesures tècniques i organitzatives
          adequades per protegir les teves dades contra accés no autoritzat, pèrdua o destrucció.
        </P>

        <H2>8. Els teus drets</H2>
        <P>Com a usuari tens dret a:</P>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <Li><strong>Accés</strong>: saber quines dades tenim sobre tu.</Li>
          <Li><strong>Rectificació</strong>: corregir dades inexactes.</Li>
          <Li><strong>Supressió</strong>: eliminar el teu compte i dades associades.</Li>
          <Li><strong>Portabilitat</strong>: rebre les teves dades en format estructurat.</Li>
          <Li><strong>Oposició</strong>: oposar-te a determinats tractaments.</Li>
        </ul>
        <P>
          Pots exercir qualsevol d&apos;aquests drets escrivint a{' '}
          <a href="mailto:info@centims.cat" style={{ color: '#C9A84C', textDecoration: 'none' }}>info@centims.cat</a>.
          Tens dret a presentar una reclamació davant l&apos;Agència Española de Protección de Datos (AEPD).
        </P>

        <H2>9. Canvis a aquesta política</H2>
        <P>
          Ens reservem el dret de modificar aquesta política per adaptar-la a canvis legislatius o
          del servei. T&apos;informarem de canvis significatius per correu electrònic o avís a la plataforma.
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
