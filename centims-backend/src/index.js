// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Importar rutes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const proposalsRoutes = require('./routes/proposals');
const { startCronJobs } = require('./services/cronjobs');
const usersRoutes = require('./routes/users');
const rankingsRoutes = require('./routes/rankings');
const prizesRoutes = require('./routes/prizes');
const achievementsRoutes = require('./routes/achievements');
const emailsRoutes = require('./routes/emails');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Origins permesos (local + producció)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://centims.cat',
  'https://www.centims.cat',
  'https://centims.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers (IMPORTANT!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTES
// ============================================
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/transactions', transactionRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/admin', adminRoutes);
app.use('/proposals', proposalsRoutes);
app.use('/users', usersRoutes);
app.use('/rankings', rankingsRoutes);
app.use('/prizes', prizesRoutes);
app.use('/achievements', achievementsRoutes);
app.use('/emails', emailsRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Centims API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// RUTA NO TROBADA
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no trobada.',
    path: req.originalUrl,
  });
});

// ============================================
// CRON JOB - GUARDAR PREUS CADA HORA
// ============================================
const calculatePrice = (p0, k, supply) => {
  return parseFloat(p0) * (1 + parseFloat(k) * parseFloat(supply));
};

const savePriceSnapshot = async () => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
    });

    if (products.length === 0) return;

    const snapshots = products.map(product => ({
      productId: product.id,
      price: calculatePrice(product.p0, product.k, product.supply),
      supply: product.supply,
    }));

    await prisma.priceHistory.createMany({ data: snapshots });

    console.log(`📊 [Cron] Preus guardats per ${products.length} tokens (${new Date().toLocaleTimeString('ca-ES')})`);
  } catch (error) {
    console.error('❌ [Cron] Error guardant preus:', error.message);
  }
};

const startCronJob = () => {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hora

  // Primer snapshot als 5 segons d'arrencar (per no bloquejar l'inici)
  setTimeout(savePriceSnapshot, 5000);

  // Snapshots cada hora
  setInterval(savePriceSnapshot, INTERVAL_MS);

  console.log('⏰ Cron job de preus actiu (cada hora)');
};

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, async () => {
  console.log('');
  console.log('🪙 ================================');
  console.log('🪙  CENTIMS API');
  console.log('🪙 ================================');
  console.log(`🚀 Servidor corrent a: http://localhost:${PORT}`);
  console.log(`🥁 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Entorn: ${process.env.NODE_ENV}`);
  console.log('🪙 ================================');
  console.log('');


  // Verificar connexió DB
  try {
    await prisma.$connect();
    console.log('✅ Base de dades connectada correctament!');

    // Iniciar cron job
    startCronJobs();
    startCronJob();

  } catch (error) {
    console.error('❌ Error connectant a la base de dades:', error);
  }
});

module.exports = app;