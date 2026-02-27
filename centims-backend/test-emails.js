// test-emails.js
// Prova tots els tipus d'email del sistema
// Executa: node test-emails.js

require('dotenv').config();
const http = require('http');

const TEST_EMAIL = 'test@centims.cat';

function api(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const SEP = '═'.repeat(58);
function log(title) { console.log('\n' + SEP + '\n  ' + title + '\n' + SEP); }
function ok(msg)   { console.log('  ✅ ' + msg); }
function info(msg) { console.log('  ℹ️  ' + msg); }
function err(msg)  { console.log('  ❌ ' + msg); }

async function main() {
  console.log('\n📧  CENTIMS — Test Emails');
  console.log('📬  Inbox de prova: ' + TEST_EMAIL);

  // ─── LOGIN ADMIN ──────────────────────────────────────────────
  log('LOGIN ADMIN');
  const adminLogin = await api('POST', '/auth/login', {
    email: 'admin@centims.cat',
    password: 'centims2025!',
  });
  if (adminLogin.status !== 200) {
    err('Login admin fallat: ' + JSON.stringify(adminLogin.body));
    process.exit(1);
  }
  const adminToken = adminLogin.body.token;
  ok('Admin loggejat');

  // ─── EMAIL 1: BENVINGUDA (registrant nou usuari) ──────────────
  log('EMAIL 1 · BENVINGUDA 🎮  (via registre nou usuari)');
  info('Registrant test@centims.cat...');
  const ts = Date.now();

  // Comprovar si ja existeix — si sí, usar login directe
  let welcomeTriggered = false;
  const regRes = await api('POST', '/auth/register', {
    email: TEST_EMAIL,
    name: 'Test Centims',
    password: 'test1234',
    username: 'testcentims',
  });

  if (regRes.status === 201) {
    ok(`Usuari creat → welcome email enviat a ${TEST_EMAIL}`);
    info('  Subject: 🎮 Benvingut a Centims — El joc de trading català!');
    info('  Template: gradient verd/blau, 150€ inici, com funciona, achievements');
    welcomeTriggered = true;
  } else if (regRes.body?.error?.includes('ja està registrat') || regRes.body?.error?.includes('username')) {
    info('(usuari ja existia) — Enviant welcome email manualment via custom...');
    // Enviarem un email de benvinguda com a custom per veure el template
    const customWelcome = await api('POST', '/emails/send-custom', {
      recipients: [TEST_EMAIL],
      subject: '🎮 [RE-TEST] Benvingut a Centims!',
      body: 'Hola Test!\n\nAquest és un email de prova de benvinguda. El sistema funciona correctament!\n\nEquip Centims',
    }, adminToken);
    if (customWelcome.status === 200) {
      ok(`Email benvinguda (custom) enviat a ${TEST_EMAIL}`);
    } else {
      err('Error: ' + JSON.stringify(customWelcome.body));
    }
  } else {
    err('Error registre: ' + JSON.stringify(regRes.body));
  }

  // ─── EMAIL 2: CUSTOM (admin) ──────────────────────────────────
  log('EMAIL 2 · CUSTOM (des de panel admin) 📝');
  const custom = await api('POST', '/emails/send-custom', {
    recipients: [TEST_EMAIL],
    subject: '🧪 Test email personalitzat Centims',
    body: `Hola equip Centims!

Això és un email de prova enviat des del panel d'administració.

📊 Estat del sistema:
• Servidor: ✅ Actiu
• Base de dades: ✅ Connectada
• Emails: ✅ Funcionant

🪙 Tokens disponibles: 10 tokens culturals catalans
💶 Usuaris actius amb 150€ inicials cada un

Podeu gestionar tot des del panel admin.

Salutacions,
Sistema Centims`,
  }, adminToken);

  if (custom.status === 200) {
    ok(`Email custom enviat! (${custom.body.count} destinatari)`);
    info('  To: ' + TEST_EMAIL);
    info('  Subject: 🧪 Test email personalitzat Centims');
  } else {
    err('Error email custom: ' + JSON.stringify(custom.body));
  }

  // ─── EMAIL 3: CLASSIFICACIÓ SETMANAL ─────────────────────────
  log('EMAIL 3 · CLASSIFICACIÓ SETMANAL 📊  (envia a tots els usuaris actius)');
  info('Calculant rankings en temps real...');
  info('(Enviarà a TOTS els usuaris actius del sistema)');

  const weekly = await api('POST', '/emails/send-weekly', {}, adminToken);

  if (weekly.status === 200) {
    ok(`Emails setmanals enviats! (${weekly.body.count} usuaris)`);
    info('  Subject: 📊 Classificació setmanal Centims');
    info('  Template: taula top-10, posició personal, achievements');
    info(`  Inclou: ${TEST_EMAIL} si l'usuari és actiu`);
  } else {
    err('Error email setmanal: ' + JSON.stringify(weekly.body));
  }

  // ─── EMAIL 4: GUANYADORS (simulat) ───────────────────────────
  log('EMAIL 4 · GUANYADORS 🏆  (simulat per mes "2026-02")');
  info('Nota: Requereix ranking mensual guardat. Provant...');

  const winners = await api('POST', '/emails/send-winners', {
    month: '2026-02'
  }, adminToken);

  if (winners.status === 200) {
    if (winners.body.count === 0) {
      info('No hi ha guanyadors registrats per 2026-02 (normal — el ranking es guarda a finals de mes)');
      ok('Endpoint funciona correctament');
    } else {
      ok(`${winners.body.count} emails guanyadors enviats per 2026-02`);
    }
  } else {
    err('Error: ' + JSON.stringify(winners.body));
  }

  // ─── HISTORIAL ────────────────────────────────────────────────
  log('HISTORIAL D\'EMAILS ENVIATS');
  const history = await api('GET', '/emails/history?limit=5', null, adminToken);

  if (history.status === 200) {
    ok(`Total emails enviats: ${history.body.pagination.total}`);
    console.log('\n  Últims 5:');
    history.body.emails.forEach(e => {
      const ts = new Date(e.sentAt).toLocaleString('ca-ES');
      console.log(`    [${ts}] ${e.emailType.padEnd(14)} → ${e.recipientsCount} dest. | "${e.subject}"`);
    });
  }

  // ─── RESUM ────────────────────────────────────────────────────
  console.log('\n' + SEP);
  console.log('  📬  Revisa la bústia: ' + TEST_EMAIL);
  console.log('  Hauries de rebre:');
  console.log('    1. 🎮 Email benvinguda (si era nou usuari)');
  console.log('    2. 📝 Email custom de prova');
  console.log('    3. 📊 Email classificació setmanal');
  console.log(SEP + '\n');
}

main().catch(e => {
  console.error('\n❌ Error fatal:', e.message);
  process.exit(1);
});
