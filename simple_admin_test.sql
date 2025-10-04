-- ========================================
-- JEDNOSTAVAN TEST ADMIN AUTENTIFIKACIJE
-- ========================================

-- 1. Test da li je korisnik autentifikovan
SELECT 
    auth.email() as current_user_email,
    auth.uid() as current_user_id;

-- 2. Test da li postoji admin email u hardkodovanim
SELECT 
    'davidheh15@gmail.com' as hardcoded_admin,
    CASE 
        WHEN auth.email() = 'davidheh15@gmail.com' 
        THEN 'MATCH - Hardcoded admin' 
        ELSE 'NO MATCH - Not hardcoded admin' 
    END as hardcoded_check;

-- 3. Test da li postoji korisnik u bazi
SELECT 
    email,
    role,
    'EXISTS' as status
FROM korisnici 
WHERE email = auth.email();

-- 4. Test is_admin() funkciju
SELECT 
    is_admin() as is_admin_result;

-- 5. Kreiraj admin korisnika ako ne postoji
INSERT INTO korisnici (email, role)
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- 6. Ponovni test is_admin() funkciju
SELECT 
    is_admin() as is_admin_result_after_insert;
