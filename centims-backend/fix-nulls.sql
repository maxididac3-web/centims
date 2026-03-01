UPDATE products SET created_by = 1 WHERE created_by IS NULL;
UPDATE transactions SET admin_fractions = 0 WHERE admin_fractions IS NULL;
