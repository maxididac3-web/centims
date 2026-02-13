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
];

// Afegir URL de Vercel si existeix (producció)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Afegir preview deploys de Vercel (automàtic)
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

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
    startCronJob();

  } catch (error) {
    console.error('❌ Error connectant a la base de dades:', error);
  }
});

module.exports = app;
