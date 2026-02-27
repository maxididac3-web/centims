// src/services/monthlyReset.js
// Orquestrador principal del reset mensual

const { getCurrentMonth, getPreviousMonth } = require('../utils/helpers');
const { snapshotMonthlyRanking } = require('./snapshot');
const { calculateMonthlyAchievements } = require('./achievements');
const { liquidateAllPortfolios } = require('./liquidation');
const { manageSeasonalTokens } = require('./tokenManagement');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Reset de saldos: tots els usuaris tornen a 150€
 */
async function resetAllBalances() {
  console.log('💶 Resetejant saldos a 150€...');
  
  try {
    const result = await prisma.user.updateMany({
      where: {
        role: 'USER' // Només usuaris normals, no admins
      },
      data: {
        balanceEUR: 150.00
      }
    });
    
    console.log(`✅ ${result.count} saldos resetejats`);
    return result.count;
    
  } catch (error) {
    console.error('❌ Error resetejant saldos:', error);
    throw error;
  }
}

/**
 * FUNCIÓ PRINCIPAL: Executa tot el reset mensual
 * Executa automàticament dia 1 de cada mes a les 00:01
 */
async function executeMonthlyReset() {
  const lastMonth = getPreviousMonth();
  const newMonth = getCurrentMonth();
  
  console.log('');
  console.log('🔄 ================================');
  console.log(`🔄 RESET MENSUAL: ${lastMonth} → ${newMonth}`);
  console.log('🔄 ================================');
  console.log('');
  
  try {
    // FASE 1: Snapshot classificació mes que acaba
    console.log('📊 FASE 1: Snapshot classificació');
    console.log('─────────────────────────────────');
    await snapshotMonthlyRanking(lastMonth);
    console.log('');
    
    // FASE 2: Calcular achievements mes que acaba
    console.log('🏆 FASE 2: Càlcul achievements');
    console.log('─────────────────────────────────');
    await calculateMonthlyAchievements(lastMonth);
    console.log('');
    
    // FASE 3: Liquidar tots els portfolios
    console.log('💰 FASE 3: Liquidació portfolios');
    console.log('─────────────────────────────────');
    await liquidateAllPortfolios();
    console.log('');
    
    // FASE 4: Reset saldos a 150€
    console.log('💶 FASE 4: Reset saldos');
    console.log('─────────────────────────────────');
    await resetAllBalances();
    console.log('');
    
    // FASE 5: Gestionar tokens temporals/permanents
    console.log('🪙 FASE 5: Gestió tokens');
    console.log('─────────────────────────────────');
    await manageSeasonalTokens(newMonth);
    console.log('');
    
    console.log('🔄 ================================');
    console.log(`✅ RESET COMPLETAT: ${newMonth}`);
    console.log('🔄 ================================');
    console.log('');
    
    return {
      success: true,
      lastMonth,
      newMonth,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('🔄 ================================');
    console.error('❌ ERROR EN RESET MENSUAL');
    console.error('🔄 ================================');
    console.error(error);
    console.error('');
    
    // TODO: Alertar admin per email
    
    throw error;
  }
}

/**
 * Executa només el snapshot (per cridar manualment a les 23:59)
 */
async function executeMonthlySnapshot() {
  const currentMonth = getCurrentMonth();
  
  console.log(`📊 Executant snapshot manual per ${currentMonth}...`);
  
  try {
    await snapshotMonthlyRanking(currentMonth);
    await calculateMonthlyAchievements(currentMonth);
    
    console.log('✅ Snapshot completat');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error en snapshot:', error);
    throw error;
  }
}

module.exports = {
  executeMonthlyReset,
  executeMonthlySnapshot,
  resetAllBalances,
};