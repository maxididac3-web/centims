// src/services/weeklyemails.js
// Email classificació setmanal (dilluns 09:00)

const { Resend } = require('resend');
const { getCurrentMonth } = require('../utils/helpers');
const { generateWeeklyRankingEmail } = require('./emails');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * Calcula la classificació actual en temps real
 */
async function calculateCurrentRankings() {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: 'USER' },
    include: {
      portfolios: {
        include: { product: true }
      }
    }
  });

  const rankings = [];

  for (const user of users) {
    let spotValue = 0;

    for (const portfolio of user.portfolios) {
      const p = portfolio.product;
      // Preu amb boost si actiu
      const basePrice = parseFloat(p.p0) * (1 + parseFloat(p.k) * parseFloat(p.supply));
      const price = p.boostActive ? basePrice * parseFloat(p.boostValue) : basePrice;
      spotValue += portfolio.fractions * price;
    }

    const totalValue = user.balanceEUR + spotValue;
    const gainPercent = ((totalValue - 150) / 150) * 100;

    rankings.push({
      userId: user.id,
      username: user.username || user.name,
      email: user.email,
      totalValue,
      gainPercent
    });
  }

  rankings.sort((a, b) => b.totalValue - a.totalValue);
  rankings.forEach((rank, i) => { rank.position = i + 1; });

  return rankings;
}

/**
 * Envia email de classificació setmanal a tots els usuaris actius
 */
async function sendWeeklyRankingEmails() {
  console.log('📧 Enviant emails classificació setmanal...');

  const currentMonth = getCurrentMonth();
  const rankings = await calculateCurrentRankings();

  if (rankings.length === 0) {
    console.log('  ⚠️ No hi ha usuaris per enviar');
    return 0;
  }

  const achievements = await prisma.monthlyAchievement.findMany({
    where: { month: currentMonth }
  });

  const top10 = rankings.slice(0, 10);
  const emailsSent = [];

  for (const user of rankings) {
    try {
      await resend.emails.send({
        from: 'Centims <admin@centims.cat>',
        to: user.email,
        subject: `📊 Classificació setmanal Centims — ${currentMonth}`,
        html: generateWeeklyRankingEmail({
          username: user.username,
          userPosition: user.position,
          userGainPercent: user.gainPercent,
          userTotalValue: user.totalValue,
          top10,
          achievements,
          month: currentMonth
        })
      });

      emailsSent.push(user.email);

      // Pausa per no saturar l'API
      if (emailsSent.length % 10 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`  ❌ Error enviant a ${user.email}:`, err.message);
    }
  }

  await prisma.emailSent.create({
    data: {
      emailType: 'weekly_ranking',
      sentTo: emailsSent,
      subject: `📊 Classificació setmanal Centims`,
      body: `Classificació setmanal automàtica ${currentMonth}`,
      month: currentMonth,
      recipientsCount: emailsSent.length
    }
  });

  console.log(`✅ ${emailsSent.length} emails setmanals enviats`);
  return emailsSent.length;
}

module.exports = {
  sendWeeklyRankingEmails,
  calculateCurrentRankings,
};
