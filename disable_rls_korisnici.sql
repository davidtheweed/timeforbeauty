-- ========================================
-- ALTERNATIVNI PRISTUP - UKLONI RLS ZA KORISNICI
-- ========================================

-- 1. UKLONI SVE POLITIKE ZA KORISNICI TABELU
DROP POLICY IF EXISTS "Users can check their own role" ON korisnici;
DROP POLICY IF EXISTS "Admins can access all users" ON korisnici;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable update for users based on email" ON korisnici;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON korisnici;
DROP POLICY IF EXISTS "Simple access policy" ON korisnici;

-- 2. ONEMOGUĆI RLS ZA KORISNICI TABELU
ALTER TABLE korisnici DISABLE ROW LEVEL SECURITY;

-- 3. KREIRAJ JEDNOSTAVNU is_admin() FUNKCIJU
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Proveri hardkodovane admin emailove
    IF auth.email() = 'davidheh15@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Proveri ulogu iz baze podataka (sada bez RLS problema)
    RETURN EXISTS (
        SELECT 1 
        FROM korisnici 
        WHERE email = auth.email() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DODAJ ADMIN KORISNIKA
INSERT INTO korisnici (email, role)
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- 5. TEST FUNKCIJA
CREATE OR REPLACE FUNCTION test_admin_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'current_email', auth.email(),
        'is_admin_function', is_admin(),
        'has_korisnici_record', EXISTS (
            SELECT 1 FROM korisnici WHERE email = auth.email()
        ),
        'role_from_db', (
            SELECT role FROM korisnici WHERE email = auth.email()
        ),
        'rls_disabled', TRUE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. DOZVOLI PRISTUP
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;
GRANT SELECT ON admin_appointments TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;

-- 7. FINALNI TEST
SELECT 
    'RLS Disabled for korisnici' as status,
    auth.email() as current_user,
    is_admin() as is_admin_result;
