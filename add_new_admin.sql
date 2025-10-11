-- ========================================
-- DODAVANJE NOVOG ADMINA U BAZU PODATAKA
-- ========================================

-- 1. Dodaj novog admin korisnika u korisnici tabelu
INSERT INTO korisnici (email, role, first_name, last_name, phone, created_at)
VALUES (
    'novi.admin@gmail.com',  -- Zamenite sa stvarnim emailom
    'admin',                 -- Admin uloga
    'Ime',                   -- Ime admina
    'Prezime',               -- Prezime admina
    '+381123456789',         -- Telefon (opciono)
    NOW()                    -- Trenutno vreme
);

-- 2. Proveri da li je korisnik dodat
SELECT * FROM korisnici WHERE email = 'novi.admin@gmail.com';

-- 3. Testiraj admin funkciju
SELECT is_admin() as admin_status;

-- 4. Ako želite da dodate više admina odjednom:
/*
INSERT INTO korisnici (email, role, first_name, last_name, phone, created_at)
VALUES 
    ('admin1@gmail.com', 'admin', 'Admin', 'Jedan', '+381111111111', NOW()),
    ('admin2@gmail.com', 'admin', 'Admin', 'Dva', '+381222222222', NOW()),
    ('admin3@gmail.com', 'admin', 'Admin', 'Tri', '+381333333333', NOW());
*/

-- ========================================
-- UPUTSTVO:
-- ========================================
-- 1. Zamenite 'novi.admin@gmail.com' sa stvarnim emailom
-- 2. Zamenite 'Ime' i 'Prezime' sa stvarnim imenima
-- 3. Zamenite telefon sa stvarnim brojem (ili ostavite prazno)
-- 4. Pokrenite SQL u Supabase SQL Editor-u
-- 5. Testirajte login sa novim admin emailom


