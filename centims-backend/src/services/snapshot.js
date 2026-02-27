// src/services/snapshot.js
// Snapshot de la classificació mensual (executa 23:59:59 últim dia mes)

const { calculatePriceWithBoosts } = require('../utils/pricing');

// Importar prisma des de l'instància compartida
const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Genera snapshot de la classificació mensual
 * @param {string} month - Format "YYYY-MM"
 */
async function snapshotMonthlyRanking(month) {
  console.log(`📊 Generant snapshot classificació ${month}...`);
  
  try {
    // Obtenir tots els usuaris amb els seus portfolios
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'USER' // Només usuaris normals, no admins
      },
      include: {
        portfolios: {
          include: {
            product: true
          }
        }
      }
    });
    
    const rankings = [];
    
    for (const user of users) {
      // Calcular valor total portfolios
      let spotValue = 0;
      let investedValue = 0;
      const tokensOwned = [];
      
      for (const portfolio of user.portfolios) {
        // Preu actual amb boosts
        const currentPrice = calculatePriceWithBoosts(portfolio.product);
        
        // Valor actual (spot)
        spotValue += portfolio.fractions * currentPrice;
        
        // Valor invertit (cost original)
        investedValue += portfolio.fractions * portfolio.averageBuyPrice;
        
        // Llista de tokens
        tokensOwned.push(`${portfolio.product.emoji} ${portfolio.product.name}`);
      }
      
      // Valor total = saldo disponible + valor portfolios
      const totalValue = user.balanceEUR + spotValue;
      
      // Percentatge guany/pèrdua (sobre 150€ inicials)
      const gainPercent = ((totalValue - 150) / 150) * 100;
      
      rankings.push({
        userId: user.id,
        username: user.username,
        tokensSnapshot: tokensOwned,
        balanceEUR: user.balanceEUR,
        investedValue,
        spotValue,
        totalValue,
        gainPercent,
        achievedAt: new Date() // Timestamp per desempat
      });
    }
    
    // Ordenar per totalValue DESC
    rankings.sort((a, b) => {
      // Si mateix valor, qui va arribar primer (timestamp)
      if (Math.abs(a.totalValue - b.totalValue) < 0.01) {
        return a.achievedAt - b.achievedAt;
      }
      return b.totalValue - a.totalValue;
    });
    
    // Guardar top 50 amb posicions
    const top50 = rankings.slice(0, 50);
    
    for (let i = 0; i < top50.length; i++) {
      await prisma.monthlyRanking.create({
        data: {
          month,
          position: i + 1,
          ...top50[i]
        }
      });
    }
    
    // Actualitzar millor posició usuaris
    for (let i = 0; i < rankings.length; i++) {
      const user = await prisma.user.findUnique({
        where: { id: rankings[i].userId }
      });
      
      if (!user.bestPosition || (i + 1) < user.bestPosition) {
        await prisma.user.update({
          where: { id: rankings[i].userId },
          data: {
            bestPosition: i + 1,
            bestPositionMonth: month
          }
        });
      }
    }
    
    console.log(`✅ Snapshot ${month} guardat: ${top50.length} usuaris`);
    return top50;
    
  } catch (error) {
    console.error(`❌ Error generant snapshot ${month}:`, error);
    throw error;
  }
}

module.exports = {
  snapshotMonthlyRanking,
};