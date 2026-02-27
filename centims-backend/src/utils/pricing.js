// src/utils/pricing.js
// Utilitats per càlcul de preus amb boosts

/**
 * Calcula el preu d'un token aplicant bonding curve + boosts
 * @param {Object} product - Objecte product de Prisma
 * @returns {number} - Preu final amb tots els multiplicadors
 */
function calculatePriceWithBoosts(product) {
  // Preu base bonding curve
  let price = product.p0 * (1 + product.k * product.supply);
  
  // Multiplicador estacional (ex: Calçots desembre-març)
  // Suporta valors > 1 (pujada) i < 1 (baixada, ex: 0.85)
  if (product.seasonalMultiplier && product.seasonalMultiplier !== 1.0) {
    price *= product.seasonalMultiplier;
  }
  
  // Boost temporal/event (ex: Barça guanya Champions)
  if (product.boostActive && product.boostExpiresAt) {
    const now = new Date();
    if (now < product.boostExpiresAt) {
      price *= product.boostValue;
    }
  }
  
  return price;
}

/**
 * Calcula preu de compra (amb spread)
 */
function calculateBuyPrice(product) {
  const basePrice = calculatePriceWithBoosts(product);
  const BUY_SPREAD = 0.015; // 1.5%
  return basePrice * (1 + BUY_SPREAD);
}

/**
 * Calcula preu de venda (amb spread)
 */
function calculateSellPrice(product) {
  const basePrice = calculatePriceWithBoosts(product);
  const SELL_SPREAD = 0.015; // 1.5%
  return basePrice * (1 - SELL_SPREAD);
}

module.exports = {
  calculatePriceWithBoosts,
  calculateBuyPrice,
  calculateSellPrice,
};
