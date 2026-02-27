// src/services/liquidation.js
// Liquidació automàtica de tots els portfolios (executa dia 1, 00:01)

const { calculatePriceWithBoosts } = require('../utils/pricing');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Liquida tots els portfolios de tots els usuaris
 * Ven tots els tokens al preu actual i actualitza saldos
 */
async function liquidateAllPortfolios() {
  console.log('💰 Liquidant tots els portfolios...');
  
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        product: true,
        user: true
      }
    });
    
    let totalLiquidated = 0;
    
    for (const portfolio of portfolios) {
      // Preu actual amb boosts
      const currentPrice = calculatePriceWithBoosts(portfolio.product);
      
      // Spread de venda (1.5%)
      const SELL_SPREAD = 0.015;
      const sellValue = portfolio.fractions * currentPrice * (1 - SELL_SPREAD);
      
      // Actualitzar saldo usuari
      await prisma.user.update({
        where: { id: portfolio.userId },
        data: {
          balanceEUR: {
            increment: sellValue
          }
        }
      });
      
      // Reduir supply del token
      await prisma.product.update({
        where: { id: portfolio.productId },
        data: {
          supply: {
            decrement: portfolio.fractions
          }
        }
      });
      
      // Crear transacció de liquidació
      await prisma.transaction.create({
        data: {
          userId: portfolio.userId,
          productId: portfolio.productId,
          transactionType: 'SELL',
          fractions: portfolio.fractions,
          pricePerFraction: currentPrice,
          totalEUR: sellValue,
          description: 'Liquidació automàtica fi de mes'
        }
      });
      
      // Eliminar portfolio
      await prisma.portfolio.delete({
        where: { id: portfolio.id }
      });
      
      totalLiquidated++;
    }
    
    console.log(`✅ ${totalLiquidated} portfolios liquidats`);
    return totalLiquidated;
    
  } catch (error) {
    console.error('❌ Error liquidant portfolios:', error);
    throw error;
  }
}

module.exports = {
  liquidateAllPortfolios,
};