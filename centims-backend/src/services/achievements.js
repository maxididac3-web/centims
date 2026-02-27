// src/services/achievements.js
// Càlcul dels 4 achievements mensuals

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * 🏆 EARLY BIRD DEL MES
 * Usuari amb més compres en les primeres 24h de tokens nous
 */
async function calculateEarlyBird(month) {
  try {
    const [year, monthNum] = month.split('-');
    
    const stats = await prisma.$queryRaw`
      SELECT 
        t.user_id, 
        u.username, 
        COUNT(*) as early_purchases
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.user_id = u.id
      WHERE t.transaction_type = 'BUY'
        AND t.created_at <= p.created_at + INTERVAL '24 hours'
        AND EXTRACT(MONTH FROM t.created_at) = ${parseInt(monthNum)}
        AND EXTRACT(YEAR FROM t.created_at) = ${parseInt(year)}
      GROUP BY t.user_id, u.username
      ORDER BY early_purchases DESC
      LIMIT 1
    `;
    
    if (stats && stats.length > 0 && stats[0].early_purchases > 0) {
      return {
        userId: stats[0].user_id,
        username: stats[0].username,
        metricValue: parseFloat(stats[0].early_purchases),
        description: `${stats[0].early_purchases} compres en primeres 24h`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calculant Early Bird:', error);
    return null;
  }
}

/**
 * 🔥 TRADER DEL MES
 * Usuari amb més transaccions totals
 */
async function calculateTrader(month) {
  try {
    const [year, monthNum] = month.split('-');
    
    const stats = await prisma.$queryRaw`
      SELECT 
        t.user_id,
        u.username,
        COUNT(*) as total_transactions
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE EXTRACT(MONTH FROM t.created_at) = ${parseInt(monthNum)}
        AND EXTRACT(YEAR FROM t.created_at) = ${parseInt(year)}
      GROUP BY t.user_id, u.username
      ORDER BY total_transactions DESC
      LIMIT 1
    `;
    
    if (stats && stats.length > 0 && stats[0].total_transactions > 0) {
      return {
        userId: stats[0].user_id,
        username: stats[0].username,
        metricValue: parseFloat(stats[0].total_transactions),
        description: `${stats[0].total_transactions} transaccions`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calculant Trader:', error);
    return null;
  }
}

/**
 * 🎯 SNIPER DEL MES
 * Usuari amb més vendes a >95% del preu màxim del token durant el mes
 */
async function calculateSniper(month) {
  try {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(year, parseInt(monthNum), 0); // Últim dia del mes
    
    // Obtenir tots els tokens actius
    const tokens = await prisma.product.findMany({
      where: { isActive: true }
    });
    
    let sniperCounts = {};
    
    for (const token of tokens) {
      // Trobar preu màxim del token aquest mes
      const maxPriceRecord = await prisma.priceHistory.findFirst({
        where: {
          productId: token.id,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          price: 'desc'
        }
      });
      
      if (!maxPriceRecord) continue;
      
      const maxPrice = maxPriceRecord.price;
      const threshold = maxPrice * 0.95; // 95% del màxim
      
      // Trobar vendes a >95% del màxim
      const sniperSells = await prisma.transaction.findMany({
        where: {
          productId: token.id,
          transactionType: 'SELL',
          pricePerFraction: { gte: threshold },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { user: true }
      });
      
      // Comptar per usuari
      for (const sell of sniperSells) {
        if (!sniperCounts[sell.userId]) {
          sniperCounts[sell.userId] = {
            count: 0,
            username: sell.user.username
          };
        }
        sniperCounts[sell.userId].count++;
      }
    }
    
    // Trobar el millor
    const entries = Object.entries(sniperCounts);
    if (entries.length === 0) return null;
    
    const [userId, data] = entries.sort((a, b) => b[1].count - a[1].count)[0];
    
    return {
      userId: parseInt(userId),
      username: data.username,
      metricValue: data.count,
      description: `${data.count} vendes al pic (>95% màxim)`
    };
    
  } catch (error) {
    console.error('Error calculant Sniper:', error);
    return null;
  }
}

/**
 * 📈 HODLER DEL MES
 * Usuari amb més tokens diferents que NO ha venut gens durant el mes
 */
async function calculateHODLer(month) {
  try {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(year, parseInt(monthNum), 0);
    
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });
    
    let holdCounts = {};
    
    for (const user of users) {
      // Agrupar transaccions per token
      const tokenTransactions = {};
      
      for (const tx of user.transactions) {
        if (!tokenTransactions[tx.productId]) {
          tokenTransactions[tx.productId] = { buys: 0, sells: 0 };
        }
        
        if (tx.transactionType === 'BUY') {
          tokenTransactions[tx.productId].buys++;
        } else {
          tokenTransactions[tx.productId].sells++;
        }
      }
      
      // Comptar tokens amb compres però 0 vendes
      let holdTokens = 0;
      for (const [tokenId, counts] of Object.entries(tokenTransactions)) {
        if (counts.buys > 0 && counts.sells === 0) {
          holdTokens++;
        }
      }
      
      if (holdTokens > 0) {
        holdCounts[user.id] = {
          count: holdTokens,
          username: user.username
        };
      }
    }
    
    // Trobar el millor
    const entries = Object.entries(holdCounts);
    if (entries.length === 0) return null;
    
    const [userId, data] = entries.sort((a, b) => b[1].count - a[1].count)[0];
    
    return {
      userId: parseInt(userId),
      username: data.username,
      metricValue: data.count,
      description: `${data.count} tokens mantinguts sense vendre`
    };
    
  } catch (error) {
    console.error('Error calculant HODLer:', error);
    return null;
  }
}

/**
 * FUNCIÓ PRINCIPAL: Calcula tots els achievements del mes
 */
async function calculateMonthlyAchievements(month) {
  console.log(`🏆 Calculant achievements ${month}...`);
  
  const achievements = [];
  
  try {
    // 1. Early Bird
    const earlyBird = await calculateEarlyBird(month);
    if (earlyBird) {
      achievements.push({
        month,
        achievementType: 'early_bird',
        ...earlyBird
      });
      console.log(`  🏆 Early Bird: ${earlyBird.username} (${earlyBird.metricValue})`);
    }
    
    // 2. Trader
    const trader = await calculateTrader(month);
    if (trader) {
      achievements.push({
        month,
        achievementType: 'trader',
        ...trader
      });
      console.log(`  🔥 Trader: ${trader.username} (${trader.metricValue})`);
    }
    
    // 3. Sniper
    const sniper = await calculateSniper(month);
    if (sniper) {
      achievements.push({
        month,
        achievementType: 'sniper',
        ...sniper
      });
      console.log(`  🎯 Sniper: ${sniper.username} (${sniper.metricValue})`);
    }
    
    // 4. HODLer
    const hodler = await calculateHODLer(month);
    if (hodler) {
      achievements.push({
        month,
        achievementType: 'hodler',
        ...hodler
      });
      console.log(`  📈 HODLer: ${hodler.username} (${hodler.metricValue})`);
    }
    
    // Guardar tots a la BD
    for (const ach of achievements) {
      await prisma.monthlyAchievement.create({ data: ach });
      
      // Incrementar counter usuari
      await prisma.user.update({
        where: { id: ach.userId },
        data: { totalAchievements: { increment: 1 } }
      });
    }
    
    console.log(`✅ ${achievements.length} achievements guardats`);
    return achievements;
    
  } catch (error) {
    console.error('❌ Error calculant achievements:', error);
    throw error;
  }
}

module.exports = {
  calculateMonthlyAchievements,
  calculateEarlyBird,
  calculateTrader,
  calculateSniper,
  calculateHODLer,
};