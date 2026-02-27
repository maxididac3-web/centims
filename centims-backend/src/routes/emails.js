// src/routes/emails.js
// Endpoints admin per gestionar emails

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { sendWinnersEmails } = require('../services/emails');
const { sendWeeklyRankingEmails, calculateCurrentRankings } = require('../services/weeklyemails');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * POST /emails/send-winners (ADMIN)
 * Envia emails guanyadors d'un mes manualment
 */
router.post('/send-winners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Format mes invàlid (usa YYYY-MM)' });
    }

    const count = await sendWinnersEmails(month);
    res.json({ message: 'Emails guanyadors enviats', count, month });

  } catch (error) {
    console.error('Error send-winners:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * POST /emails/send-weekly (ADMIN)
 * Envia email de classificació setmanal manualment
 */
router.post('/send-weekly', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const count = await sendWeeklyRankingEmails();
    res.json({ message: 'Emails setmanals enviats', count });

  } catch (error) {
    console.error('Error send-weekly:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * POST /emails/send-custom (ADMIN)
 * Envia email personalitzat a una llista de destinataris
 */
router.post('/send-custom', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;

    if (!recipients?.length || !subject || !body) {
      return res.status(400).json({ error: 'recipients, subject i body són obligatoris' });
    }

    const emailsSent = [];
    for (const email of recipients) {
      await resend.emails.send({
        from: 'Centims <admin@centims.cat>',
        to: email,
        subject,
        html: `<div style="font-family:sans-serif;padding:20px;max-width:600px;margin:auto;">${body.replace(/\n/g, '<br>')}<br><br><hr style="border:none;border-top:1px solid #eee;"><p style="color:#999;font-size:12px;text-align:center;"><a href="https://centims.cat">centims.cat</a></p></div>`
      });
      emailsSent.push(email);
    }

    await prisma.emailSent.create({
      data: {
        emailType: 'custom',
        sentTo: emailsSent,
        subject,
        body,
        recipientsCount: emailsSent.length,
        sentBy: req.user.id
      }
    });

    res.json({ message: 'Emails personalitzats enviats', count: emailsSent.length });

  } catch (error) {
    console.error('Error send-custom:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /emails/history (ADMIN)
 * Historial d'emails enviats
 */
router.get('/history', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const where = type ? { emailType: type } : {};

    const [emails, total] = await Promise.all([
      prisma.emailSent.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.emailSent.count({ where })
    ]);

    res.json({
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error history:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /emails/recipients (ADMIN)
 * Destinataris disponibles per enviar emails
 */
router.get('/recipients', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let users = [];

    if (type === 'top10') {
      const rankings = await calculateCurrentRankings();
      users = rankings.slice(0, 10).map(r => ({
        id: r.userId,
        email: r.email,
        username: r.username
      }));
    } else {
      users = await prisma.user.findMany({
        where: { isActive: true, role: 'USER' },
        select: { id: true, email: true, username: true }
      });
    }

    res.json({ type, count: users.length, users });

  } catch (error) {
    console.error('Error recipients:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * POST /emails/contact (PÚBLIC)
 * Envia un missatge de contacte a info@centims.cat
 */
router.post('/contact', async (req, res) => {
  try {
    const { nom, email, assumpte, missatge } = req.body;

    if (!nom || !email || !missatge) {
      return res.status(400).json({ error: 'nom, email i missatge són obligatoris' });
    }

    // Validació bàsica de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Adreça electrònica no vàlida' });
    }

    const subject = assumpte?.trim() || `Contacte de ${nom}`;

    await resend.emails.send({
      from: 'Centims <admin@centims.cat>',
      to: 'info@centims.cat',
      replyTo: email,
      subject: `📬 [Contacte] ${subject}`,
      html: `
        <div style="font-family:sans-serif;padding:24px;max-width:600px;margin:auto;background:#FAFAF8;border-radius:12px;">
          <div style="border-bottom:3px solid #C9A84C;padding-bottom:16px;margin-bottom:24px;">
            <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin:0;">📬 Nou missatge de contacte</h2>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#6B6B60;font-size:13px;width:100px;vertical-align:top;">Nom</td><td style="padding:8px 0;color:#0A0A0A;font-weight:600;">${nom}</td></tr>
            <tr><td style="padding:8px 0;color:#6B6B60;font-size:13px;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#C9A84C;text-decoration:none;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6B6B60;font-size:13px;vertical-align:top;">Assumpte</td><td style="padding:8px 0;color:#0A0A0A;">${subject}</td></tr>
          </table>
          <div style="background:#FFFFFF;border:1px solid #E8E8E0;border-radius:10px;padding:20px;">
            <p style="color:#6B6B60;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">Missatge</p>
            <p style="color:#0A0A0A;line-height:1.7;margin:0;white-space:pre-wrap;">${missatge}</p>
          </div>
          <p style="color:#9B9B90;font-size:12px;text-align:center;margin-top:24px;">
            Pots respondre directament a aquest email per contestar a ${nom}.
          </p>
          <hr style="border:none;border-top:1px solid #E8E8E0;margin:16px 0;">
          <p style="color:#9B9B90;font-size:11px;text-align:center;margin:0;">
            <a href="https://centims.cat" style="color:#C9A84C;text-decoration:none;">centims.cat</a>
          </p>
        </div>
      `,
    });

    // Registrem l'email a la base de dades
    await prisma.emailSent.create({
      data: {
        emailType: 'contact',
        sentTo: ['info@centims.cat'],
        subject: `[Contacte] ${subject}`,
        body: `De: ${nom} <${email}>\n\n${missatge}`,
        recipientsCount: 1,
      }
    });

    res.json({ ok: true, message: 'Missatge enviat correctament' });

  } catch (error) {
    console.error('Error /emails/contact:', error);
    res.status(500).json({ error: 'Error del servidor en enviar el missatge' });
  }
});

module.exports = router;
