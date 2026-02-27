// src/services/tokenManagement.js
// Gestió de tokens temporals i permanents al canvi de mes

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Gestiona els tokens al començar un nou mes
 * - Inactiva tokens temporals del mes passat
 * - Reset supply tokens permanents
 * - Desactiva tots els boosts temporals
 * 
 * @param {string} newMonth - Mes nou format "YYYY-MM"
 */
async function manageSeasonalTokens(newMonth) {
  console.log(`🪙 Gestionant tokens per temporada ${newMonth}...`);
  
  try {
    // 1. Inactivar tokens temporals del mes passat
    const inactivated = await prisma.product.updateMany({
      where: {
        isPermanent: false,
        isActive: true,
        season: {
          not: newMonth
        }
      },
      data: {
        isActive: false
      }
    });
    
    console.log(`  ⏳ ${inactivated.count} tokens temporals inactivats`);
    
    // 2. Reset supply tokens permanents (tornen al preu p0)
    const resetSupply = await prisma.product.updateMany({
      where: {
        isPermanent: true,
        isActive: true
      },
      data: {
        supply: 0
      }
    });
    
    console.log(`  🌟 ${resetSupply.count} tokens permanents resetejats`);
    
    // 3. Desactivar tots els boosts temporals
    const resetBoosts = await prisma.product.updateMany({
      where: {
        boostActive: true
      },
      data: {
        boostActive: false,
        boostValue: 1.0,
        boostExpiresAt: null,
        boostDescription: null
      }
    });
    
    console.log(`  🔥 ${resetBoosts.count} boosts temporals desactivats`);
    
    console.log(`✅ Gestió tokens completada`);
    
    return {
      inactivated: inactivated.count,
      resetSupply: resetSupply.count,
      resetBoosts: resetBoosts.count
    };
    
  } catch (error) {
    console.error('❌ Error gestionant tokens:', error);
    throw error;
  }
}

/**
 * Dona fraccions gratis al creador d'un token quan s'accepta
 * @param {number} productId - ID del token
 * @param {number} userId - ID del creador
 */
async function grantCreatorReward(productId, userId) {
  try {
    const CREATOR_REWARD = 10; // 10 fraccions gratis
    
    // Comprovar si el token existeix
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Token no trobat');
    }
    
    // Crear o actualitzar portfolio
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
    
    if (existingPortfolio) {
      // Ja té fraccions, afegir més
      await prisma.portfolio.update({
        where: { id: existingPortfolio.id },
        data: {
          fractions: {
            increment: CREATOR_REWARD
          }
        }
      });
    } else {
      // Crear nou portfolio
      await prisma.portfolio.create({
        data: {
          userId,
          productId,
          fractions: CREATOR_REWARD,
          investedEUR: 0,
          avgPrice: product.p0 // Preu inicial
        }
      });
    }
    
    // Incrementar supply del token
    await prisma.product.update({
      where: { id: productId },
      data: {
        supply: {
          increment: CREATOR_REWARD
        }
      }
    });
    
    console.log(`🎁 ${CREATOR_REWARD} fraccions donades al creador (user ${userId})`);
    
    return CREATOR_REWARD;
    
  } catch (error) {
    console.error('❌ Error donant recompensa creador:', error);
    throw error;
  }
}

module.exports = {
  manageSeasonalTokens,
  grantCreatorReward,
};