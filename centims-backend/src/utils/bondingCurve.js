// src/utils/bondingCurve.js

// Calcula el preu actual segons el supply
const calculatePrice = (P0, k, supply) => {
  return P0 * (1 + k * supply);
};

// Calcula el cost total de comprar X fraccions (integral)
const calculateCostForFractions = (P0, k, currentSupply, fractionsToBuy) => {
  const S1 = currentSupply;
  const S2 = currentSupply + fractionsToBuy;
  const integral1 = P0 * (S1 + (k * S1 * S1) / 2);
  const integral2 = P0 * (S2 + (k * S2 * S2) / 2);
  return integral2 - integral1;
};

// Calcula quantes fraccions pots comprar amb X EUR (cerca binària)
const calculateFractionsFromEUR = (amountEUR, P0, k, currentSupply) => {
  let low = 0;
  let high = amountEUR / P0;
  let iterations = 0;
  const maxIterations = 50;
  const tolerance = 0.0001;

  while (iterations < maxIterations && (high - low) > tolerance) {
    const mid = (low + high) / 2;
    const cost = calculateCostForFractions(P0, k, currentSupply, mid);

    if (Math.abs(cost - amountEUR) < tolerance) {
      return mid;
    }

    if (cost < amountEUR) {
      low = mid;
    } else {
      high = mid;
    }

    iterations++;
  }

  return (low + high) / 2;
};

// Calcula quants EUR recuperes venent X fraccions (integral inversa)
const calculateEURFromFractions = (fractions, P0, k, currentSupply) => {
  const S1 = currentSupply - fractions;
  const S2 = currentSupply;
  const integral1 = P0 * (S1 + (k * S1 * S1) / 2);
  const integral2 = P0 * (S2 + (k * S2 * S2) / 2);
  return integral2 - integral1;
};

// Processa una compra (mint)
const processBuy = (amountEUR, product, adminRate = 0.01) => {
  const userFractions = calculateFractionsFromEUR(
    amountEUR,
    product.p0,
    product.k,
    product.supply
  );

  const adminFractions = userFractions * adminRate;
  const totalFractionsMinted = userFractions + adminFractions;

  const newSupply = product.supply + totalFractionsMinted;
  const newPrice = calculatePrice(product.p0, product.k, newSupply);
  const avgPurchasePrice = amountEUR / userFractions;

  return {
    userFractions,
    adminFractions,
    totalFractions: totalFractionsMinted,
    newSupply,
    newPrice,
    avgPurchasePrice,
  };
};

// Processa una venda (burn)
const processSell = (fractions, product) => {
  const eurRecovered = calculateEURFromFractions(
    fractions,
    product.p0,
    product.k,
    product.supply
  );

  const newSupply = product.supply - fractions;
  const newPrice = calculatePrice(product.p0, product.k, newSupply);
  const avgSellPrice = eurRecovered / fractions;

  return {
    eurRecovered,
    newSupply,
    newPrice,
    avgSellPrice,
  };
};

module.exports = {
  calculatePrice,
  calculateFractionsFromEUR,
  calculateEURFromFractions,
  processBuy,
  processSell,
};