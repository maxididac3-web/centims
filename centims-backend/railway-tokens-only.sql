-- ════════════════════════════════════════════════════════════
-- SQL PER CREAR NOMÉS TOKENS (sense admin de moment)
-- ════════════════════════════════════════════════════════════

-- NOTA: created_by serà NULL de moment (després l'actualitzarem amb l'ID de l'admin)

INSERT INTO products (name, emoji, ticker, description, p0, k, supply, is_active)
VALUES 
  ('Calçot 4K', '🧅', 'CL4K', 'Calçot 4K és la versió d''alta definició d''un ritual ancestral.', 0.15, 0.0001, 0, true),
  ('Omilies d''Organyà', '⛪', 'ORGA', 'Les Omilies d''Organyà són com el primer "hola món" del català escrit.', 0.2, 0.0001, 0, true),
  ('Yamin Lamal', '⚽', 'YALA', 'Talent precoç que redefineix el futur del futbol.', 0.12, 0.0001, 0, true),
  ('Moreneta Sable', '🗿', 'MSBL', 'Icona amb actitud: tradició i fermesa.', 0.18, 0.0001, 0, true),
  ('Seny & Rauxa', '🧠', 'SRXA', 'El duet etern de la cultura catalana.', 0.25, 0.0001, 0, true),
  ('Caganer', '💩', 'CGNR', 'El sentit de l''humor català en el pessebre.', 0.08, 0.0001, 0, true),
  ('Sardana Loop', '💃', 'TYET', 'La dansa tradicional en loop infinit.', 0.22, 0.0001, 0, true),
  ('Peatges 3.0', '💶', 'CARS', 'Tecnologia aplicada al noble art de pagar.', 0.3, 0.0001, 0, true),
  ('Queta', '🏔️', 'QETA', 'Una boca que parla: el català en acció.', 0.5, 0.0001, 0, true);

-- Crear buffers per cada token
INSERT INTO admin_buffer (product_id, fractions, consolidated_eur, updated_at)
SELECT id, 0, 0, NOW() FROM products;

-- Verificar
SELECT 'Tokens creats:' as info, COUNT(*) as total FROM products;
SELECT name, emoji, ticker, p0 FROM products;