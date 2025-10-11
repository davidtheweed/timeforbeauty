-- ========================================
-- AŽURIRANJE POSTOJEĆEG ADMIN KORISNIKA
-- ========================================

-- 1. Proveri da li korisnik već postoji
SELECT email, role, first_name, last_name, phone, created_at 
FROM korisnici 
WHERE email = 'timeforbeauty67@gmail.com';

-- 2. Ažuriraj postojećeg korisnika da bude admin
UPDATE korisnici 
SET 
    role = 'admin',
    first_name = 'Jelena',
    last_name = 'Papic',
    phone = '+063 220 665'
WHERE email = 'timeforbeauty67@gmail.com';

-- 3. Proveri da li je ažuriranje uspešno
SELECT email, role, first_name, last_name, phone, created_at 
FROM korisnici 
WHERE email = 'timeforbeauty67@gmail.com';

-- 4. Testiraj admin status
SELECT is_admin() as admin_status;

-- 5. Alternativno - ako želite da dodate korisnika samo ako ne postoji
-- (koristite ovo umesto INSERT komande)
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

-- 6. Proveri sve admin korisnike
SELECT email, role, first_name, last_name, created_at 
FROM korisnici 
WHERE role = 'admin'
ORDER BY created_at DESC;


