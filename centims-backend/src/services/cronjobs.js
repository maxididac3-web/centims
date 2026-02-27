// src/services/cronJobs.js
// Configuració de tots els cron jobs del sistema

const cron = require('node-cron');
const { executeMonthlyReset, executeMonthlySnapshot } = require('./monthlyReset');
const { sendWeeklyRankingEmails } = require('./weeklyemails');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Expirar boosts temporals (cada hora)
 */
async function expireBoosts() {
  try {
    const now = new Date();
    
    const result = await prisma.product.updateMany({
      where: {
        boostActive: true,
        boostExpiresAt: {
          lte: now
        }
      },
      data: {
        boostActive: false,
        boostValue: 1.0,
        boostDescription: null
      }
    });
    
    if (result.count > 0) {
      console.log(`🔥 ${result.count} boosts expirats`);
    }
    
  } catch (error) {
    console.error('❌ Error expirant boosts:', error);
  }
}

/**
 * Inicialitza tots els cron jobs
 */
function startCronJobs() {
  console.log('⏰ ================================');
  console.log('⏰ INICIALITZANT CRON JOBS');
  console.log('⏰ ================================');
  
  // 1. SNAPSHOT CLASSIFICACIÓ (últim dia mes, 23:59)
  // Format: "59 23 L * *" (L = last day of month)
  // En node-cron cal fer-ho diferent, usarem dia 28-31 amb validació
  cron.schedule('59 23 28-31 * *', async () => {
    try {
      // Comprovar si és realment l'últim dia del mes
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (tomorrow.getDate() === 1) {
        // És l'últim dia del mes!
        console.log('📊 Executant snapshot mensual...');
        await executeMonthlySnapshot();
      }
    } catch (error) {
      console.error('❌ Error en cron snapshot:', error);
    }
  });
  
  console.log('  ✅ Snapshot mensual: 23:59 últim dia mes');
  
  // 2. RESET MENSUAL (dia 1, 00:01)
  cron.schedule('1 0 1 * *', async () => {
    try {
      console.log('🔄 Executant reset mensual...');
      await executeMonthlyReset();
    } catch (error) {
      console.error('❌ Error en cron reset:', error);
    }
  });
  
  console.log('  ✅ Reset mensual: 00:01 dia 1');

  // 3. EMAIL CLASSIFICACIÓ SETMANAL (dilluns 09:00)
  cron.schedule('0 9 * * 1', async () => {
    try {
      console.log('📧 Enviant emails classificació setmanal...');
      await sendWeeklyRankingEmails();
    } catch (error) {
      console.error('❌ Error en cron emails setmanals:', error);
    }
  });

  console.log('  ✅ Email setmanal: dilluns 09:00');

  // 4. EXPIRAR BOOSTS TEMPORALS (cada hora)
  cron.schedule('0 * * * *', async () => {
    await expireBoosts();
  });
  
  console.log('  ✅ Expirar boosts: cada hora');
  
  // 4. GUARDAR PREUS (cada hora) - JA EXISTEIX
  // No cal tornar a crear, ja està al index.js
  console.log('  ✅ Guardar preus: cada hora (ja actiu)');
  
  console.log('⏰ ================================');
  console.log('');
}

module.exports = {
  startCronJobs,
  expireBoosts,
};