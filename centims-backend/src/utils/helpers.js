// src/utils/helpers.js
// Funcions auxiliars generals

/**
 * Obté el mes actual en format "YYYY-MM"
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Obté el mes anterior en format "YYYY-MM"
 */
function getPreviousMonth() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Obté l'últim dia d'un mes
 * @param {string} month - Format "YYYY-MM"
 * @returns {number} - Dia (28, 29, 30, 31)
 */
function getLastDayOfMonth(month) {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum), 0);
  return date.getDate();
}

/**
 * Formata un mes per mostrar ("2025-02" → "Febrer 2025")
 * @param {string} month - Format "YYYY-MM"
 * @returns {string}
 */
function formatMonth(month) {
  const months = [
    'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
  ];
  
  const [year, monthNum] = month.split('-');
  const monthName = months[parseInt(monthNum) - 1];
  return `${monthName} ${year}`;
}

/**
 * Valida format username
 * - Min 3, màx 20 caràcters
 * - Només lletres, números, guió baix
 * - No pot començar amb número
 */
function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 20) {
    return { valid: false, error: 'El username ha de tenir entre 3 i 20 caràcters' };
  }
  
  const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!regex.test(username)) {
    return { 
      valid: false, 
      error: 'El username només pot contenir lletres, números i guió baix, i ha de començar amb lletra' 
    };
  }
  
  return { valid: true };
}

/**
 * Genera username automàtic a partir del nom
 * @param {string} name - Nom real
 * @returns {string} - Username generat
 */
function generateUsername(name) {
  // Agafar primer nom i inicial segon
  const parts = name.trim().split(' ');
  let base = parts[0];
  
  if (parts.length > 1) {
    base += parts[1].charAt(0);
  }
  
  // Treure accents i caràcters especials
  base = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  
  // Afegir random
  const random = Math.random().toString(36).substring(2, 6);
  
  return `${base}_${random}`;
}

module.exports = {
  getCurrentMonth,
  getPreviousMonth,
  getLastDayOfMonth,
  formatMonth,
  validateUsername,
  generateUsername,
};
