-- ========================================
-- PROVERA STRUKTURE TABELE KORISNICI
-- ========================================

-- 1. Proveri strukturu tabele korisnici
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'korisnici' 
ORDER BY ordinal_position;

-- 2. Proveri da li postoji primary key ili unique constraint
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'korisnici';

-- 3. Proveri postojeće podatke u tabeli
SELECT * FROM korisnici LIMIT 5;

