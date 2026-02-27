// src/services/emails.js
// Servei per enviar emails amb Resend

const { Resend } = require('resend');
const { formatMonth } = require('../utils/helpers');

const resend = new Resend(process.env.RESEND_API_KEY);

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

// ============================================
// GENERADORS HTML
// ============================================

function generateWinnerEmail({ username, name, position, gainPercent, totalValue, prizeName, sponsorName, sponsorLink, month }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .stats { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .stats ul { list-style: none; padding: 0; margin: 0; }
    .stats li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .stats li:last-child { border-bottom: none; }
    .prize { background: #fff9e6; padding: 20px; margin: 20px 0; border-left: 4px solid #FFD700; border-radius: 4px; }
    .prize h3 { margin-top: 0; color: #d4a017; }
    .button { display: inline-block; padding: 12px 24px; background: #FF6B35; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Felicitats ${username}!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Enhorabona! Has quedat en <strong>${position}a posició</strong> al mes de <strong>${formatMonth(month)}</strong>!</p>
      <div class="stats">
        <h3>📊 Els teus resultats:</h3>
        <ul>
          <li><strong>Posició:</strong> ${position}º</li>
          <li><strong>Rendiment:</strong> ${gainPercent > 0 ? '+' : ''}${gainPercent.toFixed(2)}%</li>
          <li><strong>Valor final:</strong> ${totalValue.toFixed(2)}€</li>
        </ul>
      </div>
      <div class="prize">
        <h3>🎁 El teu premi:</h3>
        <p style="font-size: 18px; margin: 10px 0;"><strong>${prizeName}</strong></p>
        <p style="margin: 5px 0;">Patrocinat per: <strong>${sponsorName}</strong></p>
        ${sponsorLink ? `<a href="${sponsorLink}" class="button">🔗 Veure patrocinador</a>` : ''}
      </div>
      <p>Contactarem amb tu properament per fer-te arribar el premi.</p>
      <p style="margin-top: 30px;">Gràcies per participar!<br><strong>Equip Centims</strong></p>
    </div>
    <div class="footer">
      <p><a href="https://centims.cat" style="color: #FF6B35;">centims.cat</a></p>
    </div>
  </div>
</body>
</html>`;
}

function generateWeeklyRankingEmail({ username, userPosition, userGainPercent, userTotalValue, top10, achievements, month }) {
  const top10HTML = top10.map((rank, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    return `<tr>
      <td style="padding: 8px; text-align: center;">${medal}${rank.position}</td>
      <td style="padding: 8px;"><strong>${rank.username}</strong></td>
      <td style="padding: 8px; text-align: right; color: ${rank.gainPercent > 0 ? '#22c55e' : '#ef4444'};">
        ${rank.gainPercent > 0 ? '+' : ''}${rank.gainPercent.toFixed(1)}%
      </td>
    </tr>`;
  }).join('');

  const icons = { early_bird: '🏆', trader: '🔥', sniper: '🎯', hodler: '📈' };
  const names = { early_bird: 'Early Bird', trader: 'Trader', sniper: 'Sniper', hodler: 'HODLer' };
  const achievementsHTML = achievements.map(a =>
    `<li>${icons[a.achievementType] || '🏅'} <strong>${names[a.achievementType] || a.achievementType}:</strong> ${a.username} (${a.description})</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; }
    td { border-bottom: 1px solid #e5e7eb; }
    .your-position { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Classificació Setmanal</h1>
      <p style="margin: 0; opacity: 0.9;">${formatMonth(month)}</p>
    </div>
    <div class="content">
      <p>Hola <strong>${username}</strong>,</p>
      <h3>🏆 TOP 10</h3>
      <table>
        <thead><tr><th style="width:60px;text-align:center;">Pos</th><th>Usuari</th><th style="width:80px;text-align:right;">Guany</th></tr></thead>
        <tbody>${top10HTML}</tbody>
      </table>
      <div class="your-position">
        <h3 style="margin-top: 0;">📈 LA TEVA POSICIÓ</h3>
        <p><strong>Posició:</strong> ${userPosition}º</p>
        <p><strong>Rendiment:</strong> <span style="color: ${userGainPercent > 0 ? '#22c55e' : '#ef4444'};">${userGainPercent > 0 ? '+' : ''}${userGainPercent.toFixed(2)}%</span></p>
        <p><strong>Valor actual:</strong> ${userTotalValue.toFixed(2)}€</p>
      </div>
      <h3>🏅 ACHIEVEMENTS DEL MES</h3>
      <ul>${achievementsHTML || '<li>Encara no hi ha achievements aquest mes</li>'}</ul>
      <p style="text-align:center;margin-top:30px;">
        <a href="https://centims.cat/ranking" class="button">Veure classificació completa</a>
      </p>
      <p style="margin-top:30px;"><strong>Segueix competint!</strong><br>Equip Centims</p>
    </div>
    <div class="footer"><p><a href="https://centims.cat" style="color:#6366f1;">centims.cat</a></p></div>
  </div>
</body>
</html>`;
}

function generateWelcomeEmail({ username, name }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px; }
    .box { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
    ul { padding-left: 0; list-style: none; }
    li { padding: 6px 0; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎮 Benvingut a Centims!</h1></div>
    <div class="content">
      <p>Hola <strong>${name}</strong> (<em>@${username}</em>),</p>
      <p>Benvingut a Centims, el joc de trading cultural català! 🎉</p>
      <div class="box">
        <h3 style="margin-top:0;">💶 HAS COMENÇAT AMB:</h3>
        <p style="font-size:24px;margin:10px 0;"><strong>150€</strong></p>
        <p>Utilitza'ls per invertir en tokens culturals catalans!</p>
      </div>
      <h3>🎯 COM FUNCIONA:</h3>
      <ul>
        <li>🪙 <strong>Compra tokens</strong> culturals catalans</li>
        <li>📈 <strong>El preu puja</strong> quan més gent compra</li>
        <li>💰 <strong>Ven quan vulguis</strong> per obtenir beneficis</li>
        <li>🏆 <strong>Competeix cada mes</strong> — Els top 10 guanyen premis!</li>
      </ul>
      <h3>🏆 ACHIEVEMENTS:</h3>
      <ul>
        <li>🏆 <strong>Early Bird</strong> — Més compres primeres 24h</li>
        <li>🔥 <strong>Trader</strong> — Més transaccions del mes</li>
        <li>🎯 <strong>Sniper</strong> — Millors vendes al pic</li>
        <li>📈 <strong>HODLer</strong> — Mantenir tokens sense vendre</li>
      </ul>
      <p style="text-align:center;margin:30px 0;">
        <a href="https://centims.cat/dashboard" class="button">🏪 Anar al mercat</a>
      </p>
      <p style="margin-top:30px;"><strong>Bona sort!</strong><br>Equip Centims</p>
    </div>
    <div class="footer"><p><a href="https://centims.cat" style="color:#10b981;">centims.cat</a></p></div>
  </div>
</body>
</html>`;
}

// ============================================
// FUNCIONS D'ENVIAMENT
// ============================================

/**
 * Envia email benvinguda (al registre)
 */
async function sendWelcomeEmail(user) {
  try {
    await resend.emails.send({
      from: 'Centims <admin@centims.cat>',
      to: user.email,
      subject: '🎮 Benvingut a Centims — El joc de trading català!',
      html: generateWelcomeEmail({
        username: user.username || user.name,
        name: user.name
      })
    });

    await prisma.emailSent.create({
      data: {
        emailType: 'welcome',
        sentTo: [user.email],
        subject: '🎮 Benvingut a Centims',
        body: 'Email benvinguda automàtic',
        recipientsCount: 1
      }
    });

    console.log(`✅ Email benvinguda enviat a ${user.email}`);
  } catch (error) {
    console.error('❌ Error enviant email benvinguda:', error.message);
    // No llençar error — no bloqueja el registre
  }
}

/**
 * Envia emails guanyadors (dia 1 automàtic o manual admin)
 */
async function sendWinnersEmails(month) {
  console.log(`📧 Enviant emails guanyadors ${month}...`);

  const winners = await prisma.monthlyRanking.findMany({
    where: { month, position: { lte: 10 } },
    include: { user: true },
    orderBy: { position: 'asc' }
  });

  if (winners.length === 0) {
    console.log('  ⚠️ No hi ha guanyadors per aquest mes');
    return 0;
  }

  const prizes = await prisma.monthlyPrize.findMany({
    where: { month },
    orderBy: { position: 'asc' }
  });

  const emailsSent = [];

  for (const winner of winners) {
    const prize = prizes.find(p => p.position === winner.position);
    if (!prize?.prizeName) continue;

    await resend.emails.send({
      from: 'Centims <admin@centims.cat>',
      to: winner.user.email,
      subject: `🏆 Felicitats! Has guanyat un premi a Centims — ${formatMonth(month)}`,
      html: generateWinnerEmail({
        username: winner.username,
        name: winner.user.name,
        position: winner.position,
        gainPercent: winner.gainPercent,
        totalValue: winner.totalValue,
        prizeName: prize.prizeName,
        sponsorName: prize.sponsorName || 'Centims',
        sponsorLink: prize.sponsorLink,
        month
      })
    });

    emailsSent.push(winner.user.email);
    console.log(`  ✅ Email enviat a ${winner.username} (pos ${winner.position})`);
  }

  await prisma.emailSent.create({
    data: {
      emailType: 'winners',
      sentTo: emailsSent,
      subject: `🏆 Guanyadors ${formatMonth(month)}`,
      body: `Emails guanyadors del mes ${month}`,
      month,
      recipientsCount: emailsSent.length
    }
  });

  console.log(`✅ ${emailsSent.length} emails guanyadors enviats`);
  return emailsSent.length;
}

module.exports = {
  sendWelcomeEmail,
  sendWinnersEmails,
  generateWeeklyRankingEmail,
};
