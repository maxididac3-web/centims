// simulate.js
// Simulació end-to-end completa del sistema Centims
// Executa: node simulate.js

require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:3001';

// ─── Helper: crida API ──────────────────────────────────────────────────────
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
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Logger ────────────────────────────────────────────────────────────────
const SEP = '─'.repeat(60);
function log(title, data) {
  console.log('\n' + SEP);
  console.log('  ' + title);
  console.log(SEP);
  if (data) console.log(JSON.stringify(data, null, 2));
}
function ok(msg) { console.log('  ✅ ' + msg); }
function info(msg) { console.log('  ℹ️  ' + msg); }
function warn(msg) { console.log('  ⚠️  ' + msg); }

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🪙  CENTIMS — Simulació End-to-End');
  console.log('🗓️   ' + new Date().toLocaleString('ca-ES'));

  // ══════════════════════════════════════════════════════════════════
  // STEP 0: Health check
  // ══════════════════════════════════════════════════════════════════
  log('STEP 0 · Health check del servidor');
  const health = await api('GET', '/health');
  if (health.status !== 200) {
    console.error('❌ Servidor no disponible!', health);
    process.exit(1);
  }
  ok(`Servidor actiu: ${health.body.app} v${health.body.version}`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Registrar usuari 1 (Jordi) i usuari 2 (Anna)
  // ══════════════════════════════════════════════════════════════════
  log('STEP 1 · Registrar usuari 1 (Jordi) i usuari 2 (Anna)');

  // Usuari 1
  const ts = Date.now();
  const reg1 = await api('POST', '/auth/register', {
    email: `jordi_sim_${ts}@test.cat`,
    name: 'Jordi Puig',
    password: 'test1234',
  });
  if (reg1.status !== 201) {
    console.error('❌ Error registrant Jordi:', reg1.body);
    process.exit(1);
  }
  const user1Token = reg1.body.token;
  const user1Id = reg1.body.user.id;
  ok(`Usuari 1 registrat → id:${user1Id}  username:${reg1.body.user.username}  saldo:${reg1.body.user.balanceEUR}€`);

  // Usuari 2
  const reg2 = await api('POST', '/auth/register', {
    email: `anna_sim_${ts}@test.cat`,
    name: 'Anna Mas',
    password: 'test1234',
  });
  if (reg2.status !== 201) {
    console.error('❌ Error registrant Anna:', reg2.body);
    process.exit(1);
  }
  const user2Token = reg2.body.token;
  const user2Id = reg2.body.user.id;
  ok(`Usuari 2 registrat → id:${user2Id}  username:${reg2.body.user.username}  saldo:${reg2.body.user.balanceEUR}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Login admin
  // ══════════════════════════════════════════════════════════════════
  log('STEP 2 · Login admin');
  const adminLogin = await api('POST', '/auth/login', {
    email: 'admin@centims.cat',
    password: 'centims2025!',
  });
  if (adminLogin.status !== 200) {
    console.error('❌ Error login admin:', adminLogin.body);
    process.exit(1);
  }
  const adminToken = adminLogin.body.token;
  ok(`Admin loggejat → id:${adminLogin.body.user.id}  balanceEUR:${adminLogin.body.user.balanceEUR}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Trobar el token CL4K (Calçot 4K)
  // ══════════════════════════════════════════════════════════════════
  log('STEP 3 · Trobar token CL4K (Calçot 4K)');
  const prodsRes = await api('GET', '/products');
  if (prodsRes.status !== 200 || !prodsRes.body.products) {
    console.error('❌ Error obtenint productes:', prodsRes.body);
    process.exit(1);
  }
  const cl4k = prodsRes.body.products.find(p => p.ticker === 'CL4K');
  if (!cl4k) {
    console.error('❌ Token CL4K no trobat! Executa el seed primer.');
    process.exit(1);
  }
  info(`CL4K trobat → id:${cl4k.id}  p0:${cl4k.p0}  k:${cl4k.k}  supply:${cl4k.supply}  preu:${cl4k.currentPrice.toFixed(6)}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 4: Usuari 1 (Jordi) compra 20€ de CL4K
  // ══════════════════════════════════════════════════════════════════
  log('STEP 4 · Jordi compra 20€ de CL4K 🧅');
  const buy1 = await api('POST', '/transactions/buy', {
    productId: cl4k.id,
    amountEUR: 20,
  }, user1Token);
  if (buy1.status !== 200) {
    console.error('❌ Error compra Jordi:', buy1.body);
    process.exit(1);
  }
  const tx1 = buy1.body.transaction;
  ok(`Jordi ha comprat!`);
  info(`  💶 Gastat:           ${tx1.amountEUR}€`);
  info(`  🪙 Fraccions rebudes: ${tx1.userFractions.toFixed(4)}`);
  info(`  📦 Admin 1% buffer:  ${tx1.adminFractions.toFixed(4)}`);
  info(`  📈 Preu abans:       ${tx1.priceBefore.toFixed(6)}€`);
  info(`  📈 Preu després:     ${tx1.priceAfter.toFixed(6)}€`);
  info(`  📊 Supply antes:     ${tx1.supplyBefore.toFixed(4)} → ${tx1.supplyAfter.toFixed(4)}`);
  info(`  💰 Nou saldo Jordi:  ${buy1.body.newBalance.toFixed(2)}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 5: Usuari 2 (Anna) compra 30€ de CL4K
  // ══════════════════════════════════════════════════════════════════
  log('STEP 5 · Anna compra 30€ de CL4K 🧅');

  // Necessitem el producte actualitzat per veure el supply nou
  const prodsRes2 = await api('GET', `/products/${cl4k.id}`);
  const cl4kUpdated = prodsRes2.body.product;
  info(`CL4K preu actual (amb supply de Jordi): ${cl4kUpdated.currentPrice.toFixed(6)}€`);

  const buy2 = await api('POST', '/transactions/buy', {
    productId: cl4k.id,
    amountEUR: 30,
  }, user2Token);
  if (buy2.status !== 200) {
    console.error('❌ Error compra Anna:', buy2.body);
    process.exit(1);
  }
  const tx2 = buy2.body.transaction;
  ok(`Anna ha comprat!`);
  info(`  💶 Gastat:           ${tx2.amountEUR}€`);
  info(`  🪙 Fraccions rebudes: ${tx2.userFractions.toFixed(4)}`);
  info(`  📦 Admin 1% buffer:  ${tx2.adminFractions.toFixed(4)}`);
  info(`  📈 Preu abans:       ${tx2.priceBefore.toFixed(6)}€  (ha pujat vs el de Jordi!)`);
  info(`  📈 Preu després:     ${tx2.priceAfter.toFixed(6)}€`);
  info(`  📊 Supply:           ${tx2.supplyBefore.toFixed(4)} → ${tx2.supplyAfter.toFixed(4)}`);
  info(`  💰 Nou saldo Anna:   ${buy2.body.newBalance.toFixed(2)}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 6: Verificar supply + Buffer admin
  // ══════════════════════════════════════════════════════════════════
  log('STEP 6 · Verificar supply del token i buffer admin');
  const prodsRes3 = await api('GET', `/products/${cl4k.id}`);
  const cl4kFinal = prodsRes3.body.product;
  ok(`Supply CL4K: ${cl4kFinal.supply.toFixed(4)} fraccions (era 0 al inici)`);
  info(`  Preu actual: ${cl4kFinal.currentPrice.toFixed(6)}€`);
  info(`  Buffer admin: ${cl4kFinal.bufferFractions.toFixed(4)} fraccions (1% de cada compra)`);

  // Portfolios
  const port1 = await api('GET', '/portfolio', null, user1Token);
  const port2 = await api('GET', '/portfolio', null, user2Token);
  const jordiCL4K = port1.body.portfolio.find(p => p.productId === cl4k.id);
  const annaCL4K  = port2.body.portfolio.find(p => p.productId === cl4k.id);
  info(`  Jordi té: ${jordiCL4K?.fractions.toFixed(4)} fraccions (invertit: ${jordiCL4K?.investedEUR.toFixed(2)}€)`);
  info(`  Anna té:  ${annaCL4K?.fractions.toFixed(4)} fraccions (invertit: ${annaCL4K?.investedEUR.toFixed(2)}€)`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 7: Admin consolida el buffer de CL4K
  // ══════════════════════════════════════════════════════════════════
  log('STEP 7 · Admin consolida el buffer de CL4K');
  const consolidate = await api('POST', `/admin/consolidate/${cl4k.id}`, {}, adminToken);
  if (consolidate.status !== 200) {
    console.error('❌ Error consolidant buffer:', consolidate.body);
    process.exit(1);
  }
  ok(`Buffer consolidat!`);
  info(`  🪙 Fraccions venudes: ${consolidate.body.fractionsSold.toFixed(4)}`);
  info(`  💶 EUR recuperats:   ${consolidate.body.eurRecovered.toFixed(4)}€`);
  info(`  📈 Nou preu:         ${consolidate.body.newPrice.toFixed(6)}€`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 8: Admin aplica boost x1.5 al CL4K (Época Calçots! 🧅)
  // ══════════════════════════════════════════════════════════════════
  log('STEP 8 · Admin aplica boost x1.5 al CL4K (Época Calçots!)');
  const preuSenseBoost = consolidate.body.newPrice;
  const boost = await api('PUT', `/admin/products/${cl4k.id}/boost`, {
    boostValue: 1.5,
    boostDescription: 'Época calçots! 🧅 Temporada alta gener-abril',
    boostHours: 720, // 30 dies
  }, adminToken);
  if (boost.status !== 200) {
    console.error('❌ Error aplicant boost:', boost.body);
    process.exit(1);
  }
  ok(`Boost aplicat!`);
  info(`  ✨ ${boost.body.message}`);
  info(`  📈 Preu sense boost: ${preuSenseBoost.toFixed(6)}€`);
  info(`  🚀 Preu amb boost:   ${boost.body.product.newPrice.toFixed(6)}€  (+${((boost.body.product.newPrice/preuSenseBoost - 1)*100).toFixed(0)}%!)`);
  info(`  ⏰ Expira: ${new Date(boost.body.product.boostExpiresAt).toLocaleString('ca-ES')}`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 9: Jordi veu el seu portfolio (guany amb boost!)
  //         i decideix vendre totes les seves fraccions
  // ══════════════════════════════════════════════════════════════════
  log('STEP 9 · Jordi veu el portfolio amb boost i ven tot');
  const port1Boost = await api('GET', '/portfolio', null, user1Token);
  const jordiCL4KBoost = port1Boost.body.portfolio.find(p => p.productId === cl4k.id);
  if (!jordiCL4KBoost) {
    warn('Jordi ja no té CL4K al portfolio!');
  } else {
    info(`  Portfolio Jordi (CL4K):`);
    info(`    Fraccions:          ${jordiCL4KBoost.fractions.toFixed(4)}`);
    info(`    Invertit:           ${jordiCL4KBoost.investedEUR.toFixed(2)}€`);
    info(`    Valor spot (boost): ${jordiCL4KBoost.spotValue.toFixed(2)}€`);
    info(`    Valor liquidació:   ${jordiCL4KBoost.liquidationValue.toFixed(2)}€`);
    info(`    Profit:             ${jordiCL4KBoost.profit.toFixed(2)}€  (${jordiCL4KBoost.profitPercent.toFixed(1)}%)`);
  }

  const jordiFraccions = jordiCL4KBoost?.fractions || 0;
  if (jordiFraccions > 0) {
    const sell1 = await api('POST', '/transactions/sell', {
      productId: cl4k.id,
      fractions: jordiFraccions,
    }, user1Token);
    if (sell1.status !== 200) {
      console.error('❌ Error venent Jordi:', sell1.body);
      process.exit(1);
    }
    const txSell = sell1.body.transaction;
    ok(`Jordi ha venut!`);
    info(`  🪙 Fraccions venudes: ${txSell.fractions.toFixed(4)}`);
    info(`  💶 Brut recuperat:   ${txSell.grossEUR.toFixed(4)}€`);
    info(`  💸 Spread (1.5%):    -${txSell.spreadEUR.toFixed(4)}€`);
    info(`  💰 Net rebut:        ${txSell.netEUR.toFixed(4)}€`);
    info(`  📈 Guany net vs invertit: ${(txSell.netEUR - 20).toFixed(4)}€  (${(((txSell.netEUR-20)/20)*100).toFixed(1)}%)`);
    info(`  💰 Saldo Jordi ara:  ${sell1.body.newBalance.toFixed(2)}€  (tenia 150€ al inici)`);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 10: Usuari 2 (Anna) proposa un nou token: "Castellers"
  // ══════════════════════════════════════════════════════════════════
  const uniqueTicker = 'CS' + ts.toString().slice(-4);
  log(`STEP 10 · Anna proposa un nou token: Castellers de Vilafranca (${uniqueTicker})`);
  const proposal = await api('POST', '/proposals', {
    name: `Castellers de Vilafranca ${ts.toString().slice(-4)}`,
    emoji: '🏗️',
    ticker: uniqueTicker,
    description: 'Els Castellers de Vilafranca representen l\'excel·lència humana en forma de torre. Força, equilibri, valor i seny als quatre pilars d\'una cultura que mira cap amunt. Cada pilar, cada castell, és un acte de confiança col·lectiva.',
  }, user2Token);
  if (proposal.status !== 201) {
    console.error('❌ Error proposta Anna:', proposal.body);
    process.exit(1);
  }
  const proposalId = proposal.body.proposal.id;
  ok(`Proposta enviada!`);
  info(`  🆔 ID proposta: ${proposalId}`);
  info(`  🏗️  Token: ${proposal.body.proposal.name} (${proposal.body.proposal.ticker})`);
  info(`  📋 Estat: ${proposal.body.proposal.status}`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 11: Admin accepta la proposta + crea el token
  // ══════════════════════════════════════════════════════════════════
  log('STEP 11 · Admin accepta la proposta i crea el token CSTL');
  const accept = await api('PUT', `/admin/proposals/${proposalId}/accept`, {
    p0: 0.10,
    k: 0.0001,
  }, adminToken);
  if (accept.status !== 200) {
    console.error('❌ Error acceptant proposta:', accept.body);
    process.exit(1);
  }
  ok(`Proposta acceptada!`);
  info(`  ✨ ${accept.body.message}`);
  info(`  🆔 Token creat: id=${accept.body.product.id}  p0=${accept.body.product.p0}  k=${accept.body.product.k}`);
  info(`  📋 Proposta → ${accept.body.proposal.status}`);
  const cstlId = accept.body.product.id;

  // ══════════════════════════════════════════════════════════════════
  // STEP 12: Verificar Anna té 10 fraccions de CSTL
  // ══════════════════════════════════════════════════════════════════
  log('STEP 12 · Verificar Anna ha rebut 10 fraccions de CSTL 🎁');
  const port2Final = await api('GET', '/portfolio', null, user2Token);
  const annaCSTL = port2Final.body.portfolio.find(p => p.productId === cstlId);

  if (!annaCSTL) {
    warn('Anna no té CSTL al portfolio. Comprova grantCreatorReward.');
  } else {
    ok(`Anna ha rebut les fraccions de creadora!`);
    info(`  🏗️  Token CSTL:`);
    info(`    Fraccions rebudes: ${annaCSTL.fractions}`);
    info(`    Valor spot:        ${annaCSTL.spotValue.toFixed(4)}€`);
  }

  // ══════════════════════════════════════════════════════════════════
  // RESUM FINAL
  // ══════════════════════════════════════════════════════════════════
  log('RESUM FINAL 🏁');
  const portJordiFinal = await api('GET', '/portfolio', null, user1Token);
  const portAnnaFinal  = await api('GET', '/portfolio', null, user2Token);

  console.log('\n  👤 JORDI');
  console.log(`     Saldo EUR: ${portJordiFinal.body.user.balanceEUR.toFixed(2)}€  (inicial: 150€)`);
  console.log(`     Patrimoni: ${portJordiFinal.body.summary.totalPatrimoni.toFixed(2)}€`);

  console.log('\n  👤 ANNA');
  console.log(`     Saldo EUR: ${portAnnaFinal.body.user.balanceEUR.toFixed(2)}€  (inicial: 150€)`);
  console.log(`     Portfolio tokens: ${portAnnaFinal.body.portfolio.length}`);
  portAnnaFinal.body.portfolio.forEach(p => {
    console.log(`       ${p.productEmoji} ${p.productName}: ${p.fractions.toFixed(4)} fraccions (val. ${p.liquidationValue.toFixed(2)}€)`);
  });

  // Preu final CL4K
  const cl4kRes = await api('GET', `/products/${cl4k.id}`);
  console.log(`\n  🧅 CL4K preu final: ${cl4kRes.body.product.currentPrice.toFixed(6)}€`);
  console.log(`     Supply final:     ${cl4kRes.body.product.supply.toFixed(4)} fraccions`);

  console.log('\n' + SEP);
  console.log('  ✅  Simulació completada amb èxit!');
  console.log(SEP + '\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message || err);
  process.exit(1);
});
