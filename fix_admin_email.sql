-- ========================================
-- FIX ADMIN EMAIL - FINALNO REŠENJE
-- ========================================
-- Kopirajte i pokrenite ovaj kod u Supabase SQL Editor-u

-- 1. Prvo proverite da li postoji korisnik sa starim emailom
SELECT email, role, first_name, last_name 
FROM korisnici 
WHERE email = 'timeforbeauty67n@gmail.com';

-- 2. Ako postoji korisnik sa starim emailom, obrišite ga
DELETE FROM korisnici 
WHERE email = 'timeforbeauty67n@gmail.com';

-- 3. Dodajte ili ažurirajte korisnika sa ispravnim emailom
INSERT INTO korisnici (email, role, first_name, last_name, phone, created_at)
VALUES (
    'timeforbeauty67@gmail.com',
    'admin',
    'Jelena',
    'Papic',
    '+063 220 665',
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    role = 'admin',
    first_name = 'Jelena',
    last_name = 'Papic',
    phone = '+063 220 665',
    updated_at = NOW();

-- 4. Proverite da li je ispravka uspešna
SELECT email, role, first_name, last_name, created_at 
FROM korisnici 
WHERE email = 'timeforbeauty67@gmail.com';

-- 5. Proverite sve admin korisnike
SELECT email, role, first_name, last_name, created_at 
FROM korisnici 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ========================================
-- UPUTSTVO:
-- ========================================
-- 1. Pokrenite ovaj skript u Supabase SQL Editor-u
-- 2. Admin korisnik sa emailom timeforbeauty67@gmail.com će biti spreman
-- 3. Možete se ulogovati sa ispravnim emailom
