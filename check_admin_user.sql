-- ========================================
-- PROVERA ADMIN KORISNIKA
-- ========================================

-- 1. Proveri da li je Jelena Papic dodana u bazu
SELECT * FROM korisnici WHERE email = 'timeforbeauty67@gmail.com';

-- 2. Proveri sve admin korisnike
SELECT email, role, first_name, last_name, created_at 
FROM korisnici 
WHERE role = 'admin';

-- 3. Proveri trenutnog korisnika (ako ste ulogovani)
SELECT auth.uid() as current_user_id;

-- 4. Testiraj is_admin funkciju sa konkretnim emailom
SELECT is_admin('timeforbeauty67@gmail.com') as admin_status_for_jelena;

-- 5. Proveri da li RLS blokira pristup
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'korisnici';

-- 6. Ako is_admin() ne radi, probaj direktnu proveru
SELECT 
    email,
    role,
    CASE 
        WHEN role = 'admin' THEN true 
        ELSE false 
    END as is_admin_check
FROM korisnici 
WHERE email = 'timeforbeauty67@gmail.com';


