/**
 * cleanup-users.js
 * Elimina tots els usuaris de test, conservant únicament els admins (role: ADMIN).
 * Salta les taules que no existeixin a la BD actual.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function tryDelete(label, fn) {
  try {
    const result = await fn();
    console.log(`   - ${label}: ${result.count}`);
  } catch (e) {
    console.log(`   - ${label}: taula inexistent, saltant...`);
  }
}

async function main() {
  console.log('🔍 Cercant usuaris a la base de dades...\n');

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { id: 'asc' },
  });

  const admins = allUsers.filter(u => u.role === 'ADMIN');
  const testUsers = allUsers.filter(u => u.role !== 'ADMIN');

  console.log(`👑 Admins (es conservaran): ${admins.length}`);
  admins.forEach(u => console.log(`   ✅ [${u.id}] ${u.name} — ${u.email}`));

  console.log(`\n🗑️  Usuaris a eliminar: ${testUsers.length}`);
  testUsers.forEach(u => console.log(`   ❌ [${u.id}] ${u.name} — ${u.email}`));

  if (testUsers.length === 0) {
    console.log('\n✅ No hi ha usuaris de test. La BD ja està neta.');
    return;
  }

  const ids = testUsers.map(u => u.id);

  console.log('\n⚙️  Eliminant dades en cascada...');

  await tryDelete('Assoliments',   () => prisma.monthlyAchievement.deleteMany({ where: { userId: { in: ids } } }));
  await tryDelete('Rankings',      () => prisma.monthlyRanking.deleteMany({ where: { userId: { in: ids } } }));
  await tryDelete('Propostes',     () => prisma.tokenProposal.deleteMany({ where: { proposedBy: { in: ids } } }));
  await tryDelete('Transaccions',  () => prisma.transaction.deleteMany({ where: { userId: { in: ids } } }));
  await tryDelete('Portfolios',    () => prisma.portfolio.deleteMany({ where: { userId: { in: ids } } }));
  await tryDelete('EmailsSent',    () => prisma.emailSent.deleteMany({ where: { sentBy: { in: ids } } }));

  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`   - Usuaris eliminats: ${deleted.count}`);

  console.log('\n✅ Neteja completada!');
  const remaining = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  remaining.forEach(u => console.log(`   👤 [${u.id}] ${u.role} — ${u.name} (${u.email})`));
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
